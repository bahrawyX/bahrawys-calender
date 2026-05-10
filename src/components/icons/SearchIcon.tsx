import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const SearchIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <circle cx="11" cy="11" r="8" />
        <motion.line
            x1="21" y1="21" x2="16.65" y2="16.65"
            variants={{ hover: { x2: 15, y2: 15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
    </IconBase>
);
