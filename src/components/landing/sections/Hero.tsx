"use client";

/**
 * Hero — editorial-split with a floating calendar mock.
 *
 * Layout archetype: "Editorial Split" + light "Z-Axis Cascade" on the mock.
 * Vibe archetype: "Ethereal Glass" — deep tinted background, soft purple
 * glow orbs, wide geometric Grotesk + ClashDisplay for the eyebrow heading.
 *
 * Animation: word-by-word stagger on mount (no blur — this is the LCP
 * surface, blur on text would be visually clipped during render).
 */

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import { usePageTransition } from "@/context/TransitionContext";

const EASE_OUT_QUART: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

export function Hero() {
  return (
    <section
      className="relative pt-28 sm:pt-36 lg:pt-44 pb-20 sm:pb-28 lg:pb-32 px-5 sm:px-8 overflow-hidden"
      style={{ minHeight: "100dvh" }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Eyebrow tag — tiny pill, uppercase mono, brand-tinted */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT_QUART, delay: 0.15 }}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
          style={{
            borderColor: "hsl(249 70% 65% / 0.24)",
            background: "hsl(249 70% 50% / 0.08)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "hsl(249 80% 70%)",
              boxShadow: "0 0 8px hsl(249 80% 65%)",
            }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.22em] font-medium"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color: "hsl(36 14% 78%)",
            }}
          >
            Bahrawy · v1 · live
          </span>
        </motion.div>

        {/* Main headline — Clash Display, extreme size, two lines with shift */}
        <h1
          className="mt-7 sm:mt-9 text-[44px] xs:text-[52px] sm:text-[78px] lg:text-[112px] xl:text-[124px] leading-[0.92] tracking-[-0.038em] font-medium max-w-[14ch]"
          style={{
            fontFamily: "'ClashDisplay-Variable', sans-serif",
            color: "hsl(36 24% 96%)",
          }}
        >
          <WordReveal words={["A", "calendar", "that"]} baseDelay={0.25} />
          <br />
          <span style={{ color: "hsl(36 14% 70%)" }}>
            <WordReveal words={["gets", "out", "of", "your", "way."]} baseDelay={0.5} />
          </span>
        </h1>

        {/* Subhead — limited to ~58ch per impeccable typography rules */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: 0.95 }}
          className="mt-8 sm:mt-10 max-w-[58ch] text-base sm:text-[17px] leading-[1.55]"
          style={{ color: "hsl(36 12% 70%)" }}
        >
          Drag to reschedule. Recurrence that bends to real life. Google,
          Outlook, and Apple in a single grid. No signup, no servers, no
          telemetry. Your calendar lives in your browser.
        </motion.p>

        {/* CTAs — primary pill with button-in-button trailing icon */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: 1.1 }}
          className="mt-10 sm:mt-12 flex flex-wrap items-center gap-3"
        >
          <PrimaryCta href="/calendar">Open Bahrawy</PrimaryCta>
          <SecondaryCta href="https://www.bahrawy.me" external>
            Meet the maker
          </SecondaryCta>
        </motion.div>

        {/* Floating calendar mock — Z-axis cascade, parallax mouse tracking */}
        <CalendarMock />
      </div>

      {/* Bottom fade so the hero blends into the next section without a hard line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(240 8% 8%))",
        }}
      />
    </section>
  );
}

/* ─── Word-by-word reveal ────────────────────────────────────────── */
function WordReveal({ words, baseDelay }: { words: string[]; baseDelay: number }) {
  return (
    <>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.85,
            ease: EASE_OUT_QUART,
            delay: baseDelay + i * 0.06,
          }}
          className="inline-block"
          style={{ marginRight: "0.18em" }}
        >
          {w}
        </motion.span>
      ))}
    </>
  );
}

