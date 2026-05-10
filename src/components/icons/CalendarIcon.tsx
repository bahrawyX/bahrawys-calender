import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const CalendarIcon: React.FC<IconProps> = (props) => {
    return (
        <IconBase {...props} whileHover="hover">
            <motion.rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
                ry="2"
            />
            <motion.line
                x1="16" y1="2" x2="16" y2="6"
                variants={{ hover: { y: [0, -1, 0] } }}
                transition={{ duration: 0.2 }}
            />
            <motion.line
                x1="8" y1="2" x2="8" y2="6"
                variants={{ hover: { y: [0, -1, 0], transition: { delay: 0.05 } } }}
            />
            <motion.line x1="3" y1="10" x2="21" y2="10" />
            <motion.path
                d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </IconBase>
    );
};
