import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ArrowRight, CalendarClock, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const REPEAT_INTERVAL_SECONDS = 30;

const DeliveryBanner = ({ count, secondsUntilNext, onView, onDismiss }) => (
  <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative flex-shrink-0">
        <motion.div
          animate={{ rotate: [0, -20, 20, -15, 15, -8, 8, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
        >
          <Bell className="h-6 w-6 text-white" fill="white" />
        </motion.div>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-300" />
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm leading-tight">
          {count === 1 ? '1 nouvelle commande en attente !' : `${count} nouvelles commandes en attente !`}
        </p>
        <p className="text-xs text-white/80 mt-0.5">
          Prochaine alerte dans{' '}
          <span className="font-mono font-bold text-yellow-200">{secondsUntilNext}s</span>
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <Button size="sm" onClick={onView} className="bg-white text-red-600 hover:bg-yellow-50 hover:text-red-700 font-bold gap-1.5 shadow-sm border-0">
        Voir les commandes
        <ArrowRight className="h-4 w-4" />
      </Button>
      <button onClick={onDismiss} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="Ignorer l'alerte">
        <X className="h-5 w-5 text-white" />
      </button>
    </div>
  </div>
);

const ReservationBanner = ({ count, secondsUntilNext, onView, onDismiss }) => (
  <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative flex-shrink-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <CalendarClock className="h-6 w-6 text-white" />
        </motion.div>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-300" />
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm leading-tight">
          {count === 1 ? '1 nouvelle réservation en attente !' : `${count} nouvelles réservations en attente !`}
        </p>
        <p className="text-xs text-white/80 mt-0.5">
          Prochaine alerte dans{' '}
          <span className="font-mono font-bold text-yellow-200">{secondsUntilNext}s</span>
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <Button size="sm" onClick={onView} className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold gap-1.5 shadow-sm border-0">
        Voir les réservations
        <ArrowRight className="h-4 w-4" />
      </Button>
      <button onClick={onDismiss} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="Ignorer l'alerte">
        <X className="h-5 w-5 text-white" />
      </button>
    </div>
  </div>
);

export const PersistentOrderAlertBanner = ({ pendingOrders = [], onAcknowledgeAll }) => {
  const navigate = useNavigate();
  const [secondsUntilNext, setSecondsUntilNext] = useState(REPEAT_INTERVAL_SECONDS);
  const count = pendingOrders.length;

  useEffect(() => {
    if (count === 0) return;
    setSecondsUntilNext(REPEAT_INTERVAL_SECONDS);
    const timer = setInterval(() => {
      setSecondsUntilNext(prev => (prev <= 1 ? REPEAT_INTERVAL_SECONDS : prev - 1));
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
          <DeliveryBanner
            count={count}
            secondsUntilNext={secondsUntilNext}
            onView={handleView}
            onDismiss={onAcknowledgeAll}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const PersistentRestaurantOrderAlertBanner = ({ pendingOrders = [], onAcknowledgeAll }) => {
  const navigate = useNavigate();
  const [secondsUntilNext, setSecondsUntilNext] = useState(REPEAT_INTERVAL_SECONDS);
  const count = pendingOrders.length;

  useEffect(() => {
    if (count === 0) return;
    setSecondsUntilNext(REPEAT_INTERVAL_SECONDS);
    const timer = setInterval(() => {
      setSecondsUntilNext(prev => (prev <= 1 ? REPEAT_INTERVAL_SECONDS : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [count, pendingOrders]);

  const handleView = () => {
    onAcknowledgeAll();
    navigate('/admin/restaurant-orders');
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
          <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 2.5 }}
                >
                  <Utensils className="h-6 w-6 text-white" />
                </motion.div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-300" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">
                  {count === 1 ? '1 nouvelle commande en salle !' : `${count} nouvelles commandes en salle !`}
                </p>
                <p className="text-xs text-white/80 mt-0.5">
                  Prochaine alerte dans{' '}
                  <span className="font-mono font-bold text-yellow-200">{secondsUntilNext}s</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" onClick={handleView} className="bg-white text-green-600 hover:bg-green-50 hover:text-green-700 font-bold gap-1.5 shadow-sm border-0">
                Voir les commandes
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button onClick={onAcknowledgeAll} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="Ignorer l'alerte">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const PersistentReservationAlertBanner = ({ pendingReservations = [], onAcknowledgeAll }) => {
  const navigate = useNavigate();
  const [secondsUntilNext, setSecondsUntilNext] = useState(REPEAT_INTERVAL_SECONDS);
  const count = pendingReservations.length;

  useEffect(() => {
    if (count === 0) return;
    setSecondsUntilNext(REPEAT_INTERVAL_SECONDS);
    const timer = setInterval(() => {
      setSecondsUntilNext(prev => (prev <= 1 ? REPEAT_INTERVAL_SECONDS : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [count, pendingReservations]);

  const handleView = () => {
    onAcknowledgeAll();
    navigate('/admin/reservations');
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
          <ReservationBanner
            count={count}
            secondsUntilNext={secondsUntilNext}
            onView={handleView}
            onDismiss={onAcknowledgeAll}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
