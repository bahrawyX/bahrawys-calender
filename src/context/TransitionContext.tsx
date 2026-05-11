"use client";

/**
 * PageTransitionProvider — global state machine for the hero→calendar transition.
 *
 * Phases:
 *   idle      → nothing rendered
 *   covering  → clip-path circle expands from click origin, swallowing the landing page
 *   revealing → overlay fades + drifts up while the calendar page is already mounted below
 *
 * Usage:
 *   const { trigger } = usePageTransition();
 *   trigger("/calendar", { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
 */

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Phase = "idle" | "covering" | "revealing";

interface TransitionContextValue {
  phase: Phase;
  origin: { x: number; y: number };
  /** Call with the href and the click-origin coordinates */
  trigger: (href: string, origin: { x: number; y: number }) => void;
  /** Called by the overlay when the cover animation finishes */
  onCoverDone: () => void;
  /** Called by the overlay when the reveal animation finishes */
  onRevealDone: () => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hrefRef = useRef("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const trigger = useCallback((href: string, o: { x: number; y: number }) => {
    hrefRef.current = href;
    setOrigin(o);
    setPhase("covering");
  }, []);

  const onCoverDone = useCallback(() => {
    // Navigate while fully covered — user sees nothing during the route switch
    router.push(hrefRef.current);
    // Give Next.js ~160ms to mount the new page, then start the reveal
    setTimeout(() => setPhase("revealing"), 160);
  }, [router]);

  const onRevealDone = useCallback(() => {
    setPhase("idle");
  }, []);

  return (
    <TransitionContext.Provider value={{ phase, origin, trigger, onCoverDone, onRevealDone }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("usePageTransition must be used within PageTransitionProvider");
  return ctx;
}
