import Link from "next/link";
import {
  PenLine,
  UserRound,
  Settings2,
  Sparkles,
  FileDown,
  Globe,
  GitBranch,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applicant } from "@/lib/applicant-profile";

const STEPS = [
  {
    icon: Sparkles,
    title: "Describe the job",
    body: "Paste a job description, or give a URL and the app reads the posting, following About and Contact pages when details are missing.",
  },
  {
    icon: UserRound,
    title: "Your profile is gathered",
    body: "Your resume, portfolio and GitHub are summarised into facts and combined with your base profile.",
  },
  {
    icon: PenLine,
    title: "A letter is written",
    body: "The model drafts only from your real experience, tailored to what the job actually asks for.",
  },
  {
    icon: FileDown,
    title: "Export it",
    body: "Edit inline, then download a print-ready PDF or a DOCX for application portals.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          About COVELETTGEN
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          A small, focused tool that turns a job description into a cover letter
          grounded in your real experience — nothing invented, nothing generic.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
          <CardDescription>
            Four steps, one page of output.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {title}
                </p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applicant profile</CardTitle>
            <CardDescription>
              The fixed facts every letter is built from.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">{applicant.name}</p>
              <p className="text-muted-foreground">{applicant.location}</p>
            </div>
            <p className="text-muted-foreground">{applicant.email}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="outline">Software QA</Badge>
              <Badge variant="outline">Automation</Badge>
              <Badge variant="outline">Next.js</Badge>
              <Badge variant="outline">Testing</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4" /> Privacy
            </CardTitle>
            <CardDescription>What leaves your machine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Your resume, API key and settings are stored in this browser only.
              Nothing is persisted server-side.
            </p>
            <p>
              When you generate, only the prompt — your profile facts and the job
              description — is sent to the endpoint you configured.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sources used in a letter</CardTitle>
          <CardDescription>
            Configure these on the Profile page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "Resume",
              body: "Uploaded PDF or DOCX, parsed locally into text.",
            },
            {
              icon: Globe,
              title: "Portfolio",
              body: "Your site is read and summarised into skills and projects.",
            },
            {
              icon: GitBranch,
              title: "GitHub",
              body: "Public repos and languages become project facts.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="space-y-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">
            <Sparkles className="h-4 w-4" /> Generate a letter
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/settings">
            <Settings2 className="h-4 w-4" /> Configure settings
          </Link>
        </Button>
      </div>
    </div>
  );
}
