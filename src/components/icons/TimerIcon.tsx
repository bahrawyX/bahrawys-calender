import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const TimerIcon: React.FC<IconProps> = (props) => {
    return (
        <IconBase {...props} whileHover="hover">
            <line x1="10" y1="2" x2="14" y2="2" />
            <line x1="12" y1="14" x2="15" y2="11" />
            <circle cx="12" cy="14" r="8" />
            <motion.circle
                cx="12" cy="14" r="8"
                strokeDasharray="50"
                strokeDashoffset="50"
                variants={{
                    hover: { strokeDashoffset: 0 }
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            />
        </IconBase>
    );
};
