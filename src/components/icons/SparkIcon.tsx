import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const SparkIcon: React.FC<IconProps> = (props) => {
    return (
        <IconBase {...props} whileHover="hover">
            <motion.path
                d="M12 2c0 5 3 9 9 9-6 0-9 4-9 9 0-5-3-9-9-9 6 0 9-4 9-9z"
                fill="currentColor"
                stroke="none"
                variants={{
                    hover: { scale: 1.15, rotate: 180 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ originX: '12px', originY: '12px' }}
            />
            <motion.path
                d="M5.5 3.5c0 2 1 3.5 3.5 3.5-2.5 0-3.5 1.5-3.5 3.5 0-2-1-3.5-3.5-3.5 2.5 0 3.5-1.5 3.5-3.5z"
                fill="currentColor"
                stroke="none"
                variants={{
                    hover: { scale: 1.3, rotate: -90, x: -1, y: 1 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                style={{ originX: '5.5px', originY: '7px' }}
            />
        </IconBase>
    );
};
