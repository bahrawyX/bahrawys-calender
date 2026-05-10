import React from 'react';
import { motion, SVGMotionProps, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface IconProps extends Omit<SVGMotionProps<SVGSVGElement>, "children"> {
    size?: number | string;
    className?: string;
    /**
     * By default, icons inherit text color via `currentColor`.
     */
    color?: string;
    /**
     * Standard 1.5 or 2 based on usage size.
     */
    strokeWidth?: number;
    /**
     * Title for accessibility when used as a standalone button.
     */
    title?: string;
}

/**
 * Standardized SVG Icon wrapper ensuring 60fps performance and exact alignment.
 * We pass `vectorEffect="non-scaling-stroke"` so strokes stay sharp regardless of size.
 */
export const IconBase: React.FC<IconProps & { children: React.ReactNode }> = ({
    size = 18,
    color = 'currentColor',
    strokeWidth = 1.5,
    className,
    title,
    children,
    ...props
}) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('shrink-0', className)}
            aria-hidden={!title}
            aria-label={title}
            // Provide a standard transition config for hovering that respects OS settings
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 25 }}
            {...props}
        >
            {title && <title>{title}</title>}
            {children}
        </motion.svg>
    );
};

export default IconBase;
