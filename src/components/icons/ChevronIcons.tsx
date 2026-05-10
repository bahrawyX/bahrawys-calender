import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.polyline
            points="15 18 9 12 15 6"
            variants={{ hover: { x: -2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
    </IconBase>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.polyline
            points="9 18 15 12 9 6"
            variants={{ hover: { x: 2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
    </IconBase>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.polyline
            points="6 9 12 15 18 9"
            variants={{ hover: { y: 2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
    </IconBase>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.polyline
            points="18 15 12 9 6 15"
            variants={{ hover: { y: -2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
    </IconBase>
);
