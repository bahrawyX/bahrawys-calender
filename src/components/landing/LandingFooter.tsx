"use client";

/**
 * LandingFooter — minimal footer. Three line items (left brand, middle
 * status, right links). No card, no copyright fluff, no social grid.
 */

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer
      className="relative z-10 border-t mt-12 px-5 sm:px-8"
      style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
    >
      <div className="mx-auto max-w-7xl py-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <MinaMark />
          <div className="flex flex-col leading-tight">
            <span
              className="text-[15px] font-medium tracking-[-0.018em]"
              style={{
                fontFamily: "'ClashDisplay-Variable', sans-serif",
                color: "hsl(36 22% 92%)",
              }}
            >
              Mina
            </span>
            <span
              className="text-[11px] tracking-[0.04em]"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                color: "hsl(36 10% 54%)",
              }}
            >
              v1 · live · 2026
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-[13px]">
          <Link
            href="/calendar"
            className="transition-colors"
            style={{ color: "hsl(36 14% 76%)" }}
          >
            Calendar
          </Link>
          <a
            href="https://www.bahrawy.me"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors flex items-center gap-1.5"
            style={{ color: "hsl(36 14% 76%)" }}
          >
            bahrawy.me
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="9 7 17 7 17 15" />
            </svg>
          </a>
          <a
            href="https://mina-scheduler.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors flex items-center gap-1.5"
            style={{ color: "hsl(36 14% 76%)" }}
          >
            mina-scheduler.vercel.app
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="9 7 17 7 17 15" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

function MinaMark() {
  return (
    <span
      className="grid h-8 w-8 place-items-center rounded-[9px]"
      style={{
        background: "linear-gradient(135deg, hsl(249 70% 65%), hsl(280 60% 55%))",
        boxShadow: "0 0 16px hsl(249 70% 60% / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
      }}
      aria-hidden
    >
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ color: "hsl(36 30% 98%)" }}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="3" x2="8" y2="6" />
        <line x1="16" y1="3" x2="16" y2="6" />
      </svg>
    </span>
  );
}
