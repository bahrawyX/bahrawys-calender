import React from 'react';

interface ProviderIconProps {
  size?: number;
  className?: string;
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
