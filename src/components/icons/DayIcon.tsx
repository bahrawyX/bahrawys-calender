import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const DayIcon: React.FC<IconProps> = (props) => {
    return (
        <IconBase {...props} whileHover="hover">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <motion.line
                x1="16" y1="2" x2="16" y2="6"
            />
            <motion.line
                x1="8" y1="2" x2="8" y2="6"
            />
            <motion.line x1="3" y1="10" x2="21" y2="10" />
            {/* Single focused day element */}
            <motion.rect
                x="9" y="13" width="6" height="6" rx="1.5"
                fill="currentColor"
                variants={{
                    hover: { scale: 1.15 }
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
            />
        </IconBase>
    );
};
