"use client";

/**
 * About — personal block linking to bahrawy.me.
 *
 * Editorial Split layout: headshot/portrait token on the left, copy and
 * single ghost-pill CTA on the right. No card grid, no testimonial
 * carousel, no gradient text.
 */

import { Reveal } from "../Reveal";

export function About() {
  return (
    <section className="relative py-28 sm:py-36 lg:py-44 px-5 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 lg:gap-20 items-start">
          {/* Portrait token — Double-Bezel framed, monogram instead of photo
              so we don't need an external asset (and impeccable bans stock
              photo placeholders anyway). */}
          <Reveal>
            <div
              className="relative rounded-[1.5rem] p-1.5 w-44 sm:w-56"
              style={{
                background: "linear-gradient(180deg, hsl(0 0% 100% / 0.08), hsl(0 0% 100% / 0.02))",
                border: "1px solid hsl(0 0% 100% / 0.08)",
                boxShadow: "0 30px 80px -28px hsl(249 70% 30% / 0.5)",
              }}
            >
              <div
                className="aspect-square rounded-[calc(1.5rem-0.375rem)] flex items-center justify-center overflow-hidden relative"
                style={{
                  background:
                    "radial-gradient(80% 80% at 30% 20%, hsl(249 50% 30%), hsl(248 16% 7%) 75%)",
                  boxShadow: "0 1px 0 hsl(0 0% 100% / 0.1) inset",
                }}
              >
                <span
                  className="text-[88px] font-medium leading-none tracking-[-0.04em]"
                  style={{
                    fontFamily: "'ClashDisplay-Variable', sans-serif",
                    color: "hsl(36 28% 96%)",
                    textShadow: "0 4px 24px hsl(249 80% 50% / 0.4)",
                  }}
                >
                  B
                </span>
                {/* Subtle orbit ring */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[calc(1.5rem-0.375rem)]"
                  style={{
                    background:
                      "radial-gradient(160% 100% at 50% 110%, hsl(249 80% 60% / 0.3), transparent 60%)",
                  }}
                />
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <span
                className="text-[10px] uppercase tracking-[0.22em] font-medium"
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  color: "hsl(249 60% 72%)",
                }}
              >
                The maker
              </span>
            </Reveal>

            <Reveal delay={0.05}>
              <h2
                className="mt-5 text-[36px] sm:text-[48px] lg:text-[58px] leading-[1.02] tracking-[-0.032em] font-medium max-w-[18ch]"
                style={{
                  fontFamily: "'ClashDisplay-Variable', sans-serif",
                  color: "hsl(36 24% 95%)",
                }}
              >
                Built by{" "}
                <a
                  href="https://www.bahrawy.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-block transition-colors duration-300"
                  style={{ color: "hsl(249 70% 75%)" }}
                >
                  Bahrawy
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 -bottom-1 h-px"
                    style={{ background: "hsl(249 70% 75% / 0.4)" }}
                  />
                </a>
                .
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p
                className="mt-7 max-w-[54ch] text-base sm:text-[17px] leading-[1.62]"
                style={{ color: "hsl(36 12% 70%)" }}
              >
                I&apos;m a software engineer who keeps ending up building the
                tools I wish existed. Mina is one of those: a calendar I could
                live inside, fast enough to disappear, honest enough to stay.
                If you&apos;re curious about the rest of what I&apos;m making,
                the journal lives at bahrawy.me.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <a
                href="https://www.bahrawy.me"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-9 group inline-flex items-center gap-2 rounded-full pl-5 pr-2 py-2 text-[15px] font-medium transition-transform duration-200 active:scale-[0.97]"
                style={{
                  background: "hsl(0 0% 100% / 0.05)",
                  border: "1px solid hsl(0 0% 100% / 0.1)",
                  color: "hsl(36 18% 90%)",
                }}
              >
                <span>Visit bahrawy.me</span>
                <span
                  className="grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[1px]"
                  style={{
                    background: "linear-gradient(135deg, hsl(249 70% 60%), hsl(280 60% 50%))",
                    color: "hsl(36 28% 98%)",
                    boxShadow: "0 0 18px hsl(249 70% 55% / 0.3)",
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="9 7 17 7 17 15" />
                  </svg>
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
