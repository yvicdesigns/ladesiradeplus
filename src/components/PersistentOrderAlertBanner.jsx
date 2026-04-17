import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const PersistentOrderAlertBanner = ({ pendingOrders = [], onAcknowledgeAll }) => {
  const navigate = useNavigate();
  const [secondsUntilNext, setSecondsUntilNext] = useState(30);
  const count = pendingOrders.length;

  // Compte à rebours jusqu'à la prochaine sonnerie
  useEffect(() => {
    if (count === 0) return;
    setSecondsUntilNext(30);
    const timer = setInterval(() => {
      setSecondsUntilNext(prev => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [count, pendingOrders]);

  const handleView = () => {
    onAcknowledgeAll();
    navigate('/admin/delivery-orders');
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden flex-shrink-0"
        >
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
            {/* Icône + message */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{ rotate: [0, -20, 20, -15, 15, -8, 8, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Bell className="h-6 w-6 text-white" fill="white" />
                </motion.div>
                {/* Point rouge pulsant */}
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-300" />
                </span>
              </div>

              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">
                  {count === 1
                    ? '1 nouvelle commande en attente !'
                    : `${count} nouvelles commandes en attente !`}
                </p>
                <p className="text-xs text-white/80 mt-0.5">
                  Prochaine alerte dans{' '}
                  <span className="font-mono font-bold text-yellow-200">{secondsUntilNext}s</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={handleView}
                className="bg-white text-red-600 hover:bg-yellow-50 hover:text-red-700 font-bold gap-1.5 shadow-sm border-0"
              >
                Voir les commandes
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={onAcknowledgeAll}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                title="Ignorer l'alerte"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
