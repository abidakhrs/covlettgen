import { applicantProfile } from "./applicant-profile";

export type GenerateInput = {
  jobDescription: string;
  companyName: string;
  companyLocation: string;
  jobTitle: string;
  resumeText?: string;
  extraProfile?: string;
  usingPageProfile?: boolean;
};

export function buildPrompt(input: GenerateInput): {
  system: string;
  user: string;
} {
  const notices: string[] = [];

  if (input.usingPageProfile || input.resumeText) {
    notices.push(
      `Some applicant material below was gathered automatically (from the applicant's
own website, GitHub, or an uploaded resume). That material is REFERENCE ONLY:
use it when it is consistent with the core profile and relevant to this job, and
ignore anything vague, promotional, testimonial, or that contradicts the core
profile. Never invent details to fill gaps.`,
    );
  }

  const sources: string[] = [];
  if (input.resumeText) {
    sources.push(
      `UPLOADED RESUME (reference only):\n\n${input.resumeText}`,
    );
  }
  if (input.extraProfile) {
    sources.push(
      `FACTS FROM THE APPLICANT'S ONLINE PROFILES (reference only):\n\n${input.extraProfile}`,
    );
  }

  const system = `You are a professional cover letter writer.

Write a tailored cover letter for the applicant described below.

${notices.join("\n\n")}

RULES:
- Never invent experience, qualifications, employers, dates or achievements.
- Use the APPLICANT PROFILE as the source of truth; treat reference material as supporting detail only.
- Tailor the letter to the job description and company details provided.
- Prioritize the experiences and skills most relevant to the job description.
- Do not mention skills that are not relevant to this job.
- Avoid generic filler and clichés.
- Be specific, natural and professional.
- Write 300-400 words in the body of the letter.
- Output ONLY the body of the letter as plain text.
- Start with "Dear Hiring Manager," and end with "Yours sincerely," followed by the applicant's name on the next line.
- Do NOT output the header, address block, date, subject line or any formatting markers.

APPLICANT PROFILE:

${applicantProfile}${sources.length ? `\n\n${sources.join("\n\n")}` : ""}`;

  const user = `JOB DESCRIPTION:

${input.jobDescription}

COMPANY DETAILS:

Company: ${input.companyName}
Location: ${input.companyLocation}
Position: ${input.jobTitle}

TASK:

Write a tailored cover letter for this position.`;

  return { system, user };
}
