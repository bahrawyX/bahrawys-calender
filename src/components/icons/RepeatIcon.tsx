import React from 'react';
import { IconBase, type IconProps } from './IconBase';

/**
 * Two-arrow loop icon — standard repeat/recurrence symbol.
 * Uses a 16×16 viewBox for crispness at small sizes (10–14px).
 */
export const RepeatIcon: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <IconBase size={size} viewBox="0 0 16 16" strokeWidth={1.5} {...props}>
    <path
      d="M3 4h8.5M3 4l2-2M3 4l2 2M13 12H4.5M13 12l-2 2M13 12l-2-2"
      vectorEffect="non-scaling-stroke"
    />
  </IconBase>
);

RepeatIcon.displayName = 'RepeatIcon';
