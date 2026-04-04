import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Bell, ShoppingBag, Calendar, CheckCircle, Clock } from 'lucide-react';
import { formatTime } from '@/lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';

const FeedItem = ({ event }) => {
  const getIconConfig = () => {
    switch (event.type) {
      case 'order': return { icon: ShoppingBag, bg: 'bg-primary/10', text: 'text-primary' };
      case 'reservation': return { icon: Calendar, bg: 'bg-accent/20', text: 'text-primary' };
      case 'status': return { icon: CheckCircle, bg: 'bg-status-success/10', text: 'text-status-success' };
      default: return { icon: Bell, bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  const { icon: Icon, bg, text } = getIconConfig();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="group flex items-start gap-4 p-4 mb-3 bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-primary/50 transition-all duration-200"
    >
      <div className={`p-2.5 rounded-lg ${bg} ${text} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
          {event.message}
        </p>
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-1.5">
          <Clock className="h-3 w-3" />
          {formatTime(event.timestamp)}
        </span>
      </div>
    </motion.div>
  );
};

export const LiveFeed = () => {
  const [events, setEvents] = useState([]);
  const scrollRef = useRef(null);

  const addEvent = (event) => {
    setEvents(prev => [event, ...prev].slice(0, 20));
  };

  useEffect(() => {
    if (events.length === 0) {
      setEvents([
        { id: 'init1', type: 'info', message: 'System online. Monitoring activities...', timestamp: new Date().toISOString() }
      ]);
    }

    const orderChannel = supabase.channel('live_feed_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        addEvent({
          id: payload.new.id,
          type: 'order',
          message: `New Order #${payload.new.id.slice(0, 6)} received ($${payload.new.total_amount})`,
          timestamp: new Date().toISOString()
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.new.status !== payload.old.status) {
          addEvent({
            id: payload.new.id + payload.new.status,
            type: 'status',
            message: `Order #${payload.new.id.slice(0, 6)} updated to ${payload.new.status}`,
            timestamp: new Date().toISOString()
          });
        }
      })
      .subscribe();

    const reservationChannel = supabase.channel('live_feed_reservations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload) => {
        addEvent({
          id: payload.new.id,
          type: 'reservation',
          message: `New Reservation for ${payload.new.party_size} people`,
          timestamp: new Date().toISOString()
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(reservationChannel);
    };
  }, []);

  return (
    <div className="bg-muted/30 rounded-2xl p-4 h-full flex flex-col border border-border shadow-inner">
      <div className="flex items-center justify-between mb-5 px-1">
        <h3 className="font-bold text-foreground flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-status-success"></span>
          </span>
          Live Activity Feed
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <FeedItem key={event.id} event={event} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};