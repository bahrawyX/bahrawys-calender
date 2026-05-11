"use client";

/**
 * LandingNav — floating glass pill, detached from the top edge.
 *
 * Per high-end-visual-design §5.A: closed nav is a "floating glass pill
 * detached from the top". mt-6, w-max, rounded-full, glass blur. Opens
 * into a screen-filling overlay on mobile with staggered link reveal.
 *
 * Per emil-design-eng: keyboard-initiated nav opens are repeated often
 * enough that we use a fast 180ms ease-out, never bouncy springs.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePageTransition } from "@/context/TransitionContext";

const EASE_OUT_QUART: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { trigger } = usePageTransition();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const links = [
    { label: "Calendar", href: "/calendar" },
    { label: "Maker", href: "https://www.bahrawy.me", external: true },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
        <motion.nav
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT_QUART, delay: 0.1 }}
          className="pointer-events-auto mt-5 sm:mt-7 flex items-center gap-1 rounded-full border px-2 py-1.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)]"
          style={{
            // Adaptive opacity: tighter glass when scrolled, lighter at top
            backgroundColor: scrolled ? "hsl(240 7% 8% / 0.78)" : "hsl(240 7% 9% / 0.45)",
            borderColor: "hsl(0 0% 100% / 0.08)",
            backdropFilter: "blur(16px) saturate(140%)",
            WebkitBackdropFilter: "blur(16px) saturate(140%)",
            transition: "background-color 360ms cubic-bezier(0.165, 0.84, 0.44, 1)",
          }}
        >
          {/* Wordmark — clickable, scrolls to top */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 rounded-full px-2.5 py-1.5"
            aria-label="Bahrawy Calendar, scroll to top"
          >
            <BahrawyMark />
            <span
              className="text-[15px] font-medium tracking-[-0.02em]"
              style={{ fontFamily: "'ClashDisplay-Variable', sans-serif", color: "hsl(36 20% 96%)" }}
            >
              Bahrawy
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-0.5">
            {links.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="navlink"
                >
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} href={l.href} className="navlink">
                  {l.label}
                </Link>
              ),
            )}
          </div>

          {/* Primary CTA — button-in-button trailing icon */}
          <button
            type="button"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              trigger("/calendar", { x: r.left + r.width / 2, y: r.top + r.height / 2 });
            }}
            className="ml-1 group relative inline-flex items-center gap-1.5 rounded-full pl-3.5 pr-1.5 py-1.5 text-[13px] font-medium transition-transform duration-200 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, hsl(36 24% 98%), hsl(36 20% 94%))",
              color: "hsl(248 30% 10%)",
              boxShadow:
                "0 1px 0 hsl(0 0% 100% / 0.4) inset, 0 0 0 1px hsl(0 0% 100% / 0.06)",
            }}
          >
            <span>Open</span>
            <span
              className="grid h-7 w-7 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5"
              style={{
                background: "hsl(248 30% 10%)",
                color: "hsl(36 20% 96%)",
              }}
            >
              <ArrowUpRight size={12} />
            </span>
          </button>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="sm:hidden grid h-9 w-9 place-items-center rounded-full text-[hsl(36_20%_96%)] hover:bg-white/5 transition-colors"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          </button>
        </motion.nav>

        <style jsx>{`
          .navlink {
            position: relative;
            display: inline-flex;
            align-items: center;
            padding: 0.375rem 0.875rem;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 500;
            color: hsl(36 12% 78%);
            transition: color 200ms ease-out, background-color 200ms ease-out;
          }
          .navlink:hover {
            color: hsl(36 20% 96%);
            background-color: hsl(0 0% 100% / 0.05);
          }
        `}</style>
      </header>

      {/* Mobile overlay — staggered link reveal per high-end §5.A */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="fixed inset-0 z-[60] flex flex-col px-6 pt-6"
            style={{
              backgroundColor: "hsl(240 8% 7% / 0.94)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BahrawyMark />
                <span
                  className="text-[17px] font-medium tracking-[-0.02em]"
                  style={{ fontFamily: "'ClashDisplay-Variable', sans-serif", color: "hsl(36 20% 96%)" }}
                >
                  Bahrawy
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full text-[hsl(36_20%_96%)] hover:bg-white/5 transition-colors"
                aria-label="Close menu"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="mt-16 flex flex-col gap-2">
              {[...links, { label: "Open Bahrawy", href: "/calendar" }].map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.08 + i * 0.06 }}
                >
                  {(l as any).external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="mobile-link"
                    >
                      {l.label}
                      <ArrowUpRight size={18} />
                    </a>
                  ) : (
                    <Link href={l.href} onClick={() => setOpen(false)} className="mobile-link">
                      {l.label}
                      <ArrowUpRight size={18} />
                    </Link>
                  )}
                </motion.div>
              ))}
            </nav>

            <style jsx>{`
              .mobile-link {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.25rem 0.25rem;
                font-family: "ClashDisplay-Variable", sans-serif;
                font-size: 2.5rem;
                font-weight: 400;
                letter-spacing: -0.03em;
                color: hsl(36 20% 96%);
                border-bottom: 1px solid hsl(0 0% 100% / 0.06);
              }
              .mobile-link:hover {
                color: hsl(249 70% 75%);
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Tiny brand mark ─────────────────────────────────────────────── */
function BahrawyMark() {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-[8px]"
      style={{
        background: "linear-gradient(135deg, hsl(249 66% 64%), hsl(268 60% 54%))",
        boxShadow: "0 0 14px hsl(249 66% 58% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.18)",
      }}
      aria-hidden
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ color: "hsl(36 30% 98%)" }}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="3" x2="8" y2="6" />
        <line x1="16" y1="3" x2="16" y2="6" />
      </svg>
    </span>
  );
}

function ArrowUpRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="9 7 17 7 17 15" />
    </svg>
  );
}
