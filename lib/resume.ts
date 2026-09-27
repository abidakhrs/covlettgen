const MAX_BYTES = 8 * 1024 * 1024;

type PdfParse = (
  data: Buffer,
  options?: Record<string, unknown>,
) => Promise<{ text?: string; numpages?: number }>;

export type ResumeResult = {
  filename: string;
  kind: "pdf" | "docx" | "text";
  text: string;
  chars: number;
};

function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractResume(file: {
  name: string;
  buffer: Buffer;
}): Promise<ResumeResult> {
  const { name, buffer } = file;

  if (!buffer.length) {
    throw new Error("The uploaded file is empty.");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Resume file is too large (max 8 MB).");
  }

  const lower = name.toLowerCase();

  if (lower.endsWith(".pdf")) {
    // Import the inner module directly: pdf-parse's index.js runs a debug-mode
    // test-file read that breaks under bundlers.
    const mod = (await import("pdf-parse/lib/pdf-parse.js")) as unknown as {
      default?: PdfParse;
    } & PdfParse;

    const pdfParse = (mod.default ?? mod) as PdfParse;

    let text = "";
    try {
      const result = await pdfParse(buffer);
      text = normalize(result?.text ?? "");
    } catch {
      throw new Error(
        "Could not read that PDF. It may be corrupted, password-protected, or not a real PDF.",
      );
    }
    if (!text) {
      throw new Error(
        "No text found in that PDF. It may be a scan or image-only file.",
      );
    }
    return { filename: name, kind: "pdf", text, chars: text.length };
  }

  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    let text = "";
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = normalize(result.value ?? "");
    } catch {
      throw new Error(
        "Could not read that DOCX file. It may be corrupted or renamed.",
      );
    }
    if (!text) throw new Error("No text found in that DOCX file.");
    return { filename: name, kind: "docx", text, chars: text.length };
  }

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    const text = normalize(buffer.toString("utf8"));
    if (!text) throw new Error("That text file is empty.");
    return { filename: name, kind: "text", text, chars: text.length };
  }

  if (lower.endsWith(".doc")) {
    throw new Error(
      "Legacy .doc files are not supported. Save as .docx or PDF and try again.",
    );
  }

  throw new Error("Unsupported file type. Use PDF, DOCX, TXT or MD.");
}
