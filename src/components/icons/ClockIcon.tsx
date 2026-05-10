import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const ClockIcon: React.FC<IconProps> = (props) => {
    return (
        <IconBase {...props} whileHover="hover">
            <circle cx="12" cy="12" r="10" />
            <motion.polyline
                points="12 6 12 12 16 14"
                variants={{
                    hover: { rotate: 360 }
                }}
                transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                style={{ originX: '12px', originY: '12px' }}
            />
        </IconBase>
    );
};
