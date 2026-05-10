'use client';

/**
 * Fire a celebratory confetti burst.
 *
 * canvas-confetti is lazy-loaded on first call so the 30+ KB library
 * never ships in the initial bundle — it only arrives after the user
 * actually completes their first task.
 *
 * Respects prefers-reduced-motion — skips entirely if user prefers
 * reduced motion (avoids even loading the module in that case).
 */
export async function triggerConfetti(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const { default: confetti } = await import('canvas-confetti');

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: [
      'hsl(249, 66%, 61%)', // primary
      'hsl(38, 92%, 50%)',  // amber
      'hsl(142, 71%, 45%)', // emerald
      'hsl(262, 83%, 58%)', // violet
      'hsl(346, 77%, 49%)', // rose
    ],
    disableForReducedMotion: true,
    ticks: 150,
    gravity: 1.2,
    scalar: 0.9,
  });
}
