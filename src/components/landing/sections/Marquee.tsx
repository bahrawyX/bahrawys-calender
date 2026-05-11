"use client";

/**
 * Marquee — slow horizontal scroll of "what plugs in".
 * Pure CSS animation (off main thread). Linear is the only valid easing
 * for constant motion per emil-design-eng §3.
 */

export function Marquee() {
  const items = [
    "Google Calendar",
    "Outlook 365",
    "Apple iCloud",
    "Local-first storage",
    "Recurring events",
    "Drag · drop",
    "Multi-context",
    "Keyboard-first",
    "No telemetry",
  ];

  return (
    <section
      className="relative py-12 sm:py-16 border-y overflow-hidden"
      style={{
        borderColor: "var(--lp-border-faint)",
        background: "var(--lp-marquee-bg)",
      }}
    >
      {/* Edge fades so the marquee doesn't end abruptly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 sm:w-40"
        style={{ background: "linear-gradient(to right, var(--lp-marquee-fade), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 sm:w-40"
        style={{ background: "linear-gradient(to left, var(--lp-marquee-fade), transparent)" }}
      />

      <div className="flex whitespace-nowrap [animation:marquee_38s_linear_infinite]">
        <Track items={items} />
        <Track items={items} aria-hidden />
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </section>
  );
}

function Track({ items, ...rest }: { items: string[] } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16 shrink-0" {...rest}>
      {items.map((item, i) => (
        <div key={`${item}-${i}`} className="flex items-center gap-4 shrink-0">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--lp-purple)" }}
          />
          <span
            className="text-base sm:text-xl font-medium tracking-[-0.01em]"
            style={{
              fontFamily: "'ClashDisplay-Variable', sans-serif",
              color: "var(--lp-body)",
            }}
          >
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}
