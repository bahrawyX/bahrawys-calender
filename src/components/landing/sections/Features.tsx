"use client";

/**
 * Features — editorial numbered list.
 *
 * Clean typography-forward design: six features as full-width rows,
 * separated by hairline dividers. No cards, no bento grid — just
 * generous spacing, large index numbers, and ClashDisplay headings.
 *
 * Desktop: three-column row  [index | title | body]
 * Mobile:  two-column row    [index | title + body stacked]
 */

import { Reveal } from "../Reveal";

const FEATURES = [
  {
    eyebrow: "Sync",
    title: "Three providers. One grid.",
    body: "Google, Outlook, and iCloud appear in the same view, colored by their source. Tokens encrypted, refresh handled automatically.",
  },
  {
    eyebrow: "Direct manipulation",
    title: "Drag any event, anywhere.",
    body: "Cross-day, cross-week, cross-view. Pixel-precise on desktop, finger-friendly on mobile.",
  },
  {
    eyebrow: "Recurrence",
    title: "Done right.",
    body: "iCalendar RRULE under the hood. Edit one occurrence, the series, or this and all future. Skip a day without breaking the pattern.",
  },
  {
    eyebrow: "Contexts",
    title: "Six built in. Make your own.",
    body: "Critical, Focus, Work, Social, Personal, Health. Toggle each on or off in one click and watch the noise disappear.",
  },
  {
    eyebrow: "Local-first",
    title: "No account. No server. Yours.",
    body: "Everything stays in IndexedDB on this device. Provider tokens never leave your encrypted cookie.",
  },
  {
    eyebrow: "Speed",
    title: "Open and forget.",
    body: "The grid renders before the network is even consulted. External calendars sync in the background, never blocking the view.",
  },
] as const;

export function Features() {
  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Section header */}
        <Reveal>
          <span
            className="text-[10px] uppercase tracking-[0.22em] font-medium"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color: "var(--lp-purple)",
            }}
          >
            What you get
          </span>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            className="mt-5 text-[36px] sm:text-[52px] lg:text-[64px] leading-[0.98] tracking-[-0.033em] font-medium max-w-[22ch]"
            style={{
              fontFamily: "'ClashDisplay-Variable', sans-serif",
              color: "var(--lp-h)",
            }}
          >
            Six things that{" "}
            <span style={{ color: "var(--lp-h-soft)" }}>most calendars get wrong.</span>
          </h2>
        </Reveal>

        {/* Feature rows */}
        <div className="mt-16 sm:mt-20">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={0.04 + i * 0.05}>
              <div
                className="group grid grid-cols-[3rem_1fr] lg:grid-cols-[5rem_1fr_1.1fr] gap-x-6 lg:gap-x-12 items-start py-8 sm:py-10 border-t transition-colors duration-300"
                style={{ borderColor: "var(--lp-border)" }}
              >
                {/* Index number */}
                <span
                  className="text-[13px] font-medium tracking-[0.06em] pt-1 tabular-nums"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "var(--lp-dim)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Title — always visible */}
                <div className="lg:pr-8">
                  <span
                    className="text-[10px] uppercase tracking-[0.2em] font-medium"
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      color: "var(--lp-label)",
                    }}
                  >
                    {f.eyebrow}
                  </span>
                  <h3
                    className="mt-2 text-[22px] sm:text-[28px] lg:text-[32px] leading-[1.1] tracking-[-0.022em] font-medium"
                    style={{
                      fontFamily: "'ClashDisplay-Variable', sans-serif",
                      color: "var(--lp-h)",
                    }}
                  >
                    {f.title}
                  </h3>
                  {/* Body visible on mobile under title */}
                  <p
                    className="lg:hidden mt-3 text-[14px] leading-[1.6]"
                    style={{ color: "var(--lp-body)" }}
                  >
                    {f.body}
                  </p>
                </div>

                {/* Body — desktop right column */}
                <p
                  className="hidden lg:block text-[15px] sm:text-[16px] leading-[1.65] pt-1"
                  style={{ color: "var(--lp-body)" }}
                >
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}

          {/* Bottom border */}
          <div
            className="border-t"
            style={{ borderColor: "var(--lp-border)" }}
          />
        </div>

      </div>
    </section>
  );
}
