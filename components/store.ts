"use client";

import { useCallback, useEffect, useState } from "react";

export type Settings = {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
  seed: string;
};

export type ProfileConfig = {
  portfolioUrl: string;
  githubUrl: string;
  resumeText: string;
  resumeName: string;
  extraNotes: string;
};

export const defaultSettings: Settings = {
  apiUrl: "https://rootsys.cloud/v1/chat/completions",
  apiKey: "",
  model: "deepseek-v4-flash",
  temperature: 0.7,
  topP: 1,
  topK: 0,
  maxTokens: 0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  seed: "",
};

export const defaultProfile: ProfileConfig = {
  portfolioUrl: "https://conv-portfolio.abidakhrs.workers.dev/",
  githubUrl: "",
  resumeText: "",
  resumeName: "",
  extraNotes: "",
};

const SETTINGS_KEY = "covelettgen.settings.v1";
const PROFILE_KEY = "covelettgen.profile.v1";

function load<T extends object>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function useStored<T extends object>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setValue(load(key, fallback));
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable; keep working in memory
    }
  }, [key, value, loaded]);

  const reset = useCallback(() => setValue(fallback), [fallback]);

  return { value, setValue, reset, loaded };
}

export function useSettings() {
  const s = useStored(SETTINGS_KEY, defaultSettings);
  return {
    settings: s.value,
    setSettings: s.setValue,
    resetSettings: s.reset,
    loaded: s.loaded,
  };
}

export function useProfile() {
  const p = useStored(PROFILE_KEY, defaultProfile);
  return {
    profile: p.value,
    setProfile: p.setValue,
    resetProfile: p.reset,
    loaded: p.loaded,
  };
}

export function useReady() {
  const s = useSettings();
  const p = useProfile();
  return s.loaded && p.loaded;
}

export function requestSettings(s: Settings) {
  const seed = s.seed.trim();
  return {
    apiUrl: s.apiUrl.trim() || undefined,
    apiKey: s.apiKey.trim() || undefined,
    model: s.model.trim() || undefined,
    temperature: s.temperature,
    topP: s.topP > 0 ? s.topP : undefined,
    topK: s.topK > 0 ? s.topK : undefined,
    maxTokens: s.maxTokens > 0 ? s.maxTokens : undefined,
    frequencyPenalty: s.frequencyPenalty || undefined,
    presencePenalty: s.presencePenalty || undefined,
    seed: seed ? Number(seed) : undefined,
  };
}
