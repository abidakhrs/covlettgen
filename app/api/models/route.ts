import { NextResponse } from "next/server";
import { resolveSettings } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiUrl, apiKey } = resolveSettings({
      apiUrl: body.apiUrl,
      apiKey: body.apiKey,
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "Add an API key first." },
        { status: 400 },
      );
    }

    const modelsUrl = new URL(apiUrl);
    modelsUrl.pathname = modelsUrl.pathname.replace(
      /\/chat\/completions\/?$/,
      "/models",
    );
    if (!modelsUrl.pathname.endsWith("/models")) modelsUrl.pathname = "/v1/models";

    const res = await fetch(modelsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Model list failed (${res.status}): ${detail.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const ids: string[] = Array.isArray(data?.data)
      ? data.data
          .map((m: { id?: unknown }) => (typeof m?.id === "string" ? m.id : ""))
          .filter(Boolean)
      : [];

    return NextResponse.json({ models: ids });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
