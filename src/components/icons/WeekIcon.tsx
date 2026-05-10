import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const WeekIcon: React.FC<IconProps> = (props) => {
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
            {/* Bars representing days */}
            <motion.rect x="7" y="14" width="2" height="4" rx="1" variants={{ hover: { height: 6, y: -1 } }} transition={{ duration: 0.15 }} />
            <motion.rect x="11" y="14" width="2" height="4" rx="1" variants={{ hover: { height: 5, y: -0.5 } }} transition={{ duration: 0.15, delay: 0.05 }} />
            <motion.rect x="15" y="14" width="2" height="4" rx="1" variants={{ hover: { height: 7, y: -1.5 } }} transition={{ duration: 0.15, delay: 0.1 }} />
        </IconBase>
    );
};
