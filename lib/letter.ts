import { applicant } from "./applicant-profile";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type LetterMeta = {
  companyName: string;
  companyLocation: string;
  jobTitle: string;
};

export function letterHeader(meta: LetterMeta, date = new Date()) {
  const subject = meta.jobTitle
    ? `Application for ${meta.jobTitle}`
    : "Application";

  return [
    applicant.name,
    applicant.location,
    `${applicant.phone} | ${applicant.email}`,
    `${applicant.linkedin} | ${applicant.portfolio}`,
    "",
    formatDate(date),
    "",
    "Hiring Manager",
    meta.companyName,
    meta.companyLocation,
    "",
    subject,
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");
}

export function buildFullLetter(body: string, meta: LetterMeta): string {
  return `${letterHeader(meta)}\n\n${body.trim()}\n`;
}
