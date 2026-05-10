'use client';

import React from 'react';
import { motion } from 'framer-motion';

// ── Shared types ─────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  className?: string;
}

// ── Fire ─────────────────────────────────────────────────────────────────────

export const FireIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.08, 1] }}
    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path
      d="M12 2c.5 3.5-1.5 6-1.5 6s2-.5 3.5 1c1.5 1.5 1 4 1 4s1.5-1 2-3c2 3.5 0 7.5-3 9-3 1.5-7 1-9-1.5S3 12.5 5 9c1-1.5 2.5-3 3-5 .5 2 2 3 4 3V2z"
      fill="hsl(var(--destructive))"
      opacity={0.9}
    />
    <motion.path
      d="M10 16c0-2 1.5-3 2-4.5.5 1.5 2 2.5 2 4.5 0 1.5-1 3-2 3s-2-1.5-2-3z"
      fill="hsl(var(--warning, var(--destructive)))"
      opacity={0.7}
      animate={{ opacity: [0.7, 0.4, 0.7] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

// ── Lightning ────────────────────────────────────────────────────────────────

export const LightningIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ opacity: [1, 0.7, 1] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      fill="hsl(var(--primary))"
      opacity={0.85}
    />
  </motion.svg>
);

// ── Trophy ───────────────────────────────────────────────────────────────────

export const TrophyIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 21h8m-4-4v4" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinecap="round" />
    <path
      d="M5 3h14v4a7 7 0 0 1-14 0V3z"
      fill="hsl(var(--primary))"
      opacity={0.2}
      stroke="hsl(var(--primary))"
      strokeWidth={1.5}
    />
    <path d="M5 5H3a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3m14-5h2a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3"
      stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinecap="round" />
    <motion.circle
      cx="12" cy="8" r="1.5"
      fill="hsl(var(--primary))"
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  </svg>
);

// ── Coin ─────────────────────────────────────────────────────────────────────

