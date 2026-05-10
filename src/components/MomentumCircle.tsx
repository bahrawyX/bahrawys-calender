'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MomentumCircleProps {
  score: number;
  size?: number;
}

const MomentumCircle: React.FC<MomentumCircleProps> = ({ score, size = 64 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2.5"
          fill="transparent"
          className="text-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="text-primary"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        <span className="text-[10px] font-black text-foreground leading-none">{score}</span>
        <div className="w-1 h-1 bg-primary rounded-full mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

export default MomentumCircle;
