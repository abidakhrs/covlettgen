import { fetchPage } from "./fetch-page";
import { applicant } from "./applicant-profile";
import { chat, type RequestSettings } from "./ai";

const SYSTEM = `You extract factual background about a job applicant from their own website.

Return ONLY a JSON object:
{ "facts": string }

RULES:
- "facts" is plain text: short bullets of concrete, verifiable facts about the person -
  skills, tools, roles, projects, education, achievements.
- Only include facts clearly about the applicant. Skip testimonials, pricing, navigation,
  marketing slogans, and anything vague or promotional.
- If the page does not describe the person, return an empty string.
- Never invent anything.`;

export async function fetchProfileFacts(
  url: string,
  settings: RequestSettings = {},
): Promise<{ url: string; facts: string }> {
  const page = await fetchPage(url);
  const raw = await chat(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Applicant name: ${applicant.name}\n\nWebsite content:\n\nTITLE: ${page.title}\n${page.text}`,
      },
    ],
    { ...settings, json: true, temperature: settings.temperature ?? 0.2 },
  );

  const json = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let facts = "";
  try {
    const parsed = JSON.parse(json) as { facts?: unknown };
    if (typeof parsed.facts === "string") facts = parsed.facts.trim();
  } catch {
    facts = "";
  }

  return { url: page.url, facts };
}
