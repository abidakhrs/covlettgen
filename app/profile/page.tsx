"use client";

import * as React from "react";
import {
  Upload,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  Globe,
  StickyNote,
  Info,
} from "lucide-react";
import { useProfile, type ProfileConfig } from "@/components/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function ProfilePage() {
  const { profile, setProfile, resetProfile, loaded } = useProfile();
  const { toast } = useToast();

  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  const patch = (p: Partial<ProfileConfig>) =>
    setProfile((prev) => ({ ...prev, ...p }));

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      patch({ resumeText: data.text, resumeName: data.filename });
      toast({
        kind: "success",
        title: "Resume uploaded",
        body: `${data.chars.toLocaleString()} characters extracted`,
      });
    } catch (e) {
      toast({
        kind: "error",
        title: "Could not read that file",
        body: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Profile</h1>
        <p className="text-muted-foreground">
          Everything here is used to tailor your letters. Add as much truthful
          detail as you can.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-4 w-4" /> Resume
          </CardTitle>
          <CardDescription>
            PDF, DOCX, TXT or MD up to 8 MB. Text is extracted in your browser
            session and stored locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) upload(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent/40"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Reading file...</p>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drop your resume here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, TXT, MD
                </p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />

          {profile.resumeName && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {profile.resumeName}
                  </span>
                  <Badge variant="muted">
                    {profile.resumeText.length.toLocaleString()} chars
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreview((p) => !p)}
                  >
                    {preview ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      patch({ resumeText: "", resumeName: "" });
                      toast({ kind: "info", title: "Resume removed" });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </div>
              {preview && (
                <Textarea
                  readOnly
                  value={profile.resumeText}
                  className="h-48 resize-y font-mono text-xs"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-4 w-4" /> Online profiles
          </CardTitle>
          <CardDescription>
            Fetched when you generate, and summarised into facts the model can
            draw on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="portfolio">Portfolio URL</Label>
            <Input
              id="portfolio"
              value={profile.portfolioUrl}
              onChange={(e) => patch({ portfolioUrl: e.target.value })}
              placeholder="https://your-portfolio.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="github" className="flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5" /> GitHub URL or username
            </Label>
            <Input
              id="github"
              value={profile.githubUrl}
              onChange={(e) => patch({ githubUrl: e.target.value })}
              placeholder="https://github.com/username"
            />
            <p className="text-xs text-muted-foreground">
              Public repositories and languages are summarised automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-4 w-4" /> Extra notes
          </CardTitle>
          <CardDescription>
            Anything not covered above — availability, notice period, specific
            achievements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={profile.extraNotes}
            onChange={(e) => patch({ extraNotes: e.target.value })}
            placeholder="e.g. Available to start within one month. Comfortable with hybrid work in Kuala Lumpur."
            className="min-h-[120px] resize-y"
          />
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          Your resume, portfolio and GitHub are treated as supporting material.
          The base profile in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            lib/applicant-profile.ts
          </code>{" "}
          stays the source of truth, and the model is instructed never to invent
          anything.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => {
          resetProfile();
          toast({ kind: "info", title: "Profile data cleared" });
        }}
      >
        <Trash2 className="h-4 w-4" /> Clear profile data
      </Button>
    </div>
  );
}
