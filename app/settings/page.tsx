"use client";

import * as React from "react";
import {
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sliders,
  ChevronDown,
} from "lucide-react";
import {
  defaultSettings,
  useSettings,
  type Settings,
} from "@/components/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const PRESET_MODELS = [
  "deepseek-v4-flash",
  "deepseek-v4.1-flash",
  "glm-5.2",
  "deepseek-v4-pro",
  "glm-5.3",
  "kimi-k3",
  "gpt-4o-mini",
  "gpt-4o",
];

function NumberField({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-2">
        {label}
        {hint && (
          <span className="text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { settings, setSettings, resetSettings, loaded } = useSettings();
  const { toast } = useToast();

  const [models, setModels] = React.useState<string[]>([]);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [advanced, setAdvanced] = React.useState(false);

  const patch = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));

  async function loadModels() {
    setLoadingModels(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: settings.apiUrl,
          apiKey: settings.apiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load models");
      setModels(data.models ?? []);
      toast({
        kind: "success",
        title: `Found ${data.models?.length ?? 0} models`,
      });
    } catch (e) {
      toast({
        kind: "error",
        title: "Model list failed",
        body: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoadingModels(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  const options = [...new Set([...models, ...PRESET_MODELS, settings.model])];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Connection, model and sampling parameters. Everything is stored in
          this browser only.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-4 w-4" /> Connection
          </CardTitle>
          <CardDescription>
            Any OpenAI-compatible chat completions endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="apiKey">API key</Label>
            <Input
              id="apiKey"
              type="password"
              autoComplete="off"
              placeholder="your-api-key"
              value={settings.apiKey}
              onChange={(e) => patch({ apiKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Sent only to your endpoint as a bearer token. Never logged.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="apiUrl">Base URL</Label>
            <Input
              id="apiUrl"
              value={settings.apiUrl}
              onChange={(e) => patch({ apiUrl: e.target.value })}
              placeholder={defaultSettings.apiUrl}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="model"
                list="model-options"
                value={settings.model}
                onChange={(e) => patch({ model: e.target.value })}
                placeholder="deepseek-v4-flash"
              />
              <datalist id="model-options">
                {options.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <Button
                variant="outline"
                onClick={loadModels}
                disabled={loadingModels || !settings.apiKey}
                className="shrink-0"
              >
                {loadingModels ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Load models
              </Button>
            </div>
            {models.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {models.map((m) => (
                  <button key={m} onClick={() => patch({ model: m })}>
                    <Badge
                      variant={m === settings.model ? "default" : "muted"}
                      className="cursor-pointer font-normal"
                    >
                      {m}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sliders className="h-4 w-4" /> Sampling
          </CardTitle>
          <CardDescription>
            Controls how the model chooses its words.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="font-mono text-sm text-muted-foreground">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.05}
              value={[settings.temperature]}
              onValueChange={([v]) => patch({ temperature: v })}
            />
            <p className="text-xs text-muted-foreground">
              Higher values are more creative and varied. 0.6–0.8 works well for
              cover letters.
            </p>
          </div>

          <Separator />

          <button
            onClick={() => setAdvanced((a) => !a)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                advanced && "rotate-180",
              )}
            />
            Advanced parameters
          </button>

          {advanced && (
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField
                id="topP"
                label="Top P"
                hint="0 = off"
                value={settings.topP}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => patch({ topP: v })}
              />
              <NumberField
                id="topK"
                label="Top K"
                hint="0 = off"
                value={settings.topK}
                min={0}
                max={200}
                step={1}
                onChange={(v) => patch({ topK: v })}
              />
              <NumberField
                id="maxTokens"
                label="Max tokens"
                hint="0 = default"
                value={settings.maxTokens}
                min={0}
                max={32000}
                step={100}
                onChange={(v) => patch({ maxTokens: v })}
              />
              <NumberField
                id="frequencyPenalty"
                label="Frequency penalty"
                value={settings.frequencyPenalty}
                min={-2}
                max={2}
                step={0.1}
                onChange={(v) => patch({ frequencyPenalty: v })}
              />
              <NumberField
                id="presencePenalty"
                label="Presence penalty"
                value={settings.presencePenalty}
                min={-2}
                max={2}
                step={0.1}
                onChange={(v) => patch({ presencePenalty: v })}
              />
              <div className="space-y-1.5">
                <Label htmlFor="seed">Seed</Label>
                <Input
                  id="seed"
                  value={settings.seed}
                  onChange={(e) => patch({ seed: e.target.value })}
                  placeholder="blank = random"
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="remember">Show advanced by default</Label>
              <p className="text-xs text-muted-foreground">
                Remember my preference for this session.
              </p>
            </div>
            <Switch
              id="remember"
              checked={advanced}
              onCheckedChange={setAdvanced}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => {
          resetSettings();
          toast({ kind: "info", title: "Settings reset to defaults" });
        }}
      >
        <RotateCcw className="h-4 w-4" /> Reset to defaults
      </Button>
    </div>
  );
}
