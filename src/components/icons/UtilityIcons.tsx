import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const CheckIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.polyline
            points="20 6 9 17 4 12"
            variants={{
                hover: { pathLength: [0, 1], opacity: [0, 1] }
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        />
    </IconBase>
);

export const VideoIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        <motion.rect
            x="1" y="5" width="15" height="14" rx="2" ry="2"
            variants={{ hover: { scale: 1.05 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ originX: '8.5px', originY: '12px' }}
        />
    </IconBase>
);

export const ExternalLinkIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <motion.polyline
            points="15 3 21 3 21 9"
            variants={{ hover: { x: 1, y: -1 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
        <motion.line
            x1="10" y1="14" x2="21" y2="3"
            variants={{ hover: { x: 1, y: -1 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
    </IconBase>
);
