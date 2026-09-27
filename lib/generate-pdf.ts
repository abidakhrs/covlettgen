import { letterHeader, type LetterMeta } from "./letter";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function generateLetterHtml(body: string, meta: LetterMeta): string {
  const header = escapeHtml(letterHeader(meta))
    .split("\n")
    .map((line) => `<div class="line">${line || "&nbsp;"}</div>`)
    .join("");

  const paragraphs = escapeHtml(body.trim())
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.replace(/\n/g, " ")}</p>`)
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Cover Letter - ${escapeHtml(meta.companyName)}</title>
<style>
  @page { size: A4; margin: 25mm 22mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Calibri, "Segoe UI", Arial, sans-serif;
    font-size: 11.5pt;
    line-height: 1.5;
    color: #111;
    margin: 0;
  }
  .header { margin-bottom: 28px; }
  .header .line:first-child { font-weight: 700; font-size: 13.5pt; }
  p { margin: 0 0 14px; text-align: justify; }
  @media print {
    body { margin: 0; }
  }
</style>
</head>
<body>
  <div class="header">${header}</div>
  <div class="body">${paragraphs}</div>
</body>
</html>`;
}
