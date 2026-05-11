"use client";

/**
 * KeyboardSection — keyboard-first proof section.
 *
 * Layout: editorial heading left, shortcut grid right.
 * Each <kbd> is a Double-Bezel glass key with a pressed state on hover.
 * Three categories: Navigate, Events, Views. Staggered reveal per Reveal.
 *
 * Placed between Features and Quote.
 */

import { Reveal } from "../Reveal";

/* ─── Data ────────────────────────────────────────────────────────── */
const GROUPS = [
  {
    label: "Navigate",
    shortcuts: [
      { keys: ["←", "→"], desc: "prev / next week" },
      { keys: ["T"], desc: "jump to today" },
      { keys: ["↑", "↓"], desc: "scroll hours" },
    ],
  },
  {
    label: "Events",
    shortcuts: [
      { keys: ["N"], desc: "new event" },
      { keys: ["E"], desc: "edit selected" },
      { keys: ["⌫"], desc: "delete event" },
      { keys: ["Esc"], desc: "close / cancel" },
    ],
  },
  {
    label: "Views",
    shortcuts: [
      { keys: ["M"], desc: "month view" },
      { keys: ["W"], desc: "week view" },
      { keys: ["D"], desc: "day view" },
      { keys: ["1", "–", "6"], desc: "toggle contexts" },
    ],
  },
] as const;

/* ─── Kbd key ─────────────────────────────────────────────────────── */
function Key({ label }: { label: string }) {
  return (
    <span
      className="inline-grid place-items-center rounded-[7px] min-w-[2rem] h-8 px-2 text-[12px] font-medium select-none transition-all duration-100 active:scale-95"
      style={{
        fontFamily: "var(--font-geist-mono), monospace",
        color: "hsl(36 20% 92%)",
        background: "linear-gradient(180deg, hsl(240 8% 13%), hsl(240 7% 10%))",
        border: "1px solid hsl(0 0% 100% / 0.1)",
        boxShadow:
          "0 1px 0 hsl(0 0% 100% / 0.12) inset, 0 2px 0 hsl(0 0% 0% / 0.4)",
      }}
    >
      {label}
    </span>
  );
}

/* ─── Section ─────────────────────────────────────────────────────── */
export function KeyboardSection() {
  return (
    <section className="relative py-28 sm:py-36 px-5 sm:px-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-28 items-start">

        {/* Left — editorial copy */}
        <div className="lg:sticky lg:top-32">
          <Reveal>
            <span
              className="text-[10px] uppercase tracking-[0.22em] font-medium"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                color: "hsl(249 60% 72%)",
              }}
            >
              Keyboard-first
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h2
              className="mt-5 text-[36px] sm:text-[48px] lg:text-[58px] leading-[1.02] tracking-[-0.032em] font-medium"
              style={{
                fontFamily: "'ClashDisplay-Variable', sans-serif",
                color: "hsl(36 24% 95%)",
              }}
            >
              Your hands{" "}
              <span style={{ color: "hsl(36 14% 60%)" }}>
                never leave the keys.
              </span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p
              className="mt-6 max-w-[42ch] text-base sm:text-[17px] leading-[1.62]"
              style={{ color: "hsl(36 12% 68%)" }}
            >
              Every action that matters has a key. Navigate weeks, create
              events, switch views, toggle contexts — all without reaching for
              the mouse.
            </p>
          </Reveal>
        </div>

        {/* Right — shortcut groups */}
        <div className="flex flex-col gap-6">
          {GROUPS.map((group, gi) => (
            <Reveal key={group.label} delay={0.08 + gi * 0.07}>
              {/* Double-Bezel card per group */}
              <div
                className="relative rounded-[1.5rem] p-1.5"
                style={{
                  background:
                    "linear-gradient(180deg, hsl(0 0% 100% / 0.055), hsl(0 0% 100% / 0.015))",
                  border: "1px solid hsl(0 0% 100% / 0.07)",
                }}
              >
                <div
                  className="rounded-[calc(1.5rem-0.375rem)] px-6 sm:px-8 py-6"
                  style={{
                    background:
                      "linear-gradient(180deg, hsl(240 7% 10%), hsl(240 6% 7%))",
                    boxShadow: "0 1px 0 hsl(0 0% 100% / 0.06) inset",
                  }}
                >
                  {/* Group label */}
                  <span
                    className="text-[10px] uppercase tracking-[0.22em] font-medium"
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      color: "hsl(36 10% 50%)",
                    }}
                  >
                    {group.label}
                  </span>

                  {/* Shortcut rows */}
                  <div className="mt-5 flex flex-col gap-3">
                    {group.shortcuts.map((s, si) => (
                      <div
                        key={si}
                        className="flex items-center justify-between gap-4"
                        style={{
                          paddingTop: si > 0 ? "0.75rem" : 0,
                          borderTop: si > 0 ? "1px solid hsl(0 0% 100% / 0.05)" : "none",
                        }}
                      >
                        {/* Keys */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {s.keys.map((k, ki) => (
                            <Key key={ki} label={k} />
                          ))}
                        </div>

                        {/* Description */}
                        <span
                          className="text-[13px] font-medium text-right"
                          style={{ color: "hsl(36 14% 72%)" }}
                        >
                          {s.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
