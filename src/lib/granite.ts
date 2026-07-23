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

async function getIAMToken(): Promise<string> {
  const apiKey = assertEnv("WATSONX_API_KEY");
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
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

async function chatCompletion(
  modelId: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  const token = await getToken();
  const baseUrl = assertEnv("WATSONX_URL");
  const projectId = assertEnv("WATSONX_PROJECT_ID");

  const res = await fetch(
    `${baseUrl}/ml/v1/text/chat?version=2025-03-01`,
    {
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
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`watsonx API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
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