export const CoinIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Outer ring */}
    <circle cx="12" cy="12" r="10" fill="hsl(var(--primary))" opacity={0.12} stroke="hsl(var(--primary))" strokeWidth={1.5} />
    {/* Inner ring */}
    <circle cx="12" cy="12" r="7" fill="none" stroke="hsl(var(--primary))" strokeWidth={0.8} opacity={0.25} />
    {/* Star/emblem in center */}
    <path
      d="M12 7l1.3 2.6L16 10.2l-1.9 1.8.4 2.8L12 13.5l-2.5 1.3.4-2.8L8 10.2l2.7-.6L12 7z"
      fill="hsl(var(--primary))"
      opacity={0.5}
    />
    {/* Subtle gleam */}
    <motion.circle
      cx="9"
      cy="9"
      r="1.5"
      fill="hsl(var(--primary))"
      opacity={0}
      animate={{ opacity: [0, 0.4, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
    />
  </svg>
);

// ── Gem / Diamond ────────────────────────────────────────────────────────────

export const GemIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path d="M6 3h12l4 7-10 12L2 10l4-7z" fill="hsl(var(--primary))" opacity={0.15} stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M2 10h20M12 22L6 10m6 12l6-12M6 3l6 7m6-7l-6 7" stroke="hsl(var(--primary))" strokeWidth={1} opacity={0.3} />
    <motion.circle
      cx="12" cy="10" r="1"
      fill="hsl(var(--primary))"
      animate={{ opacity: [0.2, 0.7, 0.2] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

// ── Sparkles ─────────────────────────────────────────────────────────────────

export const SparklesIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <motion.path
      d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"
      fill="hsl(var(--primary))"
      animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.path
      d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z"
      fill="hsl(var(--primary))"
      opacity={0.6}
      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
    />
    <motion.path
      d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"
      fill="hsl(var(--primary))"
      opacity={0.5}
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
    />
  </svg>
);

// ── Party / Celebration ──────────────────────────────────────────────────────

export const PartyIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 22L9 7l8 8L4 22z" fill="hsl(var(--primary))" opacity={0.15} stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinejoin="round" />
    <motion.circle cx="15" cy="5" r="1.5" fill="hsl(var(--primary))" animate={{ y: [0, -2, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.circle cx="19" cy="8" r="1" fill="hsl(var(--destructive))" animate={{ y: [0, -1.5, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
    <motion.circle cx="17" cy="3" r="0.8" fill="hsl(var(--primary))" opacity={0.6} animate={{ y: [0, -2.5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
    <motion.circle cx="21" cy="11" r="0.7" fill="hsl(var(--primary))" opacity={0.5} animate={{ y: [0, -1, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
  </svg>
);

// ── Brain ────────────────────────────────────────────────────────────────────

export const BrainIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.04, 1] }}
    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path
      d="M12 3c-1.5 0-3 .8-3.5 2C7.5 5 6 6 6 8c0 1-.5 2-1 2.5S4 12 4 13c0 2 1.5 3 3 3h1v3h8v-3h1c1.5 0 3-1 3-3 0-1-.5-1.5-1-2.5S18 9 18 8c0-2-1.5-3-2.5-3C15 3.8 13.5 3 12 3z"
      fill="hsl(var(--primary))"
      opacity={0.15}
      stroke="hsl(var(--primary))"
      strokeWidth={1.5}
    />
    <path d="M12 3v16" stroke="hsl(var(--primary))" strokeWidth={1} opacity={0.3} />
    <motion.circle
      cx="12" cy="10" r="1.5"
      fill="hsl(var(--primary))"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

// ── Gear ─────────────────────────────────────────────────────────────────────

export const GearIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="hsl(var(--primary))"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    animate={{ rotate: 360 }}
    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </motion.svg>
);

// ── Chart / Analytics ────────────────────────────────────────────────────────

export const ChartIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <motion.rect x="4" y="14" width="4" height="7" rx="1" fill="hsl(var(--primary))" opacity={0.3} animate={{ height: [7, 5, 7] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.rect x="10" y="8" width="4" height="13" rx="1" fill="hsl(var(--primary))" opacity={0.5} animate={{ height: [13, 10, 13] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
    <motion.rect x="16" y="4" width="4" height="17" rx="1" fill="hsl(var(--primary))" opacity={0.7} animate={{ height: [17, 14, 17] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
  </svg>
);

// ── Shield ───────────────────────────────────────────────────────────────────

export const ShieldIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path
      d="M12 2l8 4v6c0 5.5-3.5 8.5-8 10-4.5-1.5-8-4.5-8-10V6l8-4z"
      fill="hsl(var(--primary))"
      opacity={0.15}
      stroke="hsl(var(--primary))"
      strokeWidth={1.5}
    />
    <path d="M9 12l2 2 4-4" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </motion.svg>
);

// ── Meditation / Zen ─────────────────────────────────────────────────────────

export const MeditationIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.03, 1] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    <circle cx="12" cy="6" r="3" fill="hsl(var(--primary))" opacity={0.3} stroke="hsl(var(--primary))" strokeWidth={1.5} />
    <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinecap="round" />
    <path d="M8 17l4-3 4 3" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <motion.circle
      cx="12" cy="14" r="5"
      stroke="hsl(var(--primary))"
      strokeWidth={0.5}
      fill="none"
      opacity={0.2}
      animate={{ r: [5, 7, 5], opacity: [0.2, 0, 0.2] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

// ── Star ─────────────────────────────────────────────────────────────────────

export const StarIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ rotate: [0, 5, -5, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="hsl(var(--primary))"
      opacity={0.2}
      stroke="hsl(var(--primary))"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <motion.path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="hsl(var(--primary))"
      opacity={0.1}
      animate={{ opacity: [0.1, 0.35, 0.1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

// ── Medal ────────────────────────────────────────────────────────────────────

export const MedalIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 2l4 6 4-6" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="14" r="6" fill="hsl(var(--primary))" opacity={0.15} stroke="hsl(var(--primary))" strokeWidth={1.5} />
    <motion.circle
      cx="12" cy="14" r="3"
      fill="hsl(var(--primary))"
      opacity={0.3}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  </svg>
);

// ── Money Bag ────────────────────────────────────────────────────────────────

export const MoneyBagIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ y: [0, -1, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path d="M9 3h6l-1 3H10L9 3z" fill="hsl(var(--primary))" opacity={0.3} />
    <path d="M6 10c0-2 2-4 6-4s6 2 6 4c0 4-1 10-6 11S6 14 6 10z" fill="hsl(var(--primary))" opacity={0.15} stroke="hsl(var(--primary))" strokeWidth={1.5} />
    <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="hsl(var(--primary))">$</text>
  </motion.svg>
);

// ── Calendar ─────────────────────────────────────────────────────────────────

export const CalendarIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" fill="hsl(var(--primary))" opacity={0.1} />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ── Mood Icons (animated faces) ──────────────────────────────────────────────

export const MoodGreatIcon: React.FC<IconProps> = ({ size = 28, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.08, 1] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <circle cx="12" cy="12" r="10" fill="hsl(var(--primary))" opacity={0.12} stroke="hsl(var(--primary))" strokeWidth={1.5} />
    <circle cx="9" cy="10" r="1.2" fill="hsl(var(--primary))" />
    <circle cx="15" cy="10" r="1.2" fill="hsl(var(--primary))" />
    <path d="M8 14c1 2 3 3 4 3s3-1 4-3" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinecap="round" />
  </motion.svg>
);

export const MoodGoodIcon: React.FC<IconProps> = ({ size = 28, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="hsl(var(--primary))" opacity={0.1} stroke="hsl(var(--primary))" strokeWidth={1.5} />
    <circle cx="9" cy="10" r="1.2" fill="hsl(var(--primary))" />
    <circle cx="15" cy="10" r="1.2" fill="hsl(var(--primary))" />
    <path d="M8 15c1 1.5 2.5 2 4 2s3-.5 4-2" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);

export const MoodOkayIcon: React.FC<IconProps> = ({ size = 28, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="hsl(var(--muted-foreground))" opacity={0.1} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
    <circle cx="9" cy="10" r="1.2" fill="hsl(var(--muted-foreground))" />
    <circle cx="15" cy="10" r="1.2" fill="hsl(var(--muted-foreground))" />
    <line x1="8" y1="15" x2="16" y2="15" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);

export const MoodTiredIcon: React.FC<IconProps> = ({ size = 28, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ y: [0, 1, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <circle cx="12" cy="12" r="10" fill="hsl(var(--muted-foreground))" opacity={0.1} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
    <line x1="8" y1="10" x2="10" y2="10" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeLinecap="round" />
    <line x1="14" y1="10" x2="16" y2="10" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeLinecap="round" />
    <circle cx="12" cy="16" r="2" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
  </motion.svg>
);

export const MoodBadIcon: React.FC<IconProps> = ({ size = 28, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="hsl(var(--destructive))" opacity={0.1} stroke="hsl(var(--destructive))" strokeWidth={1.5} />
    <circle cx="9" cy="10" r="1.2" fill="hsl(var(--destructive))" />
    <circle cx="15" cy="10" r="1.2" fill="hsl(var(--destructive))" />
    <path d="M8 17c1-1.5 2.5-2 4-2s3 .5 4 2" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);

// ── Mood icon lookup map ─────────────────────────────────────────────────────

export const MOOD_ICONS: Record<string, React.FC<IconProps>> = {
  great: MoodGreatIcon,
  good: MoodGoodIcon,
  okay: MoodOkayIcon,
  tired: MoodTiredIcon,
  bad: MoodBadIcon,
};

// ── Nature / Ambient Sound Icons ─────────────────────────────────────────────

export const CloudIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ x: [0, 1.5, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path d="M18 10a4 4 0 0 1 0 8H7a5 5 0 1 1 .5-9.9A7 7 0 0 1 18 10z" fill="hsl(var(--muted-foreground))" opacity={0.2} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
  </motion.svg>
);

export const RainIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M16 8a4 4 0 0 1 0 6H7a4 4 0 1 1 .5-7.9A6 6 0 0 1 16 8z" fill="hsl(var(--primary))" opacity={0.12} stroke="hsl(var(--primary))" strokeWidth={1.2} />
    <motion.line x1="8" y1="16" x2="8" y2="19" stroke="hsl(var(--primary))" strokeWidth={1.2} strokeLinecap="round" animate={{ y: [0, 2, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.line x1="12" y1="16" x2="12" y2="19" stroke="hsl(var(--primary))" strokeWidth={1.2} strokeLinecap="round" animate={{ y: [0, 2, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
    <motion.line x1="16" y1="16" x2="16" y2="19" stroke="hsl(var(--primary))" strokeWidth={1.2} strokeLinecap="round" animate={{ y: [0, 2, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
  </svg>
);

export const BrownNoiseIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <circle cx="12" cy="12" r="9" fill="hsl(var(--muted-foreground))" opacity={0.15} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
    {/*
      Cross-fade two static paths instead of animating the `d` attribute.
      framer-motion's `d` interpolation serializes adjacent positive integers
      without a separator (e.g. `c2 2 4 2 6 0` -> `c2 2 426 0`) during the
      tween midpoint, producing a flood of "<path> attribute d: Expected
      number" warnings in the console. An opacity cross-fade is visually
      equivalent here and parses cleanly.
    */}
    <motion.path
      d="M6 12c2 -2 4 2 6 0 s4 2 6 0"
      stroke="hsl(var(--muted-foreground))"
      strokeWidth={1.5}
      strokeLinecap="round"
      fill="none"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.path
      d="M6 12c2 2 4 -2 6 0 s4 -2 6 0"
      stroke="hsl(var(--muted-foreground))"
      strokeWidth={1.5}
      strokeLinecap="round"
      fill="none"
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

export const ForestIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.03, 1] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path d="M12 3l-6 9h4l-3 6h10l-3-6h4L12 3z" fill="hsl(var(--primary))" opacity={0.2} stroke="hsl(var(--primary))" strokeWidth={1.2} strokeLinejoin="round" />
    <line x1="12" y1="18" x2="12" y2="21" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" />
  </motion.svg>
);

export const OceanIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <motion.path
      d="M2 12c2-2 4 0 6-2s4 0 6-2 4 0 6-2"
      stroke="hsl(var(--primary))"
      strokeWidth={1.5}
      strokeLinecap="round"
      fill="none"
      animate={{ y: [0, 2, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.path
      d="M2 16c2-2 4 0 6-2s4 0 6-2 4 0 6-2"
      stroke="hsl(var(--primary))"
      strokeWidth={1.5}
      strokeLinecap="round"
      fill="none"
      opacity={0.5}
      animate={{ y: [0, 2, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
    />
  </svg>
);

// ── Ambient icon lookup ──────────────────────────────────────────────────────

export const AMBIENT_ICONS: Record<string, React.FC<IconProps>> = {
  rainfall: RainIcon,
  brown: BrownNoiseIcon,
  forest: ForestIcon,
  ocean: OceanIcon,
};

// ── Magnifying Glass (debug) ─────────────────────────────────────────────────

export const SearchIcon: React.FC<IconProps> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ── Tomato (standalone export for PomodoroView) ──────────────────────────────

export const TomatoIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={{ scale: [1, 1.06, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path d="M12 4c-1 0-2-.5-2-2h4c0 1.5-1 2-2 2z" fill="hsl(var(--primary))" opacity={0.6} />
    <ellipse cx="12" cy="14" rx="8" ry="8" fill="hsl(var(--destructive))" />
    <ellipse cx="10" cy="12" rx="2.5" ry="3.5" fill="hsl(var(--destructive))" opacity={0.7} />
  </motion.svg>
);

// ── Coffee (standalone export for PomodoroView) ──────────────────────────────

export const CoffeeIconAnimated: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="10" width="12" height="10" rx="2" fill="hsl(var(--muted-foreground))" opacity={0.25} />
    <path d="M16 12h2a2 2 0 0 1 0 4h-2" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} opacity={0.3} />
    <motion.path
      d="M8 8c0-2 1-3 0-4"
      stroke="hsl(var(--muted-foreground))"
      strokeWidth={1.2}
      strokeLinecap="round"
      opacity={0.4}
      animate={{ y: [0, -1.5, 0], opacity: [0.4, 0.2, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.path
      d="M11 8c0-2 1-3 0-4"
      stroke="hsl(var(--muted-foreground))"
      strokeWidth={1.2}
      strokeLinecap="round"
      opacity={0.3}
      animate={{ y: [0, -1.5, 0], opacity: [0.3, 0.15, 0.3] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
    />
  </svg>
);
