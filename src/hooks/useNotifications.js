import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useNotifications = () => {
  const { toast } = useToast();

  const { data: notifications, loading: loadingNotifications, refetch: refetchNotifications } = useRealtimeSubscription('notifications');
  const { data: alerts, loading: loadingAlerts, refetch: refetchAlerts } = useRealtimeSubscription('system_alerts');
  const { data: templates, loading: loadingTemplates, refetch: refetchTemplates } = useRealtimeSubscription('notification_templates');
  const { data: alertHistory, loading: loadingHistory, refetch: refetchHistory } = useRealtimeSubscription('alert_history');

  const genericAction = useCallback(async (action, successMessage) => {
    try {
      await action();
      if (successMessage) toast({ title: "Success", description: successMessage });
      return true;
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Operation failed", variant: "destructive" });
      return false;
    }
  }, [toast]);

  // Notifications
  const markAsRead = async (id) => genericAction(() => supabase.from('notifications').update({ status: 'read', read_at: new Date() }).eq('id', id), "Notification marked as read");
  const markAsUnread = async (id) => genericAction(() => supabase.from('notifications').update({ status: 'unread', read_at: null }).eq('id', id), "Notification marked as unread");
  const archiveNotification = async (id) => genericAction(() => supabase.from('notifications').update({ status: 'archived' }).eq('id', id), "Notification archived");
  const deleteNotification = async (id) => genericAction(() => supabase.from('notifications').delete().eq('id', id), "Notification deleted");
  const markAllAsRead = async () => genericAction(() => supabase.from('notifications').update({ status: 'read', read_at: new Date() }).neq('status', 'read'), "All notifications marked as read");
  const archiveAll = async () => genericAction(() => supabase.from('notifications').update({ status: 'archived' }).neq('status', 'archived'), "All notifications archived");

  // Alerts
  const acknowledgeAlert = async (id, userId) => {
    return genericAction(async () => {
      await supabase.from('system_alerts').update({ status: 'acknowledged' }).eq('id', id);
      await supabase.from('alert_history').insert({ alert_id: id, action: 'acknowledge', notes: `Acknowledged by user` });
    }, "Alert acknowledged");
  };
  
  const resolveAlert = async (id, notes) => {
    return genericAction(async () => {
      await supabase.from('system_alerts').update({ status: 'resolved', resolved_at: new Date() }).eq('id', id);
      await supabase.from('alert_history').insert({ alert_id: id, action: 'resolve', notes });
    }, "Alert resolved");
  };

  const deleteAlert = async (id) => genericAction(() => supabase.from('system_alerts').delete().eq('id', id), "Alert deleted");

  // Templates
  const createTemplate = async (data) => genericAction(() => supabase.from('notification_templates').insert([data]), "Template created");
  const updateTemplate = async (id, data) => genericAction(() => supabase.from('notification_templates').update(data).eq('id', id), "Template updated");
  const deleteTemplate = async (id) => genericAction(() => supabase.from('notification_templates').delete().eq('id', id), "Template deleted");
  
  // Renamed from useTemplate to applyTemplate to avoid React Hook linting error
  const applyTemplate = async (template, userId) => {
    // Logic to create notification from template would go here, simplified:
    const notification = {
      user_id: userId,
      title: template.name, // Or subject if email
      message: template.content, // Simplified variable replacement would happen here
      type: 'system',
      priority: 'medium',
      status: 'unread'
    };
    return genericAction(() => supabase.from('notifications').insert([notification]), "Notification created from template");
  };

  // Preferences
  const getPreferences = async (userId) => {
    try {
      // Use maybeSingle() instead of single() to handle no rows gracefully
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default preferences if none exist
        const defaultPrefs = {
          user_id: userId,
          email_enabled: true,
          sms_enabled: false,
          push_enabled: true,
          notification_types: { 
            order: true, 
            system: true,
            payment: true,
            delivery: true,
            review: true,
            feedback: true,
            inventory: true,
            marketing: true,
            user: true
          },
          quiet_hours_start: null,
          quiet_hours_end: null,
          notification_frequency: 'immediate'
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert([defaultPrefs])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default preferences:', insertError);
          // Return default object even if insert fails to prevent UI crash
          return defaultPrefs;
        }

        return newPrefs;
      }

      return data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive"
      });
      return null;
    }
  };
  
  const savePreferences = async (userId, prefs) => {
    return genericAction(async () => {
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('notification_preferences').update(prefs).eq('user_id', userId);
      } else {
        await supabase.from('notification_preferences').insert([{ ...prefs, user_id: userId }]);
      }
    }, "Preferences saved");
  };

  return {
    notifications, loadingNotifications, markAsRead, markAsUnread, archiveNotification, deleteNotification, markAllAsRead, archiveAll,
    alerts, loadingAlerts, acknowledgeAlert, resolveAlert, deleteAlert,
    templates, loadingTemplates, createTemplate, updateTemplate, deleteTemplate, applyTemplate,
    alertHistory, loadingHistory,
    getPreferences, savePreferences
  };
};