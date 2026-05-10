import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const EditIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
        <motion.path
            d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
            variants={{ hover: { pathLength: [0, 1] } }}
            transition={{ duration: 0.3 }}
            strokeDasharray="0 1"
        />
    </IconBase>
);
