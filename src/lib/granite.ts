import OpenAI from "openai";

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

function makeClient(token: string): OpenAI {
  const baseUrl = assertEnv("WATSONX_URL");
  const projectId = assertEnv("WATSONX_PROJECT_ID");
  return new OpenAI({
    baseURL: `${baseUrl}/ml/v1/text`,
    apiKey: token,
    defaultQuery: {
      version: "2025-03-01",
      project_id: projectId,
    },
    defaultHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function analyzeImage(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const token = await getToken();
  const client = makeClient(token);

  const response = await client.chat.completions.create({
    model: "ibm/granite-vision-4-1-4b",
    messages: [
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
    max_tokens: 2000,
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const token = await getToken();
  const client = makeClient(token);

  const response = await client.chat.completions.create({
    model: "ibm/granite-4-1-8b-instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? "";
}
