import { chat, type RequestSettings } from "./ai";

export type ExtractedJob = {
  jobTitle: string;
  companyName: string;
  companyLocation: string;
  jobDescription: string;
};

export type Missing = {
  key: keyof ExtractedJob;
  label: string;
  reason: string;
};

export type ExtractResult = {
  job: ExtractedJob;
  confidence: "high" | "medium" | "low";
  missing: Missing[];
  sources: string[];
  note: string;
};

const EMPTY_JOB: ExtractedJob = {
  jobTitle: "",
  companyName: "",
  companyLocation: "",
  jobDescription: "",
};

export const FIELD_LABELS: Record<keyof ExtractedJob, string> = {
  jobTitle: "Job Title",
  companyName: "Company Name",
  companyLocation: "Company Location",
  jobDescription: "Job Description",
};

const SYSTEM = `You extract structured job posting data from web page content.

Return ONLY a JSON object with exactly these keys:
{
  "jobTitle": string,
  "companyName": string,
  "companyLocation": string,
  "jobDescription": string,
  "confidence": "high" | "medium" | "low",
  "missing": [{ "key": "jobTitle"|"companyName"|"companyLocation"|"jobDescription", "reason": string }],
  "note": string
}

RULES:
- Use "" for any field you cannot determine. Never guess or invent a value.
- "jobDescription" must be a clean, complete plain-text description of the role:
  responsibilities, requirements, skills and qualifications found on the page.
  Remove navigation, cookie notices, ads, "apply now" buttons and unrelated text.
- "companyLocation" is the work location of the role if stated, otherwise the company HQ.
- "confidence" reflects how completely and reliably you could extract the data.
- "missing" lists every field left as "", with a short reason and, when possible,
  advice on where the value could be found on the given page.
- "note" is one short sentence for the user.`;

export async function extractFromPages(
  pages: { url: string; title: string; text: string }[],
  settings: RequestSettings = {},
): Promise<ExtractResult> {
  const corpus = pages
    .map(
      (p, i) =>
        `--- SOURCE ${i + 1}: ${p.url}\nTITLE: ${p.title}\n\n${p.text}`,
    )
    .join("\n\n");

  const raw = await chat(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Extract the job posting data from these page(s):\n\n${corpus}`,
      },
    ],
    { ...settings, json: true, temperature: settings.temperature ?? 0.2 },
  );

  return parseExtraction(raw, pages.map((p) => p.url));
}

export function parseExtraction(
  raw: string,
  sources: string[],
): ExtractResult {
  const json = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("AI returned unreadable extraction data");
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const job: ExtractedJob = {
    jobTitle: str(data.jobTitle),
    companyName: str(data.companyName),
    companyLocation: str(data.companyLocation),
    jobDescription: str(data.jobDescription),
  };

  const missing: Missing[] = (Object.keys(FIELD_LABELS) as (keyof ExtractedJob)[])
    .filter((key) => !job[key])
    .map((key) => {
      const listed = Array.isArray(data.missing)
        ? (data.missing as { key?: unknown; reason?: unknown }[]).find(
            (m) => m.key === key,
          )
        : undefined;
      return {
        key,
        label: FIELD_LABELS[key],
        reason: str(listed?.reason) || "Not found on the page.",
      };
    });

  const confidence =
    data.confidence === "high" || data.confidence === "medium"
      ? data.confidence
      : missing.length === 0 && job.jobDescription
        ? "medium"
        : "low";

  return {
    job,
    confidence,
    missing,
    sources,
    note: str(data.note),
  };
}

export { EMPTY_JOB };
