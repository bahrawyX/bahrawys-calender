/**
 * Shared micro-interaction motion classes for Lumina.
 *
 * Import as `mc` to avoid shadowing framer-motion's `motion` export:
 *   import { mc } from '../styles/motion';
 *
 * Durations:
 *   hover  120ms  |  press  80ms  |  drag lift  160ms  |  modal  200ms
 */
export const mc = {
  /** Base transition covering all animatable CSS properties (120ms ease-out). */
  hover: 'transition-all duration-[120ms] ease-out',

  /** Subtle press-down scale (80ms handled by active: CSS pseudo-class). */
  press: 'active:scale-[0.98] active:duration-[80ms]',

  /** 1 px upward lift + stronger shadow on hover. */
  lift: 'hover:-translate-y-[1px] hover:shadow-md',

  /** Accessible focus ring for interactive elements. */
  focus: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1',

  /** Drag-lifted state: slight scale-up + elevated shadow. */
  dragging: 'scale-[1.02] shadow-elevated',
} as const;
