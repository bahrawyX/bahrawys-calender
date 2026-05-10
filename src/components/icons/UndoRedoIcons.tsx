import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const UndoIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <path d="M3 7v6h6" />
        <motion.path
            d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"
            variants={{
                hover: { rotate: -15 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ originX: '12px', originY: '14px' }}
        />
    </IconBase>
);

export const RedoIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <path d="M21 7v6h-6" />
        <motion.path
            d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"
            variants={{
                hover: { rotate: 15 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ originX: '12px', originY: '14px' }}
        />
    </IconBase>
);
