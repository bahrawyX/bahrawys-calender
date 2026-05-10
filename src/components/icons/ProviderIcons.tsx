import React from 'react';

interface ProviderIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Use plain <img> instead of next/image — SVG files don't go through the
// Next.js image optimizer, and next/image can fail to render SVGs served
// from /public when dimensions are specified dynamically.
export const OutlookProviderIcon: React.FC<ProviderIconProps> = ({ size = 16, className }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/svgs/providers/outlook.svg"
    alt="Outlook"
    width={size}
    height={size}
    className={className}
  />
);

export const GoogleProviderIcon: React.FC<ProviderIconProps> = ({ size = 16, className }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/svgs/providers/google.svg"
    alt="Google"
    width={size}
    height={size}
    className={className}
  />
);

export const AppleProviderIcon: React.FC<ProviderIconProps> = ({ size = 16, className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={style}
    aria-label="Apple"
  >
    <path
      d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C3.79 16.16 4.36 9.58 8.72 9.33c1.27.07 2.16.72 2.91.77.97-.2 1.9-.77 2.93-.7 1.24.1 2.17.58 2.78 1.5-2.55 1.53-1.95 4.89.58 5.82-.46 1.2-.67 1.73-1.27 2.79-.6.95-1.44 2.18-2.6 2.27-.97-.02-1.28-.66-2.6-.66-1.33 0-1.67.64-2.7.68-1.14.04-2.01-1.16-2.6-2.11-1.69-2.67-1.84-5.81-.81-7.48.73-1.18 1.89-1.87 3.12-1.88 1.17-.01 2.27.79 2.99.79.72 0 2.06-.98 3.47-.84.59.03 2.25.24 3.31 1.79-2.87 1.76-2.4 5.42.67 6.52-.41 1.06-.72 1.62-1.27 2.59z"
      fill="currentColor"
    />
    <path
      d="M15.84 4.03c.67-.87 1.12-2.05.95-3.28-1.07.08-2.33.75-3.06 1.64-.66.8-1.21 2-1 3.17 1.18.03 2.39-.66 3.11-1.53z"
      fill="currentColor"
    />
  </svg>
);
