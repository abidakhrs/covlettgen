import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";
import { applicant } from "./applicant-profile";
import { letterHeader, type LetterMeta } from "./letter";

export async function generateDocx(
  body: string,
  meta: LetterMeta,
): Promise<Buffer> {
  const headerLines = letterHeader(meta).split("\n");

  const children: Paragraph[] = headerLines.map((line, idx) => {
    const isName = idx === 0;
    return new Paragraph({
      spacing: { after: line === "" ? 120 : 0 },
      children: [
        new TextRun({
          text: line,
          bold: isName,
          size: isName ? 26 : 22,
          font: "Calibri",
        }),
      ],
    });
  });

  children.push(new Paragraph({ spacing: { after: 240 }, children: [] }));

  const paragraphs = body
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);

  for (const [i, p] of paragraphs.entries()) {
    const isSignature = p === applicant.name || p.startsWith("Yours sincerely");
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: isSignature ? 0 : 240, line: 360 },
        children: [
          new TextRun({
            text: p,
            size: 22,
            font: "Calibri",
            bold: p === applicant.name,
          }),
        ],
      }),
      ...(i === paragraphs.length - 1 ? [] : []),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
