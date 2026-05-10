import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const CloseIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </IconBase>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.line x1="12" y1="5" x2="12" y2="19" />
        <motion.line x1="5" y1="12" x2="19" y2="12" />
        <motion.circle cx="12" cy="12" r="9" stroke="transparent" variants={{ hover: { stroke: "currentColor", opacity: 0.3 } }} transition={{ duration: 0.2 }} />
        <motion.g variants={{ hover: { rotate: 90 } }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ originX: '12px', originY: '12px' }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </motion.g>
    </IconBase>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <motion.line x1="10" y1="11" x2="10" y2="17" variants={{ hover: { y: -2, opacity: 0 } }} transition={{ duration: 0.2 }} />
        <motion.line x1="14" y1="11" x2="14" y2="17" variants={{ hover: { y: -2, opacity: 0 } }} transition={{ duration: 0.2, delay: 0.05 }} />
    </IconBase>
);
