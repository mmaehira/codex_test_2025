import { requireEnv } from "./env";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

interface OpenAIResponse {
  choices: Array<{ message?: { content?: string } }>;
}

export async function createChatCompletion(
  body: Record<string, unknown>
): Promise<string> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as OpenAIResponse;
  const content = payload.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAIからの応答が空です。");
  }
  return content;
}

export async function createSpeech(
  body: Record<string, unknown>
): Promise<Buffer> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const response = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS error: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function withRetry<T>(
  task: () => Promise<T>,
  maxAttempts = 2
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }
  throw lastError;
}
