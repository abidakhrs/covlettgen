import type { RequestSettings } from "./ai";

function num(v: unknown, min: number, max: number): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

export function settingsFromBody(
  body: Record<string, unknown>,
): RequestSettings {
  return {
    apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
    apiUrl: typeof body.apiUrl === "string" ? body.apiUrl : undefined,
    model: typeof body.model === "string" ? body.model : undefined,
    temperature: num(body.temperature, 0, 2),
    topP: num(body.topP, 0, 1),
    topK: num(body.topK, 0, 200),
    maxTokens: num(body.maxTokens, 1, 32000),
    frequencyPenalty: num(body.frequencyPenalty, -2, 2),
    presencePenalty: num(body.presencePenalty, -2, 2),
    seed: num(body.seed, 0, Number.MAX_SAFE_INTEGER),
  };
}
