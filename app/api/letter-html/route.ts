import { generateLetterHtml } from "@/lib/generate-pdf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();

  const letter = String(body.letter ?? "").trim();
  if (!letter) {
    return new Response("Missing letter", { status: 400 });
  }

  const html = generateLetterHtml(letter, {
    companyName: String(body.companyName ?? "").trim(),
    companyLocation: String(body.companyLocation ?? "").trim(),
    jobTitle: String(body.jobTitle ?? "").trim(),
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
