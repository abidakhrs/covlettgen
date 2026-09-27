import { NextResponse } from "next/server";
import {
  generateCoverLetter,
  type RequestSettings,
} from "@/lib/ai";
import { fetchProfileFacts } from "@/lib/profile-source";
import { fetchGithubFacts } from "@/lib/github-source";
import { settingsFromBody } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 60;

const MISSING_LABELS: Record<string, string> = {
  jobTitle: "Job Title",
  companyName: "Company Name",
  companyLocation: "Company Location",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const jobDescription = String(body.jobDescription ?? "").trim();
    const companyName = String(body.companyName ?? "").trim();
    const companyLocation = String(body.companyLocation ?? "").trim();
    const jobTitle = String(body.jobTitle ?? "").trim();

    const resumeText = String(body.resumeText ?? "").trim().slice(0, 20000);
    const portfolioUrl = String(body.portfolioUrl ?? "").trim();
    const githubUrl = String(body.githubUrl ?? "").trim();
    const extraNotes = String(body.extraNotes ?? "").trim().slice(0, 4000);

    const settings: RequestSettings = settingsFromBody(body);

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 },
      );
    }

    const sources: { kind: string; url: string; ok: boolean; note?: string }[] =
      [];
    const facts: string[] = [];

    const tasks: Promise<void>[] = [];

    if (portfolioUrl) {
      tasks.push(
        fetchProfileFacts(portfolioUrl, settings)
          .then((r) => {
            if (r.facts) facts.push(`PORTFOLIO (${r.url}):\n${r.facts}`);
            sources.push({ kind: "portfolio", url: r.url, ok: Boolean(r.facts) });
          })
          .catch((e) => {
            sources.push({
              kind: "portfolio",
              url: portfolioUrl,
              ok: false,
              note: e instanceof Error ? e.message : "failed",
            });
          }),
      );
    }

    if (githubUrl) {
      tasks.push(
        fetchGithubFacts(githubUrl, settings)
          .then((r) => {
            if (r.facts) facts.push(`GITHUB (${r.url}):\n${r.facts}`);
            sources.push({ kind: "github", url: r.url, ok: Boolean(r.facts) });
          })
          .catch((e) => {
            sources.push({
              kind: "github",
              url: githubUrl,
              ok: false,
              note: e instanceof Error ? e.message : "failed",
            });
          }),
      );
    }

    await Promise.all(tasks);

    if (extraNotes) {
      facts.push(`APPLICANT'S OWN NOTES:\n${extraNotes}`);
    }

    const letter = await generateCoverLetter(
      {
        jobDescription,
        companyName,
        companyLocation,
        jobTitle,
        resumeText: resumeText || undefined,
        extraProfile: facts.length ? facts.join("\n\n") : undefined,
        usingPageProfile: Boolean(facts.length),
      },
      settings,
    );

    const values: Record<string, string> = {
      jobTitle,
      companyName,
      companyLocation,
    };
    const warnings = Object.entries(MISSING_LABELS)
      .filter(([key]) => !values[key])
      .map(([key, label]) => ({
        key,
        label,
        reason: `Missing ${label.toLowerCase()}; the letter was written without it.`,
      }));

    return NextResponse.json({
      letter,
      warnings,
      sources,
      resume: resumeText
        ? { chars: resumeText.length, used: true }
        : { chars: 0, used: false },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
