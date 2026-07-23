import OpenAI from "openai";

async function getIAMToken(): Promise<string> {
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${process.env.WATSONX_API_KEY}`,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IAM token error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  cachedToken = await getIAMToken();
  // IAM tokens last 1 hour; refresh 5 minutes early
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken;
}

function makeClient(token: string): OpenAI {
  // watsonx.ai OpenAI-compatible endpoint.
  // baseURL must be a clean path — query params go in defaultQuery
  // so the SDK can correctly append /chat/completions to the path.
  return new OpenAI({
    baseURL: `${process.env.WATSONX_URL}/ml/v1/text`,
    apiKey: token,
    defaultQuery: {
      version: "2025-03-01",
      project_id: process.env.WATSONX_PROJECT_ID,
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
    // watsonx.ai model IDs use the "ibm/" namespace prefix
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
