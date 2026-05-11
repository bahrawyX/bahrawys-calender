"use client";

/**
 * Features — Asymmetrical Bento Grid with Double-Bezel cards.
 *
 * Per high-end-visual-design §3.B archetype 1: "A masonry-like CSS Grid of
 * varying card sizes (e.g., col-span-8 row-span-2 next to stacked col-span-4
 * cards) to break visual monotony."
 *
 * Per §4.A: every card uses the Double-Bezel architecture:
 *   - Outer shell: subtle bg, hairline ring, p-1.5, rounded-[2rem]
 *   - Inner core: distinct bg, inset highlight, mathematically smaller radius
 *
 * Mobile collapse: single column, w-full, gap-6, no col-span overrides.
 */

import { Reveal } from "../Reveal";
import type { ReactNode } from "react";

export function Features() {
  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <Reveal>
          <span
            className="text-[10px] uppercase tracking-[0.22em] font-medium"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color: "hsl(249 60% 72%)",
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
              color: "hsl(36 24% 95%)",
            }}
          >
            Six things that{" "}
            <span style={{ color: "hsl(36 14% 60%)" }}>most calendars get wrong.</span>
          </h2>
        </Reveal>

        {/* Bento grid — 12 cols on desktop, asymmetric */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_auto] gap-4 sm:gap-5">
          {/* Card 1 — wide hero feature: multi-provider sync */}
          <Reveal className="lg:col-span-7 lg:row-span-1">
            <FeatureShell className="min-h-[420px] lg:min-h-[460px]">
              <FeatureCore tone="purple">
                <FeatureCopy
                  eyebrow="Sync"
                  title="Three providers. One grid."
                  body="Google, Outlook, and iCloud appear in the same view, colored by their source. Tokens encrypted, refresh handled automatically."
                />
                <ProviderShowcase />
              </FeatureCore>
            </FeatureShell>
          </Reveal>

          {/* Card 2 — drag to reschedule */}
          <Reveal delay={0.06} className="lg:col-span-5 lg:row-span-1">
            <FeatureShell className="min-h-[420px] lg:min-h-[460px]">
              <FeatureCore>
                <FeatureCopy
                  eyebrow="Direct manipulation"
                  title="Drag any event, anywhere."
                  body="Cross-day, cross-week, cross-view. Pixel-precise on desktop, finger-friendly on mobile."
                />
                <DragMockup />
              </FeatureCore>
            </FeatureShell>
          </Reveal>

          {/* Card 3 — recurrence */}
          <Reveal delay={0.12} className="lg:col-span-4">
            <FeatureShell className="min-h-[280px]">
              <FeatureCore tone="dim">
                <FeatureCopy
                  eyebrow="Recurrence"
                  title="Done right."
                  body="iCalendar RRULE under the hood. Edit one occurrence, the series, or this and all future. Skip a day without breaking the pattern."
                  compact
                />
              </FeatureCore>
            </FeatureShell>
          </Reveal>

          {/* Card 4 — contexts */}
          <Reveal delay={0.18} className="lg:col-span-4">
            <FeatureShell className="min-h-[280px]">
              <FeatureCore>
                <FeatureCopy
                  eyebrow="Contexts"
                  title="Six built in. Make your own."
                  compact
                />
                <ContextChips />
              </FeatureCore>
            </FeatureShell>
          </Reveal>

          {/* Card 5 — local first */}
          <Reveal delay={0.24} className="lg:col-span-4">
            <FeatureShell className="min-h-[280px]">
              <FeatureCore tone="dim">
                <FeatureCopy
                  eyebrow="Local-first"
                  title="No account. No server. Yours."
                  body="Everything you create stays in IndexedDB on this device. Provider tokens never leave your encrypted cookie."
                  compact
                />
              </FeatureCore>
            </FeatureShell>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── Double-Bezel primitives ────────────────────────────────────── */

function FeatureShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[1.75rem] p-1.5 h-full ${className}`}
      style={{
        background: "linear-gradient(180deg, hsl(0 0% 100% / 0.05), hsl(0 0% 100% / 0.015))",
        border: "1px solid hsl(0 0% 100% / 0.06)",
        boxShadow: "0 1px 0 hsl(0 0% 100% / 0.05) inset",
      }}
    >
      {children}
    </div>
  );
}

function FeatureCore({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "purple" | "dim";
}) {
  const styles: React.CSSProperties =
    tone === "purple"
      ? {
          background:
            "radial-gradient(120% 100% at 0% 0%, hsl(249 45% 20% / 0.6), hsl(240 7% 8%) 60%)",
          boxShadow:
            "0 1px 0 hsl(0 0% 100% / 0.08) inset, 0 0 80px -20px hsl(249 66% 48% / 0.28) inset",
        }
      : tone === "dim"
        ? {
            background: "linear-gradient(180deg, hsl(240 7% 8%), hsl(240 5% 6%))",
            boxShadow: "0 1px 0 hsl(0 0% 100% / 0.04) inset",
          }
        : {
            background: "linear-gradient(180deg, hsl(240 7% 10%), hsl(240 6% 7%))",
            boxShadow: "0 1px 0 hsl(0 0% 100% / 0.06) inset",
          };

  return (
    <div
      className="relative h-full rounded-[calc(1.75rem-0.375rem)] p-6 sm:p-8 lg:p-10 flex flex-col overflow-hidden"
      style={styles}
    >
      {children}
    </div>
  );
}

function FeatureCopy({
  eyebrow,
  title,
  body,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  compact?: boolean;
}) {
  return (
    <div>
      <span
        className="text-[10px] uppercase tracking-[0.22em] font-medium"
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          color: "hsl(36 10% 55%)",
        }}
      >
        {eyebrow}
      </span>
      <h3
        className={`mt-3 ${compact ? "text-[24px] sm:text-[28px]" : "text-[28px] sm:text-[34px]"} leading-[1.08] tracking-[-0.022em] font-medium`}
        style={{
          fontFamily: "'ClashDisplay-Variable', sans-serif",
          color: "hsl(36 24% 96%)",
        }}
      >
        {title}
      </h3>
      {body && (
        <p
          className={`mt-3 ${compact ? "text-[14px]" : "text-[15px]"} leading-[1.55] max-w-[42ch]`}
          style={{ color: "hsl(36 12% 66%)" }}
        >
          {body}
        </p>
      )}
    </div>
  );
}

/* ─── Visuals inside cards ───────────────────────────────────────── */

function ProviderShowcase() {
  return (
    <div className="mt-auto pt-8 flex flex-wrap items-center gap-3">
      {[
        { name: "Google", initial: "G", from: "210 60% 50%", to: "215 65% 35%" },
        { name: "Outlook", initial: "O", from: "205 80% 45%", to: "215 70% 30%" },
        { name: "Apple", initial: "A", from: "0 0% 65%", to: "0 0% 35%" },
      ].map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2.5 rounded-full pl-1 pr-4 py-1"
          style={{
            background: "hsl(0 0% 100% / 0.04)",
            border: "1px solid hsl(0 0% 100% / 0.07)",
          }}
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold"
            style={{
              background: `linear-gradient(135deg, hsl(${p.from}), hsl(${p.to}))`,
              color: "hsl(36 30% 98%)",
              boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.2)",
            }}
          >
            {p.initial}
          </span>
          <span
            className="text-[13px] font-medium"
            style={{ color: "hsl(36 16% 84%)" }}
          >
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function DragMockup() {
  return (
    <div className="mt-auto pt-6 relative">
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 21 }).map((_, i) => {
          const hasEvent = [3, 9, 14, 17].includes(i);
          const isHighlighted = i === 14;
          return (
            <div
              key={i}
              className="aspect-[7/4] rounded-md relative"
              style={{
                background: isHighlighted
                  ? "linear-gradient(135deg, hsl(249 70% 22%), hsl(249 60% 14%))"
                  : "hsl(0 0% 100% / 0.025)",
                border: isHighlighted
                  ? "1px solid hsl(249 70% 65% / 0.55)"
                  : "1px solid hsl(0 0% 100% / 0.05)",
              }}
            >
              {hasEvent && !isHighlighted && (
                <div
                  className="absolute inset-1 rounded-[3px]"
                  style={{
                    background: "linear-gradient(135deg, hsl(249 60% 60% / 0.18), hsl(249 60% 50% / 0.06))",
                    border: "1px solid hsl(249 70% 65% / 0.25)",
                  }}
                />
              )}
              {isHighlighted && (
                <div
                  className="absolute inset-1 rounded-[3px] flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(249 80% 70% / 0.5), hsl(280 70% 60% / 0.3))",
                    border: "1px solid hsl(249 80% 75% / 0.6)",
                    boxShadow: "0 0 20px hsl(249 80% 60% / 0.4)",
                  }}
                >
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="hsl(36 24% 96%)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating "now dragging" pill */}
      <div
        className="absolute -top-3 right-2 rounded-full px-3 py-1.5 text-[10px] font-medium flex items-center gap-1.5"
        style={{
          background: "hsl(240 7% 9% / 0.95)",
          border: "1px solid hsl(249 70% 65% / 0.4)",
          color: "hsl(36 20% 92%)",
          boxShadow: "0 12px 30px -10px hsl(0 0% 0% / 0.5)",
          fontFamily: "var(--font-geist-mono), monospace",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "hsl(249 80% 70%)", boxShadow: "0 0 6px hsl(249 80% 70%)" }}
        />
        moving
      </div>
    </div>
  );
}

function ContextChips() {
  const contexts = [
    { name: "Critical", color: "#EF4444" },
    { name: "Focus",    color: "#6D59E0" },
    { name: "Work",     color: "#475569" },
    { name: "Social",   color: "#F59E0B" },
    { name: "Personal", color: "#10B981" },
    { name: "Health",   color: "#EC4899" },
  ];
  return (
    <div className="mt-auto pt-6 flex flex-wrap gap-1.5">
      {contexts.map((c) => (
        <span
          key={c.name}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
          style={{
            background: `${c.color}14`,
            border: `1px solid ${c.color}28`,
            color: "hsl(36 18% 90%)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
          {c.name}
        </span>
      ))}
    </div>
  );
}
