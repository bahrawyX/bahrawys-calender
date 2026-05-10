"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { LuminaAuthProvider } from "@/components/AuthProvider";
import { CosmeticsProvider } from "@/components/CosmeticsProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import PersistenceBootstrap from "@/components/PersistenceBootstrap";

/**
 * Standalone-mode providers.
 * Mirrors src/app/providers.tsx in the full Lumina app, minus the parts
 * that need a backend (better-auth session check, push subscription, etc).
 *
 * The fetch interceptor short-circuits any leftover `/api/*` calls in
 * stores/components — they all have graceful "if (!res.ok) return"
 * branches, so a synthetic 404 response is enough to keep the UI
 * behaving identically to the live app's "no data yet" state.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as typeof window & { __luminaFetchPatched?: boolean };
    if (w.__luminaFetchPatched) return;
    w.__luminaFetchPatched = true;

    const realFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      // Match same-origin /api/* paths regardless of whether they're absolute or relative.
      // EXCEPT integration routes — those are real API endpoints for OAuth + external events.
      try {
        const u = new URL(url, window.location.origin);
        if (
          u.origin === window.location.origin &&
          u.pathname.startsWith("/api/") &&
          !u.pathname.startsWith("/api/integrations/") &&
          !u.pathname.startsWith("/api/external-events/")
        ) {
          return new Response(JSON.stringify({ standalone: true }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch {
        // url couldn't be parsed — fall through to real fetch
      }
      return realFetch(input as RequestInfo, init);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="lumina-theme"
    >
      <LuminaAuthProvider>
        <CosmeticsProvider>
          <TooltipProvider delayDuration={400}>
            <PersistenceBootstrap />
            {children}
            <Toaster />
          </TooltipProvider>
        </CosmeticsProvider>
      </LuminaAuthProvider>
    </ThemeProvider>
  );
}
