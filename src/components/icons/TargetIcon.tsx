import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const TargetIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <circle cx="12" cy="12" r="10" />
        <motion.circle
            cx="12" cy="12" r="6"
            variants={{ hover: { scale: 0.8 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
        <motion.circle
            cx="12" cy="12" r="2"
            variants={{ hover: { scale: 1.5 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
    </IconBase>
);
