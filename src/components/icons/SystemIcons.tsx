import React from 'react';
import { motion } from 'framer-motion';
import IconBase, { IconProps } from './IconBase';

export const SettingsIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            variants={{ hover: { rotate: 45 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ originX: '12px', originY: '12px' }}
        />
        <circle cx="12" cy="12" r="3" />
    </IconBase>
);

export const SunIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <circle cx="12" cy="12" r="4" />
        <motion.g
            variants={{ hover: { rotate: 45 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ originX: '12px', originY: '12px' }}
        >
            <path d="M12 2v2" /><path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" /><path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
        </motion.g>
    </IconBase>
);

export const MoonIcon: React.FC<IconProps> = (props) => (
    <IconBase {...props} whileHover="hover">
        <motion.path
            d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
            variants={{ hover: { rotate: -15 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ originX: '12px', originY: '12px' }}
        />
    </IconBase>
);
