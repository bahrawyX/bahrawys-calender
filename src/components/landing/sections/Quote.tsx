"use client";

/**
 * Quote — Apple-style scroll-to-read word reveal.
 *
 * Adapted from the 21st.dev TextRevealByWord pattern:
 *   - 300vh container makes room for word-by-word scroll travel
 *   - Inner text is sticky (100dvh), stays centered as you scroll
 *   - Each word maps its opacity 0.08 → 1 over its slice of scrollYProgress
 *   - Background dim colour: hsl(36 10% 22%) → bright hsl(36 28% 97%)
 *
 * Anti-pattern: NO gradient text. Word "colour" is a plain opacity shift.
 */

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

/* ─── Data ────────────────────────────────────────────────────────── */
const WORDS =
  "Calendars should fade out of the way when you don't need them, and appear right before you do.".split(" ");

/* ─── Single animated word ────────────────────────────────────────── */
function Word({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.1, 1]);
  return (
    <span className="relative inline-block mr-[0.22em]">
      {/* Dim ghost — always visible so layout doesn't shift */}
      <span
        aria-hidden
        className="select-none"
        style={{ color: "hsl(36 10% 24%)" }}
      >
        {word}
      </span>
      {/* Bright overlay — animated */}
      <motion.span
        className="absolute inset-0"
        style={{ opacity, color: "hsl(36 28% 97%)" }}
      >
        {word}
      </motion.span>
    </span>
  );
}

/* ─── Section ─────────────────────────────────────────────────────── */
export function Quote() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // default offset: ["start end", "end start"] — gives ~300vh of travel
    // which means each of ~20 words gets ~15vh of comfortable scroll range
  });

  /* Eyebrow and attribution fade independently */
  const eyebrowOpacity  = useTransform(scrollYProgress, [0.02, 0.12], [0, 1]);
  const attributionOpacity = useTransform(scrollYProgress, [0.82, 0.96], [0, 1]);

  return (
    <section
      ref={containerRef}
      /* 300vh gives generous scroll room; sticky inner pins to viewport */
      className="relative"
      style={{ height: "300vh" }}
    >
      <div
        className="sticky top-0 flex flex-col justify-center px-5 sm:px-8"
        style={{ height: "100dvh" }}
      >
        <div className="mx-auto max-w-5xl w-full">

          {/* Eyebrow */}
          <motion.span
            className="block text-[10px] uppercase tracking-[0.22em] font-medium mb-8"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color: "hsl(249 60% 72%)",
              opacity: eyebrowOpacity,
            }}
          >
            The bet
          </motion.span>

          {/* Word-by-word scroll reveal */}
          <p
            className="flex flex-wrap text-[28px] sm:text-[44px] lg:text-[60px] leading-[1.1] tracking-[-0.028em] font-normal"
            style={{ fontFamily: "'ClashDisplay-Variable', sans-serif" }}
          >
            <span
              className="inline-block mr-[0.1em]"
              style={{ color: "hsl(249 60% 42%)" }}
              aria-hidden
            >
              "
            </span>

            {WORDS.map((word, i) => {
              const start = i / WORDS.length;
              const end   = start + 1 / WORDS.length;
              return (
                <Word
                  key={i}
                  word={word}
                  progress={scrollYProgress}
                  range={[start, end]}
                />
              );
            })}

            <span
              className="inline-block ml-[0.1em]"
              style={{ color: "hsl(249 60% 42%)" }}
              aria-hidden
            >
              "
            </span>
          </p>

          {/* Attribution */}
          <motion.div
            className="mt-10 flex items-center gap-3"
            style={{ opacity: attributionOpacity }}
          >
            <span
              className="h-px w-12"
              style={{ background: "hsl(0 0% 100% / 0.18)" }}
            />
            <span
              className="text-[12px] font-medium tracking-[0.04em]"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                color: "hsl(36 12% 64%)",
              }}
            >
              Bahrawy · design principle № 1
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
