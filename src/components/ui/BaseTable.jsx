import React from 'react';
import { cn } from '@/lib/utils';

/**
 * BaseTable Component
 * Standardized responsive table wrapper.
 */
export const BaseTable = ({ children, className, containerClassName }) => {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-gray-200", containerClassName)}>
      <table className={cn("w-full text-sm text-left text-gray-500", className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className }) => (
  <thead className={cn("text-xs text-gray-700 uppercase bg-gray-50", className)}>
    {children}
  </thead>
);

export const TableRow = ({ children, className, onClick }) => (
  <tr 
    onClick={onClick}
    className={cn(
      "bg-white border-b hover:bg-gray-50 transition-colors", 
      onClick && "cursor-pointer",
      className
    )}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className, isHeader = false }) => {
  const Component = isHeader ? 'th' : 'td';
  return (
    <Component className={cn("px-6 py-4", isHeader && "font-medium", className)}>
      {children}
    </Component>
  );
};