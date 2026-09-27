import { NextResponse } from "next/server";
import { fetchPage, type PageInfo } from "@/lib/fetch-page";
import { extractFromPages, type ExtractResult } from "@/lib/extract";
import { settingsFromBody } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 60;

const PRIORITY = /about|contact|company|location|career|team/i;
const JOB_PATH =
  /\/(jobs?|positions?|openings?|vacanc(?:y|ies)|postings?|careers?|apply)\b/i;

function sameSite(a: string, b: string): boolean {
  try {
    const ha = new URL(a).hostname.replace(/^www\./, "");
    const hb = new URL(b).hostname.replace(/^www\./, "");
    return ha === hb;
  } catch {
    return false;
  }
}

function isJobPath(u: string): boolean {
  try {
    return JOB_PATH.test(new URL(u).pathname);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = String(body.url ?? "").trim();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const primary = await fetchPage(url);
    const pages: PageInfo[] = [primary];

    const primaryIsJob = isJobPath(primary.url);

    const candidates = primary.links
      .filter((l) => {
        if (!sameSite(l, primary.url) || l === primary.url) return false;
        if (isJobPath(l)) return false;
        return primaryIsJob || PRIORITY.test(l);
      })
      .sort((a, b) => {
        const pa = PRIORITY.test(a) ? 0 : 1;
        const pb = PRIORITY.test(b) ? 0 : 1;
        return pa - pb;
      })
      .slice(0, 2);

    const extra = await Promise.all(
      candidates.map((c) => fetchPage(c).catch(() => null)),
    );
    for (const p of extra) if (p) pages.push(p);

    if (pages.length === 1 && !primaryIsJob) {
      const guessUrl = new URL("/contact", primary.url).toString();
      const guess = await fetchPage(guessUrl).catch(() => null);
      if (guess) pages.push(guess);
    }

    const result: ExtractResult = await extractFromPages(
      pages.map((p) => ({ url: p.url, title: p.title, text: p.text })),
      settingsFromBody(body),
    );

    return NextResponse.json({
      ...result,
      fetched: pages.map((p) => ({
        url: p.url,
        title: p.title,
        chars: p.text.length,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
