"use client";

/**
 * Manifesto — an editorial moment. Massive headline left, three "principles"
 * pillared on the right. Macro-whitespace (py-32+), wide grotesk, no cards.
 *
 * Anti-pattern checks:
 *   - No icon-headline-text triplet card grid (banned by impeccable)
 *   - No gradient text (banned)
 *   - No side-stripe borders (banned)
 */

import { Reveal } from "../Reveal";

export function Manifesto() {
  return (
    <section className="relative py-28 sm:py-36 lg:py-44 px-5 sm:px-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-24 items-start">
        <div className="lg:sticky lg:top-32">
          <Reveal>
            <span
              className="inline-block text-[10px] uppercase tracking-[0.22em] font-medium"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                color: "hsl(249 60% 72%)",
              }}
            >
              The premise
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h2
              className="mt-6 text-[40px] sm:text-[56px] lg:text-[72px] leading-[0.96] tracking-[-0.035em] font-medium max-w-[14ch]"
              style={{
                fontFamily: "'ClashDisplay-Variable', sans-serif",
                color: "hsl(36 24% 95%)",
              }}
            >
              Most calendars
              <br />
              <span style={{ color: "hsl(36 14% 60%)" }}>were designed to be opened.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p
              className="mt-8 max-w-[44ch] text-base sm:text-[17px] leading-[1.6]"
              style={{ color: "hsl(36 12% 68%)" }}
            >
              Bahrawy was designed to be closed. The grid loads in under a hundred
              milliseconds, the keyboard is the primary input, and your data
              stays in the browser tab where you put it.
            </p>
          </Reveal>
        </div>

        <div className="lg:pt-24 space-y-10 lg:space-y-12">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={0.15 + i * 0.08}>
              <div
                className="border-t pt-8"
                style={{ borderColor: "hsl(0 0% 100% / 0.07)" }}
              >
                <span
                  className="text-[10px] uppercase tracking-[0.22em] font-medium"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "hsl(36 10% 50%)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")} · {p.tag}
                </span>
                <h3
                  className="mt-3 text-2xl sm:text-[28px] leading-[1.15] tracking-[-0.02em] font-medium"
                  style={{
                    fontFamily: "'ClashDisplay-Variable', sans-serif",
                    color: "hsl(36 22% 94%)",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  className="mt-3 text-[15px] leading-[1.6]"
                  style={{ color: "hsl(36 12% 66%)" }}
                >
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const PRINCIPLES = [
  {
    tag: "Speed",
    title: "Open and forget.",
    body:
      "The grid is rendered before the network is even consulted. External calendars sync in the background, never blocking the view.",
  },
  {
    tag: "Privacy",
    title: "Your data, your machine.",
    body:
      "Everything you create stays in the browser. Provider tokens live in an encrypted cookie. No analytics, no server-side database, no shadow profile.",
  },
  {
    tag: "Shape",
    title: "Contexts, not categories.",
    body:
      "Critical, Focus, Work, Social, Personal, Health. Or your own. Toggle each on or off in one click and watch the noise disappear.",
  },
];
