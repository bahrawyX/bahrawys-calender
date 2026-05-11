"use client";

/**
 * Quote — sticky scroll moment. Massive editorial pull-quote, single
 * accent color, no decoration. Lives between Features and About to give
 * the eye a rest before the personal block.
 *
 * Anti-pattern: NO gradient text. The "fade" effect is a clip-path
 * reveal driven by viewport intersection.
 */

import { Reveal } from "../Reveal";

export function Quote() {
  return (
    <section className="relative py-32 sm:py-44 lg:py-56 px-5 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal y={20} blur={0}>
          <span
            className="text-[10px] uppercase tracking-[0.22em] font-medium"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color: "hsl(249 60% 72%)",
            }}
          >
            The bet
          </span>
        </Reveal>

        <Reveal delay={0.06} y={20} blur={0}>
          <blockquote
            className="mt-8 text-[32px] sm:text-[48px] lg:text-[68px] leading-[1.05] tracking-[-0.028em] font-normal"
            style={{
              fontFamily: "'ClashDisplay-Variable', sans-serif",
              color: "hsl(36 22% 94%)",
            }}
          >
            <span aria-hidden style={{ color: "hsl(249 60% 70%)" }}>“</span>
            Calendars should fade out of the way when you don&apos;t need them,{" "}
            <span style={{ color: "hsl(36 14% 60%)" }}>
              and appear right before you do.
            </span>
            <span aria-hidden style={{ color: "hsl(249 60% 70%)" }}>”</span>
          </blockquote>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-10 flex items-center gap-3">
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
          </div>
        </Reveal>
      </div>
    </section>
  );
}
