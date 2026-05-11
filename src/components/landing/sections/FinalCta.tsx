"use client";

/**
 * FinalCta — the last push. One massive headline, one big button.
 * Wrapped in a Double-Bezel container so it reads as a "summary card"
 * separating itself from the rest of the page.
 */

import Link from "next/link";
import { Reveal } from "../Reveal";

export function FinalCta() {
  return (
    <section className="relative py-20 sm:py-28 px-5 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal y={36}>
          <div
            className="relative rounded-[2rem] p-1.5"
            style={{
              background:
                "linear-gradient(180deg, hsl(249 66% 48% / 0.12), hsl(264 58% 42% / 0.04))",
              border: "1px solid hsl(249 66% 64% / 0.15)",
              boxShadow:
                "0 60px 120px -40px hsl(249 66% 26% / 0.28), 0 1px 0 hsl(0 0% 100% / 0.08) inset",
            }}
          >
            <div
              className="rounded-[calc(2rem-0.375rem)] py-20 sm:py-28 lg:py-32 px-8 sm:px-12 text-center overflow-hidden relative"
              style={{
                background:
                  "radial-gradient(80% 60% at 50% 0%, hsl(249 35% 15%), hsl(240 7% 7%) 70%)",
                boxShadow: "0 1px 0 hsl(0 0% 100% / 0.1) inset",
              }}
            >
              {/* Soft ambient orb */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-32 h-64"
                style={{
                  background:
                    "radial-gradient(40% 100% at 50% 100%, hsl(249 66% 56% / 0.22), transparent 70%)",
                }}
              />

              <h2
                className="relative text-[40px] sm:text-[60px] lg:text-[80px] leading-[0.98] tracking-[-0.034em] font-medium max-w-[16ch] mx-auto"
                style={{
                  fontFamily: "'ClashDisplay-Variable', sans-serif",
                  color: "hsl(36 28% 97%)",
                }}
              >
                Open Bahrawy.{" "}
                <span style={{ color: "hsl(36 16% 64%)" }}>It loads before you read this.</span>
              </h2>

              <p
                className="relative mt-7 max-w-[46ch] mx-auto text-base sm:text-[17px] leading-[1.6]"
                style={{ color: "hsl(36 12% 72%)" }}
              >
                No signup. No card. No onboarding. Just a calendar.
              </p>

              <div className="relative mt-10 flex flex-wrap justify-center gap-3">
                <Link
                  href="/calendar"
                  className="group inline-flex items-center gap-2 rounded-full pl-6 pr-2 py-2.5 text-[16px] font-medium transition-transform duration-200 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(180deg, hsl(36 30% 98%), hsl(36 22% 92%))",
                    color: "hsl(248 30% 8%)",
                    boxShadow:
                      "0 1px 0 hsl(0 0% 100% / 0.7) inset, 0 0 0 1px hsl(0 0% 100% / 0.1), 0 28px 60px -20px hsl(249 66% 50% / 0.3)",
                  }}
                >
                  <span>Open Bahrawy</span>
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px]"
                    style={{
                      background: "hsl(248 30% 8%)",
                      color: "hsl(36 28% 96%)",
                    }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="9 7 17 7 17 15" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
