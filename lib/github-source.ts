import { chat, type RequestSettings } from "./ai";

const MAX_REPOS = 30;

function parseUsername(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!trimmed) throw new Error("Enter a GitHub username or URL.");

  const m = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]+)/i,
  );
  const username = m ? m[1] : trimmed;
  if (!/^[A-Za-z0-9-]+$/.test(username)) {
    throw new Error(`Could not read a GitHub username from "${input}".`);
  }
  return username;
}

async function gh(url: string) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "covelettgen/1.0",
    },
  });
  if (res.status === 404) throw new Error("GitHub user not found.");
  if (res.status === 403) {
    throw new Error("GitHub rate limit reached. Try again later.");
  }
  if (!res.ok) throw new Error(`GitHub request failed (${res.status}).`);
  return res.json();
}

type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
};

export async function fetchGithubFacts(
  input: string,
  settings: RequestSettings = {},
): Promise<{
  url: string;
  facts: string;
}> {
  const username = parseUsername(input);

  const [user, repos] = await Promise.all([
    gh(`https://api.github.com/users/${encodeURIComponent(username)}`),
    gh(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
    ),
  ]);

  const own = (Array.isArray(repos) ? (repos as Repo[]) : [])
    .filter((r) => !r.fork && !r.archived)
    .slice(0, MAX_REPOS);

  const languages = [
    ...new Set(own.map((r) => r.language).filter(Boolean) as string[]),
  ];

  const repoLines = own
    .map((r) => {
      const bits = [
        `- ${r.name}${r.language ? ` (${r.language})` : ""}${
          r.description ? `: ${r.description}` : ""
        }`,
      ];
      if (r.topics?.length) bits.push(`  Topics: ${r.topics.join(", ")}`);
      if (r.homepage) bits.push(`  Live: ${r.homepage}`);
      return bits.join("\n");
    })
    .join("\n");

  const raw = [
    `GitHub: ${user.html_url ?? `https://github.com/${username}`}`,
    user.name ? `Name: ${user.name}` : "",
    user.bio ? `Bio: ${user.bio}` : "",
    user.company ? `Company: ${user.company}` : "",
    user.location ? `Location: ${user.location}` : "",
    user.blog ? `Website: ${user.blog}` : "",
    languages.length ? `Languages: ${languages.join(", ")}` : "",
    "",
    `Public repositories (${own.length}):`,
    repoLines || "- (none)",
  ]
    .filter(Boolean)
    .join("\n");

  const facts = await condense(raw, user.name || username, settings);

  return { url: `https://github.com/${username}`, facts };
}

const SYSTEM = `You summarise a developer's GitHub profile into factual background for a job application.

Return ONLY a JSON object: { "facts": string }

RULES:
- "facts" is plain text bullets: concrete skills, stacks, tools, project names and what each does.
- Base every statement strictly on the supplied GitHub data. Never invent.
- Call out the strongest and most recent projects first.
- Skip forks, trivia, star counts and anything promotional.
- If the data describes no meaningful work, return "".
- Keep it under 200 words.`;

async function condense(
  raw: string,
  name: string,
  settings: RequestSettings,
): Promise<string> {
  const out = await chat(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Developer: ${name}\n\nGitHub data:\n\n${raw}`,
      },
    ],
    { ...settings, json: true, temperature: settings.temperature ?? 0.2 },
  );

  const json = out.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(json) as { facts?: unknown };
    return typeof parsed.facts === "string" ? parsed.facts.trim() : "";
  } catch {
    return "";
  }
}
