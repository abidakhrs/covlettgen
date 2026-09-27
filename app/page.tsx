"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Link2,
  ClipboardPaste,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  FileDown,
  FileType2,
  Info,
  Settings2,
} from "lucide-react";
import {
  requestSettings,
  useProfile,
  useSettings,
  useReady,
} from "@/components/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Fields = {
  jobTitle: string;
  companyName: string;
  companyLocation: string;
  jobDescription: string;
};

type Missing = { key: keyof Fields; label: string; reason: string };
type SourceHit = { url: string; title: string; chars: number };
type UsedSource = { kind: string; url: string; ok: boolean; note?: string };

const emptyFields: Fields = {
  jobTitle: "",
  companyName: "",
  companyLocation: "",
  jobDescription: "",
};

export default function GeneratePage() {
  const { settings } = useSettings();
  const { profile } = useProfile();
  const ready = useReady();
  const { toast } = useToast();

  const [mode, setMode] = React.useState("url");
  const [url, setUrl] = React.useState("");
  const [fetching, setFetching] = React.useState(false);
  const [discoverError, setDiscoverError] = React.useState("");
  const [missing, setMissing] = React.useState<Missing[]>([]);
  const [sources, setSources] = React.useState<SourceHit[]>([]);
  const [confidence, setConfidence] = React.useState("");
  const [note, setNote] = React.useState("");

  const [fields, setFields] = React.useState<Fields>(emptyFields);
  const [letter, setLetter] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [usedSources, setUsedSources] = React.useState<UsedSource[]>([]);
  const [copied, setCopied] = React.useState(false);

  const needsKey = !settings.apiKey.trim();
  const unanswered = missing.filter((m) => !fields[m.key].trim());

  const set = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    setMissing((m) => m.filter((x) => x.key !== key || !value.trim()));
  };

  async function extract() {
    setDiscoverError("");
    setNote("");
    try {
      new URL(url.trim());
    } catch {
      toast({
        kind: "error",
        title: "Invalid URL",
        body: "Enter a full job posting URL including https://",
      });
      return;
    }
    if (needsKey) {
      toast({
        kind: "error",
        title: "API key required",
        body: "Add your API key on the Settings page first.",
      });
      return;
    }

    setFetching(true);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), ...requestSettings(settings) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscoverError(data.error ?? "Could not read that page.");
        return;
      }
      setFields((f) => ({
        jobTitle: data.job.jobTitle || f.jobTitle,
        companyName: data.job.companyName || f.companyName,
        companyLocation: data.job.companyLocation || f.companyLocation,
        jobDescription: data.job.jobDescription || f.jobDescription,
      }));
      setMissing(data.missing ?? []);
      setSources(data.fetched ?? []);
      setConfidence(data.confidence ?? "");
      setNote(data.note ?? "");
      toast({
        kind: "success",
        title: "Job description extracted",
        body: data.missing?.length
          ? `${data.missing.length} field(s) need your input.`
          : "All fields were found.",
      });
    } catch (e) {
      setDiscoverError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFetching(false);
    }
  }

  async function generate() {
    setLetter("");
    setUsedSources([]);

    if (!fields.jobDescription.trim()) {
      toast({ kind: "error", title: "Job description required" });
      return;
    }
    if (unanswered.length) {
      toast({
        kind: "error",
        title: "Missing information",
        body: unanswered.map((m) => m.label).join(", "),
      });
      return;
    }
    if (needsKey) {
      toast({
        kind: "error",
        title: "API key required",
        body: "Add your API key on the Settings page.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          resumeText: profile.resumeText,
          portfolioUrl: profile.portfolioUrl,
          githubUrl: profile.githubUrl,
          extraNotes: profile.extraNotes,
          ...requestSettings(settings),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      setLetter(data.letter);
      setUsedSources(data.sources ?? []);
      toast({ kind: "success", title: "Cover letter generated" });
    } catch (e) {
      toast({
        kind: "error",
        title: "Generation failed",
        body: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocx() {
    const res = await fetch("/api/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter, ...fields }),
    });
    if (!res.ok) {
      toast({ kind: "error", title: "Could not build DOCX" });
      return;
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cover-letter-${fields.companyName || "application"}.docx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function downloadPdf() {
    const res = await fetch("/api/letter-html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter, ...fields }),
    });
    if (!res.ok) {
      toast({ kind: "error", title: "Could not build PDF" });
      return;
    }
    const html = await res.text();
    const win = window.open("", "_blank");
    if (!win) {
      toast({
        kind: "error",
        title: "Pop-up blocked",
        body: "Allow pop-ups to export the PDF.",
      });
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  async function copyLetter() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (!ready) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Generate a cover letter
        </h1>
        <p className="text-muted-foreground">
          Paste a job description, or extract one from a URL. Your resume and
          profile are used automatically.
        </p>
      </header>

      {needsKey && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="font-medium">No API key configured</p>
            <p className="text-muted-foreground">
              Add one on the Settings page to generate letters.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/settings">
              <Settings2 className="h-4 w-4" /> Open
            </Link>
          </Button>
        </div>
      )}

      <SourceSummary />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Job description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              <TabsTrigger value="url" className="gap-2">
                <Link2 className="h-3.5 w-3.5" /> From URL
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <ClipboardPaste className="h-3.5 w-3.5" /> Paste manually
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="https://company.com/careers/software-engineer"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && extract()}
                />
                <Button onClick={extract} disabled={fetching}>
                  {fetching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Reading
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Extract
                    </>
                  )}
                </Button>
              </div>

              {discoverError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="flex-1">
                    <p>{discoverError}</p>
                    <button
                      onClick={() => setMode("manual")}
                      className="mt-1 text-xs underline"
                    >
                      Enter the details manually instead
                    </button>
                  </div>
                </div>
              )}

              {sources.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="muted">
                    {sources.length} page{sources.length > 1 ? "s" : ""} read
                  </Badge>
                  {confidence && (
                    <Badge
                      variant={
                        confidence === "high"
                          ? "secondary"
                          : confidence === "medium"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {confidence} confidence
                    </Badge>
                  )}
                  <span className="truncate">
                    {sources.map((s) => s.title || s.url).join(" · ")}
                  </span>
                </div>
              )}

              {note && (
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {note}
                </p>
              )}

              {missing.length > 0 && (
                <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Some details could not be found — fill them in below
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {missing.map((m) => (
                      <li key={m.key}>
                        <span className="font-medium text-foreground">
                          {m.label}:
                        </span>{" "}
                        {m.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual">
              <p className="text-sm text-muted-foreground">
                Paste the title, company and full job description below.
              </p>
            </TabsContent>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                value={fields.jobTitle}
                onChange={(e) => set("jobTitle", e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company</Label>
              <Input
                id="companyName"
                value={fields.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="ABC Technology Sdn. Bhd."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyLocation">Location</Label>
              <Input
                id="companyLocation"
                value={fields.companyLocation}
                onChange={(e) => set("companyLocation", e.target.value)}
                placeholder="Kuala Lumpur, Malaysia"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jobDescription">Job description</Label>
            <Textarea
              id="jobDescription"
              value={fields.jobDescription}
              onChange={(e) => set("jobDescription", e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-[240px] resize-y font-mono text-xs leading-relaxed"
            />
          </div>

          <Button
            onClick={generate}
            disabled={loading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate cover letter
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {letter && (
        <Card className="animate-in fade-in slide-in-from-bottom-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Your cover letter</CardTitle>
              <p className="text-xs text-muted-foreground">
                Editable — changes apply to the downloads.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyLetter}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPdf}>
                <FileDown className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={downloadDocx}>
                <FileType2 className="h-3.5 w-3.5" /> DOCX
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {usedSources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>Sources:</span>
                {usedSources.map((s) => (
                  <Badge
                    key={s.kind}
                    variant={s.ok ? "secondary" : "destructive"}
                  >
                    {s.kind}
                    {!s.ok && ` (${s.note ?? "failed"})`}
                  </Badge>
                ))}
                {profile.resumeText && <Badge variant="secondary">resume</Badge>}
                {profile.extraNotes && <Badge variant="secondary">notes</Badge>}
              </div>
            )}
            <Textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              className="min-h-[440px] resize-y text-sm leading-relaxed"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SourceSummary() {
  const { profile } = useProfile();
  const badges = [
    profile.resumeName && `Resume: ${profile.resumeName}`,
    profile.portfolioUrl && "Portfolio",
    profile.githubUrl && "GitHub",
    profile.extraNotes && "Notes",
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Profile sources:</span>
      {badges.length ? (
        badges.map((b) => (
          <Badge key={b} variant="outline" className="font-normal">
            {b}
          </Badge>
        ))
      ) : (
        <Link
          href="/profile"
          className={cn(
            "rounded-md border border-dashed px-2 py-0.5 text-muted-foreground transition-colors hover:text-foreground",
          )}
        >
          None yet — add your resume and links
        </Link>
      )}
    </div>
  );
}
