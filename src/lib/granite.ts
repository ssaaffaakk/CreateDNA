// watsonx.ai model IDs. Granite 4.1 chat/vision models are not offered on the
// Lite plan, so we use the closest available equivalents:
//   - Text: IBM Granite 4-h-small (native IBM Granite instruct model)
//   - Vision: Llama 4 Maverick (multimodal; Granite Vision is plan-gated)
const TEXT_MODEL = "ibm/granite-4-h-small";
const VISION_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct-fp8";

function assertEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

const IAM_TIMEOUT_MS = 10_000;
const CHAT_TIMEOUT_MS = 90_000;

async function getIAMToken(): Promise<string> {
  const apiKey = assertEnv("WATSONX_API_KEY");
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(apiKey)}`,
    signal: AbortSignal.timeout(IAM_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IAM token exchange failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("IAM response missing access_token");
  }
  return data.access_token;
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  cachedToken = await getIAMToken();
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken;
}

interface ChatMessage {
  role: string;
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

function isTimeout(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "TimeoutError" || err.name === "AbortError")
  );
}

const MAX_ATTEMPTS = 3;

async function chatCompletion(
  modelId: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  const baseUrl = assertEnv("WATSONX_URL");
  const projectId = assertEnv("WATSONX_PROJECT_ID");

  let lastError: Error = new Error("watsonx request failed");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      const token = await getToken();
      res = await fetch(`${baseUrl}/ml/v1/text/chat?version=2025-03-01`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: modelId,
          project_id: projectId,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        // Without a signal, a stalled upstream call hangs the route forever and
        // the UI spinner never resolves.
        signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
      });
    } catch (err) {
      lastError = isTimeout(err)
        ? new Error("watsonx request timed out — please retry")
        : err instanceof Error
          ? err
          : new Error(String(err));
      // A 400/401/403/404 from IAM means the API key itself was rejected —
      // not a transient fault, so retrying only delays the error. (429 and
      // 5xx from IAM stay retryable.)
      if (/IAM token exchange failed \((400|401|403|404)\)/.test(lastError.message)) {
        throw lastError;
      }
      if (attempt < MAX_ATTEMPTS) {
        await delay(attempt);
        continue;
      }
      throw lastError;
    }

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    const errText = await res.text();

    // A cached token rejected upstream is unrecoverable until we re-exchange it.
    if (res.status === 401 || res.status === 403) {
      cachedToken = null;
      tokenExpiry = 0;
    }

    lastError = new Error(`watsonx API error (${res.status}): ${errText}`);

    const retryable = res.status === 429 || res.status >= 500 || res.status === 401;
    if (!retryable || attempt === MAX_ATTEMPTS) throw lastError;

    await delay(attempt);
  }

  throw lastError;
}

function delay(attempt: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
}

export async function analyzeImage(
  imageBase64: string,
  prompt: string
): Promise<string> {
  return chatCompletion(
    VISION_MODEL,
    [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    2000,
    0.1
  );
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  return chatCompletion(
    TEXT_MODEL,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    2000,
    0.7
  );
}
