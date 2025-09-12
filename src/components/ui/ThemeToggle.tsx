// Theme Toggle Component with Liquid Glass Design
// Pink and neon green colors with smooth animations

import React from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  size = 'md', 
  showLabel = false 
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-12 h-6',
    md: 'w-16 h-8',
    lg: 'w-20 h-10'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
      
      <button
        onClick={toggleTheme}
        className={clsx(
          'relative rounded-full p-1 transition-all duration-300',
          'backdrop-blur-md border border-white/20',
          'shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]',
          // Light mode colors
          'bg-gradient-to-r from-pink-100/80 to-green-100/80',
          // Dark mode colors  
          'dark:bg-gradient-to-r dark:from-pink-900/40 dark:to-green-900/40',
          'hover:shadow-[0_8px_32px_0_rgba(255,0,128,0.4)]',
          'dark:hover:shadow-[0_8px_32px_0_rgba(0,255,0,0.4)]',
          sizeClasses[size]
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {/* Track */}
        <div className={clsx(
          'absolute inset-1 rounded-full transition-all duration-300',
          'bg-gradient-to-r',
          isDark 
            ? 'from-gray-800 to-gray-900' 
            : 'from-white/60 to-gray-50/60'
        )} />

        {/* Sliding indicator */}
        <motion.div
          layout
          className={clsx(
            'relative z-10 rounded-full transition-all duration-300',
            'bg-gradient-to-r shadow-lg',
            // Light mode indicator
            !isDark && 'from-[#ff0080] to-[#ff69b4] shadow-pink-300/50',
            // Dark mode indicator
            isDark && 'from-[#00ff00] to-[#39ff14] shadow-green-300/50',
            size === 'sm' && 'w-4 h-4',
            size === 'md' && 'w-6 h-6', 
            size === 'lg' && 'w-8 h-8'
          )}
          animate={{
            x: isDark 
              ? (size === 'sm' ? 24 : size === 'md' ? 32 : 40)
              : 0
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
        >
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={theme}
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? (
                <MoonIcon className={clsx(iconSizeClasses[size], 'text-gray-900')} />
              ) : (
                <SunIcon className={clsx(iconSizeClasses[size], 'text-white')} />
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Glow effect */}
        <div className={clsx(
          'absolute inset-0 rounded-full opacity-0 transition-opacity duration-300',
          'bg-gradient-to-r blur-md',
          'group-hover:opacity-30',
          isDark 
            ? 'from-[#00ff00] to-[#39ff14]'
            : 'from-[#ff0080] to-[#ff69b4]'
        )} />
      </button>

      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Theme
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;