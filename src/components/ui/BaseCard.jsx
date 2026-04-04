import React from 'react';
import { cn } from '@/lib/utils';

/**
 * BaseCard Component
 * A foundational layout component for displaying content blocks.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} props.className
 * @param {boolean} props.noPadding
 */
export const BaseCard = ({ children, className, noPadding = false, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
        !noPadding && "p-4 sm:p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};