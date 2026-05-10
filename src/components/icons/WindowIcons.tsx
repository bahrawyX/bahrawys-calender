import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const MaximizeIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.polyline points="15 3 21 3 21 9" variants={{ hover: { x: 2, y: -2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
        <motion.polyline points="9 21 3 21 3 15" variants={{ hover: { x: -2, y: 2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
        <motion.line x1="21" y1="3" x2="14" y2="10" variants={{ hover: { x: 2, y: -2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
        <motion.line x1="3" y1="21" x2="10" y2="14" variants={{ hover: { x: -2, y: 2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
    </IconBase>
);

export const MinimizeIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.polyline points="4 14 10 14 10 20" variants={{ hover: { x: 2, y: -2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
        <motion.polyline points="20 10 14 10 14 4" variants={{ hover: { x: -2, y: 2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
        <motion.line x1="14" y1="10" x2="21" y2="3" variants={{ hover: { x: -2, y: 2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
        <motion.line x1="3" y1="21" x2="10" y2="14" variants={{ hover: { x: 2, y: -2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }} />
    </IconBase>
);
