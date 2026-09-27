import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 1024 * 1024;

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const p = ip.split(".").map(Number);
    return (
      p[0] === 10 ||
      p[0] === 127 ||
      p[0] === 0 ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      (p[0] === 169 && p[1] === 254)
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  );
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Refusing to fetch a local address");
  }
  const resolved = await lookup(hostname, { all: true });
  if (!resolved.length) {
    throw new Error("Could not resolve host");
  }
  for (const { address } of resolved) {
    if (isPrivateIp(address)) {
      throw new Error("Refusing to fetch a private address");
    }
  }
}

export type PageInfo = {
  url: string;
  title: string;
  text: string;
  links: string[];
};

function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "\u2013",
    mdash: "\u2014",
    hellip: "\u2026",
  };
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => named[n.toLowerCase()] ?? m);
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\/(p|div|h[1-6]|li|tr|section|article|header|footer|br)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTitle(html: string): string {
  const m =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : "";
}

function extractLinks(html: string, baseUrl: string): string[] {
  const out = new Set<string>();
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const abs = new URL(m[1], baseUrl).toString();
      if (!abs.startsWith("http")) continue;
      if (/\.(png|jpe?g|gif|svg|webp|ico|css|js|pdf)(\?|$)/i.test(abs)) continue;
      out.add(abs);
    } catch {
      // ignore malformed hrefs
    }
  }
  return [...out];
}

export async function fetchPage(rawUrl: string): Promise<PageInfo> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error(`Not a valid URL: ${rawUrl}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }

  await assertPublicHost(url.hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; covelettgen/1.0; +https://example.com)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`Fetch failed with status ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
    throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
  }

  const reader = res.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      chunks.push(value);
      if (total >= MAX_BYTES) {
        await reader.cancel().catch(() => {});
        break;
      }
    }
  }

  const html = Buffer.concat(chunks.map((c) => Buffer.from(c)))
    .toString("utf8")
    .slice(0, MAX_BYTES);

  const finalUrl = res.url || url.toString();

  return {
    url: finalUrl,
    title: extractTitle(html),
    text: htmlToText(html).slice(0, 20000),
    links: extractLinks(html, finalUrl).slice(0, 80),
  };
}
