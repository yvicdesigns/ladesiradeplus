import { useMemo } from 'react';
import { useMobileApp } from './useMobileApp';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, isSameDay } from 'date-fns';

export const useMobileAppAnalytics = () => {
  const { analytics, devices, pushes, crashes } = useMobileApp();

  const stats = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    const safeAnalytics = analytics || [];
    const safeDevices = devices || [];
    const safePushes = pushes || [];
    const safeCrashes = crashes || [];

    // Active Users Today
    const analyticsToday = safeAnalytics.find(a => isSameDay(parseISO(a.date), today));
    const activeUsersToday = analyticsToday ? analyticsToday.active_users : safeDevices.filter(d => d.last_active && isSameDay(parseISO(d.last_active), today)).length;

    // Monthly aggregates
    const thisMonthAnalytics = safeAnalytics.filter(a => isWithinInterval(parseISO(a.date), { start: monthStart, end: monthEnd }));
    
    const activeUsersThisMonth = thisMonthAnalytics.reduce((acc, curr) => acc + (curr.active_users || 0), 0);
    const newUsersThisMonth = thisMonthAnalytics.reduce((acc, curr) => acc + (curr.new_users || 0), 0);
    const sessionsThisMonth = thisMonthAnalytics.reduce((acc, curr) => acc + (curr.sessions || 0), 0);
    
    const crashesThisMonth = safeCrashes.filter(c => isWithinInterval(parseISO(c.created_at), { start: monthStart, end: monthEnd })).length;
    
    const registeredDevices = safeDevices.length;
    
    const pushesThisMonth = safePushes.filter(p => p.status === 'sent' && p.sent_date && isWithinInterval(parseISO(p.sent_date), { start: monthStart, end: monthEnd }));
    const pushNotificationsSentThisMonth = pushesThisMonth.length;
    
    // Average Open Rate
    const sentPushes = safePushes.filter(p => p.status === 'sent' && p.sent_count > 0);
    const averageOpenRate = sentPushes.length > 0 
      ? (sentPushes.reduce((acc, p) => acc + ((p.open_count / p.sent_count) * 100), 0) / sentPushes.length).toFixed(1)
      : 0;

    return {
      activeUsersToday,
      activeUsersThisMonth,
      newUsersThisMonth,
      sessionsThisMonth,
      crashesThisMonth,
      registeredDevices,
      pushNotificationsSentThisMonth,
      averageOpenRate
    };
  }, [analytics, devices, pushes, crashes]);

  return stats;
};