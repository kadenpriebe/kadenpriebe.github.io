'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface StickerProps {
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  rotation?: number;
  className?: string;
}

export function Sticker({ 
  children, 
  initialX = 0, 
  initialY = 0, 
  rotation = 0,
  className = "" 
}: StickerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      drag
      dragConstraints={{ left: -20, right: 20, top: -20, bottom: 20 }}
      whileHover={{ scale: 1.1, rotate: rotation + 5 }}
      whileTap={{ scale: 0.9, rotate: rotation - 5 }}
      initial={{ x: initialX, y: initialY, rotate: rotation, opacity: 0 }}
      animate={{ opacity: 1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        absolute z-50 cursor-grab active:cursor-grabbing select-none
        p-2 bg-white rounded-lg shadow-sm border border-black/5
        flex items-center justify-center transition-shadow duration-200
        ${isHovered ? 'shadow-md' : ''}
        ${className}
      `}
    >
      <div className="text-xl">
        {children}
      </div>
    </motion.div>
  );
}
