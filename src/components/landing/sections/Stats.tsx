"use client";

/**
 * Stats — three animated numbers that prove the product claims.
 * Count-up on scroll entry (Framer Motion animate + useInView).
 * Double-Bezel card, horizontal strip on desktop, stacked on mobile.
 *
 * Placed between Manifesto and Features in Landing.tsx.
 */

import { useRef, useEffect, useState } from "react";
import { animate, useInView } from "framer-motion";
import { Reveal } from "../Reveal";

/* ─── Data ────────────────────────────────────────────────────────── */
const STATS = [
  {
    prefix: "< ",
    prefixColor: "hsl(249 60% 70%)",
    value: 98,
    unit: "ms",
    label: "cold load",
    sublabel: "no spinner ever",
  },
  {
    prefix: "",
    prefixColor: undefined,
    value: 3,
    unit: "",
    label: "providers",
    sublabel: "one unified grid",
  },
  {
    prefix: "",
    prefixColor: undefined,
    value: 0,
    unit: "",
    label: "zero trackers",
    sublabel: "no accounts · no servers",
  },
] as const;

/* ─── Animated number ────────────────────────────────────────────── */
function CountUp({
  to,
  duration = 1.3,
}: {
  to: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.165, 0.84, 0.44, 1] as [number, number, number, number],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return <span ref={ref}>{display}</span>;
}

/* ─── Section ─────────────────────────────────────────────────────── */
export function Stats() {
  return (
    <section className="relative py-10 sm:py-14 px-5 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal y={24}>
          {/* Double-Bezel card */}
          <div
            className="relative rounded-[1.75rem] p-1.5"
            style={{
              background:
                "linear-gradient(180deg, hsl(0 0% 100% / 0.06), hsl(0 0% 100% / 0.02))",
              border: "1px solid hsl(0 0% 100% / 0.07)",
              boxShadow:
                "0 40px 80px -30px hsl(249 70% 20% / 0.35), 0 1px 0 hsl(0 0% 100% / 0.06) inset",
            }}
          >
            <div
              className="rounded-[calc(1.75rem-0.375rem)] px-8 sm:px-14 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-0"
              style={{
                background:
                  "radial-gradient(120% 200% at 50% 0%, hsl(249 30% 12% / 0.6), hsl(248 14% 7%) 55%)",
                boxShadow: "0 1px 0 hsl(0 0% 100% / 0.07) inset",
              }}
            >
              {STATS.map((s, i) => (
                <div key={s.label} className="relative flex flex-col items-center text-center gap-3">
                  {/* Vertical dividers between items — desktop only */}
                  {i > 0 && (
                    <div
                      aria-hidden
                      className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-16"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent, hsl(0 0% 100% / 0.1), transparent)",
                      }}
                    />
                  )}

                  {/* Big number */}
                  <div
                    className="flex items-baseline gap-0.5 leading-none"
                    style={{
                      fontFamily: "'ClashDisplay-Variable', sans-serif",
                    }}
                  >
                    {s.prefix && (
                      <span
                        className="text-[36px] sm:text-[44px] font-medium tracking-[-0.03em]"
                        style={{ color: s.prefixColor }}
                      >
                        {s.prefix}
                      </span>
                    )}
                    <span
                      className="text-[56px] sm:text-[72px] font-medium tracking-[-0.04em]"
                      style={{ color: "hsl(36 28% 97%)" }}
                    >
                      <CountUp to={s.value} duration={s.value === 0 ? 0.01 : 1.3} />
                    </span>
                    {s.unit && (
                      <span
                        className="text-[24px] sm:text-[32px] font-medium tracking-[-0.02em] ml-0.5"
                        style={{ color: "hsl(249 60% 70%)" }}
                      >
                        {s.unit}
                      </span>
                    )}
                  </div>

                  {/* Label stack */}
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-[13px] sm:text-[14px] font-medium tracking-[0.01em]"
                      style={{ color: "hsl(36 20% 88%)" }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="text-[11px] tracking-[0.04em] uppercase"
                      style={{
                        fontFamily: "var(--font-geist-mono), monospace",
                        color: "hsl(36 10% 48%)",
                      }}
                    >
                      {s.sublabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