/* ─── Primary CTA — button-in-button architecture ────────────────── */
function PrimaryCta({ href, children }: { href: string; children: string }) {
  const { trigger } = usePageTransition();
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        trigger(href, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className="group relative inline-flex items-center gap-2 rounded-full pl-5 pr-2 py-2 text-[15px] font-medium transition-transform duration-200 active:scale-[0.97]"
      style={{
        background: "linear-gradient(180deg, hsl(36 28% 98%), hsl(36 20% 92%))",
        color: "hsl(248 30% 8%)",
        boxShadow:
          "0 1px 0 hsl(0 0% 100% / 0.6) inset, 0 0 0 1px hsl(0 0% 100% / 0.08), 0 18px 40px -16px hsl(36 30% 80% / 0.3)",
      }}
    >
      <span>{children}</span>
      <span
        className="grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px]"
        style={{
          background: "hsl(248 30% 8%)",
          color: "hsl(36 24% 96%)",
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="9 7 17 7 17 15" />
        </svg>
      </span>
    </button>
  );
}

/* ─── Secondary CTA — ghost pill ──────────────────────────────────── */
function SecondaryCta({ href, children, external }: { href: string; children: string; external?: boolean }) {
  const Wrapper: any = external ? "a" : Link;
  const props = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
  return (
    <Wrapper
      {...props}
      className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium transition-all duration-200 active:scale-[0.97]"
      style={{
        color: "hsl(36 18% 88%)",
        border: "1px solid hsl(0 0% 100% / 0.1)",
        background: "hsl(0 0% 100% / 0.03)",
      }}
    >
      <span>{children}</span>
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-300 group-hover:translate-x-0.5"
      >
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="9 7 17 7 17 15" />
      </svg>
    </Wrapper>
  );
}

/* ─── Floating Calendar Mock ──────────────────────────────────────── */
/**
 * A miniature, stylized calendar grid floating in the hero. Two cards
 * stacked z-axis-style, gentle mouse-tracked tilt via useSpring (per
 * emil-design-eng §spring-based-mouse-interactions: "Tying visual
 * changes directly to mouse position feels artificial. Use useSpring
 * to interpolate value changes with spring-like behavior").
 */
function CalendarMock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 120, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-8, 8]), springConfig);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="relative mt-16 sm:mt-24 lg:mt-28 mx-auto w-full max-w-5xl"
      style={{ perspective: "1400px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: 14 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.1, ease: EASE_OUT_QUART, delay: 0.45 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Double-bezel outer shell */}
        <div
          className="relative rounded-[2rem] p-1.5"
          style={{
            background: "linear-gradient(180deg, hsl(0 0% 100% / 0.06), hsl(0 0% 100% / 0.02))",
            boxShadow:
              "0 1px 0 hsl(0 0% 100% / 0.08) inset, 0 60px 120px -40px hsl(249 66% 26% / 0.28), 0 30px 60px -20px hsl(0 0% 0% / 0.5)",
            border: "1px solid hsl(0 0% 100% / 0.08)",
          }}
        >
          {/* Inner core — real calendar screenshot */}
          <div className="rounded-[calc(2rem-0.375rem)] overflow-hidden">
            <Image
              src="/calendar-screenshot.jpg"
              alt="Bahrawy Calendar — month view"
              width={1400}
              height={820}
              className="w-full h-auto block"
              priority
            />
          </div>
        </div>

        {/* Provider chips — z-stacked over the bottom-left corner */}
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ duration: 1, ease: EASE_OUT_QUART, delay: 0.9 }}
          className="absolute -bottom-6 -left-3 sm:-left-8 hidden sm:flex items-center gap-2 rounded-full px-3.5 py-2.5"
          style={{
            background: "hsl(240 7% 9% / 0.95)",
            border: "1px solid hsl(0 0% 100% / 0.08)",
            boxShadow: "0 22px 50px -16px hsl(0 0% 0% / 0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex -space-x-2">
            <ProviderBubble label="G" hue={210} />
            <ProviderBubble label="O" hue={205} />
            <ProviderBubble label="A" hue={0} />
          </div>
          <span
            className="text-[11px] font-medium"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color: "hsl(36 16% 80%)",
            }}
          >
            3 providers, 1 view
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ProviderBubble({ label, hue }: { label: string; hue: number }) {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 60% 45%), hsl(${hue} 50% 30%))`,
        color: "hsl(36 30% 96%)",
        border: "1.5px solid hsl(248 14% 9%)",
      }}
    >
      {label}
    </span>
  );
}

