"use client";

/**
 * Landing — Bahrawy Calendar marketing surface.
 *
 * Design language follows three layered skills:
 *   - emil-design-eng: motion philosophy (ease-out, transform/opacity only,
 *     custom cubic-beziers, scale-on-press feedback, stagger 50–80ms)
 *   - impeccable: no #000/#fff, no em dashes, no side-stripe borders, no
 *     hero-metric template, restrained color strategy (tinted neutrals +
 *     purple accent ≤10%)
 *   - high-end-visual-design: Double-Bezel architecture, button-in-button
 *     trailing icons, scroll-blur entries, custom cubic-beziers, NO Inter
 *
 * Typography stack:
 *   - Display:  ClashDisplay-Variable (already loaded in globals.css)
 *   - Body / UI: Geist Sans
 *   - Mono / labels: Geist Mono
 */

import { ReactLenis } from "lenis/react";
import { ScrollProgressBar } from "./ScrollProgressBar";
import { LandingNav } from "./LandingNav";
import { Hero } from "./sections/Hero";
import { Marquee } from "./sections/Marquee";
import { Manifesto } from "./sections/Manifesto";
import { Stats } from "./sections/Stats";
import { Features } from "./sections/Features";
import { KeyboardSection } from "./sections/KeyboardSection";
import { Quote } from "./sections/Quote";
import { About } from "./sections/About";
import { FinalCta } from "./sections/FinalCta";
import { LandingFooter } from "./LandingFooter";

/** Lenis easing — expo-out feel, matches the site's ease-out-quart motion */
const lenisEasing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function Landing() {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.15,
        easing: lenisEasing,
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.8,
        infinite: false,
      }}
    >
      <div
        className="relative min-h-[100dvh] w-full overflow-x-clip text-foreground antialiased"
        style={{
          background: "var(--lp-bg)",
          fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: "-0.011em",
        }}
      >
        {/* Ambient glow — fixed layer, pointer-events none, drifts behind content.
            Two tinted blobs (purple, soft cyan-violet) provide depth without
            triggering layout/paint on scroll. */}
        <AmbientGlow />
        <ScrollProgressBar />

        <LandingNav />

        <main className="relative z-10">
          <Hero />
          <Marquee />
          <Manifesto />
          <Stats />
          <Features />
          <KeyboardSection />
          <Quote />
          <About />
          <FinalCta />
        </main>

        <LandingFooter />
      </div>
    </ReactLenis>
  );
}

/* ─── Ambient Glow ────────────────────────────────────────────────────
 * Two soft radial mesh orbs, fixed-positioned so they don't reflow on
 * scroll. Pure CSS — no JS, no per-frame work.
 *
 * Per high-end-visual-design §6: "ambient motion ... very slow-moving
 * radial gradient blob (animation-duration: 20s+, opacity: 0.02-0.04)
 * drifting behind hero sections. Must be applied to a position: fixed;
 * pointer-events: none layer."
 */
function AmbientGlow() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(60rem 50rem at 20% 0%, hsl(249 66% 45% / 0.07), transparent 60%), " +
            "radial-gradient(50rem 40rem at 100% 30%, hsl(262 58% 48% / 0.05), transparent 55%), " +
            "radial-gradient(40rem 30rem at 40% 90%, hsl(225 50% 42% / 0.04), transparent 50%)",
        }}
      />
      {/* Grain — fixed pseudo-layer via data-URI SVG, no HTTP request.
          Pinned to viewport so it never repaints during scroll. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[2] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </>
  );
}
