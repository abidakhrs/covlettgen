import { buildPrompt, type GenerateInput } from "./prompt";

export type RequestSettings = {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
};

export const DEFAULT_SETTINGS = {
  apiUrl: "https://rootsys.cloud/v1/chat/completions",
  model: "deepseek-v4-flash",
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = RequestSettings & {
  json?: boolean;
};

export function resolveSettings(overrides: RequestSettings = {}) {
  return {
    apiUrl:
      overrides.apiUrl?.trim() ||
      process.env.AI_API_URL ||
      DEFAULT_SETTINGS.apiUrl,
    apiKey: overrides.apiKey?.trim() || process.env.AI_API_KEY || "",
    model:
      overrides.model?.trim() ||
      process.env.AI_MODEL ||
      DEFAULT_SETTINGS.model,
  };
}

function clean(obj: Record<string, unknown>) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined || obj[key] === null) delete obj[key];
  }
  return obj;
}

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const { apiUrl, apiKey, model } = resolveSettings(options);

  if (!apiKey) {
    throw new Error("No API key set. Add one in Settings.");
  }

  const payload = clean({
    model,
    messages,
    temperature: options.temperature,
    top_p: options.topP,
    top_k: options.topK,
    max_tokens: options.maxTokens,
    frequency_penalty: options.frequencyPenalty,
    presence_penalty: options.presencePenalty,
    seed: options.seed,
    response_format: options.json ? { type: "json_object" } : undefined,
  });

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error(
      `Could not reach the AI endpoint: ${
        err instanceof Error ? err.message : "network error"
      }`,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI API error ${res.status}: ${detail.slice(0, 500)}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI API returned no content");
  }

  return content.trim();
}

export async function generateCoverLetter(
  input: GenerateInput,
  settings: RequestSettings = {},
): Promise<string> {
  const { system, user } = buildPrompt(input);
  return chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    settings,
  );
}
