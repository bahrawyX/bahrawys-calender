"use client";

/**
 * Quote — scroll-to-read with blur + opacity per word.
 *
 * Based on the ScrollRevealText variant:
 *   - Each word animates from blur(10px)/opacity(0) → blur(0px)/opacity(1)
 *   - offset ["start start","end start"]: scroll range = 1 sticky section height
 *   - blur driven via useMotionTemplate (reactive, not .get() snapshot)
 *
 * Container: h-[300vh], sticky inner: h-[100dvh]
 */

import { useRef, type FC } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "framer-motion";

/* ─── Data ────────────────────────────────────────────────────────── */
const QUOTE =
  "Calendars should fade out of the way when you don't need them, and appear right before you do.";

/* ─── Single word ─────────────────────────────────────────────────── */
interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}

const Word: FC<WordProps> = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  const blurPx  = useTransform(progress, range, [10, 0]);
  // useMotionTemplate keeps the filter reactive on every frame
  const filter  = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.span
      className="relative inline-block"
      style={{
        opacity,
        filter,
        marginRight: "0.22em",
        color: "var(--lp-h)",
        willChange: "opacity, filter",
      }}
    >
      {children}
    </motion.span>
  );
};

/* ─── Section ─────────────────────────────────────────────────────── */
export function Quote() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // "start start" → sticky pins when container.top = viewport.top
    // "end start"   → progress reaches 1 when container.bottom = viewport.top
    // With h-[300vh], that's 200vh of scroll to reveal all words — ~10vh/word
    offset: ["start start", "end start"],
  });

  /* Eyebrow: fades in during first 8% of scroll */
  const eyebrowOpacity = useTransform(scrollYProgress, [0, 0.08], [0, 1]);
  /* Attribution: fades in during last 15% */
  const attrOpacity    = useTransform(scrollYProgress, [0.88, 0.98], [0, 1]);

  const words = QUOTE.split(" ");

  // Compress word reveal to [0.08 → 0.86] so last words fully resolve
  // before the section exits. Eyebrow covers [0, 0.08], attribution [0.86, 1].
  const WORD_START = 0.08;
  const WORD_END   = 0.86;
  const wordSpan   = (WORD_END - WORD_START) / words.length;

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: "300vh" }}
    >
      {/* Sticky viewport-height panel */}
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
              color: "var(--lp-purple)",
              opacity: eyebrowOpacity,
            }}
          >
            The bet
          </motion.span>

          {/* Word-by-word blur+opacity reveal */}
          <p
            className="flex flex-wrap text-[28px] sm:text-[44px] lg:text-[60px] leading-[1.12] tracking-[-0.028em] font-normal"
            style={{ fontFamily: "'ClashDisplay-Variable', sans-serif" }}
          >
            <span
              aria-hidden
              className="inline-block mr-[0.08em]"
              style={{ color: "var(--lp-purple-muted)" }}
            >
              "
            </span>

            {words.map((word, i) => {
              const start = WORD_START + i * wordSpan;
              const end   = start + wordSpan;
              return (
                <Word key={i} progress={scrollYProgress} range={[start, end]}>
                  {word}
                </Word>
              );
            })}

            <span
              aria-hidden
              className="inline-block ml-[0.04em]"
              style={{ color: "var(--lp-purple-muted)" }}
            >
              "
            </span>
          </p>

          {/* Attribution */}
          <motion.div
            className="mt-10 flex items-center gap-3"
            style={{ opacity: attrOpacity }}
          >
            <span
              className="h-px w-12"
              style={{ background: "var(--lp-rule)" }}
            />
            <span
              className="text-[12px] font-medium tracking-[0.04em]"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                color: "var(--lp-label)",
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
