import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNewOrderNotificationBadge } from '@/hooks/useNewOrderNotificationBadge';
import { useNavigate } from 'react-router-dom';

export const NewOrderBadge = ({ className }) => {
  const { badgeCount, resetBadge } = useNewOrderNotificationBadge();
  const navigate = useNavigate();

  const handleClick = () => {
    resetBadge();
    navigate('/admin/orders'); // Or default to general orders page
  };

  if (badgeCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg border border-red-400 cursor-pointer hover:bg-red-700 transition-colors ${className}`}
        title="Click to view new orders"
      >
        <div className="relative flex items-center justify-center">
          <span className="relative z-10 block h-2 w-2 rounded-full bg-white"></span>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
        </div>
        
        <span className="text-xs font-bold whitespace-nowrap">
          {badgeCount} new order{badgeCount > 1 ? 's' : ''}
        </span>
      </motion.button>
    </AnimatePresence>
  );
};