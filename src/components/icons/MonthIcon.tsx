import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const MonthIcon: React.FC<IconProps> = (props) => {
    const itemVariants = {
        hover: { scale: 1.1, opacity: 1 },
    };

    return (
        <IconBase {...props} whileHover="hover">
            <motion.rect x="3" y="3" width="7" height="7" rx="1" variants={itemVariants} transition={{ duration: 0.15 }} />
            <motion.rect x="14" y="3" width="7" height="7" rx="1" variants={itemVariants} transition={{ duration: 0.15, delay: 0.03 }} />
            <motion.rect x="14" y="14" width="7" height="7" rx="1" variants={itemVariants} transition={{ duration: 0.15, delay: 0.06 }} />
            <motion.rect x="3" y="14" width="7" height="7" rx="1" variants={itemVariants} transition={{ duration: 0.15, delay: 0.09 }} />
        </IconBase>
    );
};
