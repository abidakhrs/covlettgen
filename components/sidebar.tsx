"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FileText,
  Settings2,
  UserRound,
  PenLine,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  {
    href: "/",
    label: "Generate",
    icon: PenLine,
    hint: "Job description to cover letter",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound,
    hint: "Resume, portfolio, GitHub",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings2,
    hint: "API key, model, sampling",
  },
  {
    href: "/about",
    label: "About",
    icon: FileText,
    hint: "How it works",
  },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, hint }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                active && "text-sidebar-primary",
              )}
            />
            <span className="flex flex-col">
              <span className={cn("font-medium", active && "text-foreground")}>
                {label}
              </span>
              <span className="text-xs text-muted-foreground/80">{hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src="/icon.webp"
        alt="COVELETTGEN logo"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-lg object-contain"
        priority
      />
      <span className="flex flex-col">
        <span className="font-display text-xl font-bold leading-none tracking-tight">
          COVELETTGEN
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          Tailored cover letters
        </span>
      </span>
    </Link>
  );
}

/** Links + footer shared by the desktop sidebar and the mobile drawer. */
function NavPanel({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <Brand />
        {onNavigate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigate}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="border-t px-5 py-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your data stays in this browser. Only your prompt is sent to your
          configured endpoint.
        </p>
      </div>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setOpen(false), [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-sidebar/95 px-3 py-2.5 backdrop-blur lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="flex-1 truncate font-display text-base font-semibold sm:text-lg">
          COVELETTGEN
        </span>
        <ThemeToggle />
      </header>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <NavPanel onNavigate={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
        <NavPanel />
      </aside>
    </>
  );
}
