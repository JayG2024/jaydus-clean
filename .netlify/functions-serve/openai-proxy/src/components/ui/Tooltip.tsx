import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  className?: string;
}

export const Tooltip = ({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 500,
  className,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  // Calculate position based on side and align
  const getPosition = () => {
    if (side === 'top') {
      return {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 },
        className: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2'
      };
    }
    if (side === 'bottom') {
      return {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        className: 'top-full mt-2 left-1/2 transform -translate-x-1/2'
      };
    }
    if (side === 'left') {
      return {
        initial: { opacity: 0, x: 10 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 10 },
        className: 'right-full mr-2 top-1/2 transform -translate-y-1/2'
      };
    }
    if (side === 'right') {
      return {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -10 },
        className: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
      };
    }
    return {};
  };

  const position = getPosition();
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={position.initial}
            animate={position.animate}
            exit={position.exit}
            transition={{ duration: 0.15 }}
            className={cn(
              "z-50 absolute whitespace-nowrap px-2 py-1 text-xs font-medium",
              "bg-gray-900 dark:bg-gray-800 text-white rounded pointer-events-none",
              "border border-gray-800 shadow-md",
              position.className,
              className
            )}
          >
            {content}
            <div className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};