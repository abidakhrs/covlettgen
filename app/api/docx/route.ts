import { NextResponse } from "next/server";
import { generateDocx } from "@/lib/generate-docx";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const letter = String(body.letter ?? "").trim();
    if (!letter) {
      return NextResponse.json({ error: "Missing letter" }, { status: 400 });
    }

    const buf = await generateDocx(letter, {
      companyName: String(body.companyName ?? "").trim(),
      companyLocation: String(body.companyLocation ?? "").trim(),
      jobTitle: String(body.jobTitle ?? "").trim(),
    });

    const company = String(body.companyName ?? "cover-letter")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="cover-letter-${company || "application"}.docx"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
