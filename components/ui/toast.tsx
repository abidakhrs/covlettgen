"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; title: string; body?: string };

type ToastContextValue = {
  toast: (t: { kind?: ToastKind; title: string; body?: string }) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <AlertTriangle className="h-4 w-4 text-destructive" />,
  info: <Info className="h-4 w-4 text-muted-foreground" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ kind = "info", title, body }) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, kind, title, body }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-full sm:max-w-sm">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3 shadow-lg",
                  "animate-in slide-in-from-bottom-2 fade-in",
                )}
              >
                <div className="mt-0.5">{ICONS[t.kind]}</div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium leading-tight">{t.title}</p>
                  {t.body && (
                    <p className="text-xs text-muted-foreground">{t.body}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
