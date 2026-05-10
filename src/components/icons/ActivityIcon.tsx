import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const ActivityIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.polyline
            points="22 12 18 12 15 21 9 3 6 12 2 12"
            variants={{
                hover: { pathLength: [0.8, 1], opacity: [0.7, 1] }
            }}
            transition={{ duration: 0.3, ease: "linear" }}
        />
    </IconBase>
);
