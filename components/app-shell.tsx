import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 hidden items-center justify-end gap-2 border-b bg-background/80 px-8 py-3 backdrop-blur lg:flex">
          <ThemeToggle />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
