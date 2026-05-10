/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/hooks/**/*.{ts,tsx}',
    './src/store/**/*.{ts,tsx}',
    './src/styles/**/*.{ts,tsx}',
    './src/engine/**/*.{ts,tsx}',
    './src/services/**/*.{ts,tsx}',
    './src/utils/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6D59E0',
          foreground: 'hsl(var(--primary-foreground))',
          hover:   '#5B4AC5',
          soft:    '#6D59E015',
        },
        warm: {
          50:  '#FBF9F6',
          100: '#F5F2EA',
          200: '#EBE7DC',
        },
        neutral: {
          dark:   '#0E0E12',
          panel:  '#15151D',
          border: '#24242E',
        },
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '20px',
        '3xl': '32px',
      },
      boxShadow: {
        soft:     '0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)',
        elevated: '0 20px 48px -12px rgba(0,0,0,0.08), 0 8px 16px -8px rgba(0,0,0,0.04)',
        layered:  '0 10px 30px -5px rgba(0,0,0,0.1), 0 5px 15px -5px rgba(0,0,0,0.04)',
        /* Signature card depth — graduated rest → hover tiers */
        card:       '0 1px 2px rgba(17,17,28,0.03), 0 1px 3px -1px rgba(17,17,28,0.02)',
        'card-hover': '0 6px 16px -4px rgba(17,17,28,0.07), 0 2px 6px -2px rgba(17,17,28,0.04)',
        'card-lift':  '0 14px 32px -10px rgba(17,17,28,0.12), 0 4px 10px -4px rgba(17,17,28,0.06)',
      },
      transitionTimingFunction: {
        /* Signature easing — used across all card hover / motion */
        signature: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      fontFamily: {
        display: ['ClashDisplay-Variable', 'ClashGrotesk-Variable', 'sans-serif'],
        logo:    ['ClashDisplay-Variable', 'sans-serif'],
        sans:    ['var(--font-geist-sans)', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono:    ['var(--font-geist-mono)', '"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'toast-in':       { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'toast-out':      { from: { opacity: '1' }, to: { opacity: '0', transform: 'translateY(8px)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'toast-in':       'toast-in 0.2s ease-out',
        'toast-out':      'toast-out 0.15s ease-in forwards',
      },
    },
  },
  plugins: [],
};
