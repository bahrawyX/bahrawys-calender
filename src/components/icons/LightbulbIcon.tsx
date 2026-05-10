import React from 'react';
import IconBase, { IconProps } from './IconBase';

export const LightbulbIcon: React.FC<IconProps> = (props) => {
    return (
        <IconBase {...props}>
            <path
                d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7 3H9l-.7-3A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </IconBase>
    );
};
