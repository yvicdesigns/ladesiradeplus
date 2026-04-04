import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useMobileApp = () => {
  const { toast } = useToast();
  
  // Real-time subscriptions
  const { data: versions, loading: loadingVersions } = useRealtimeSubscription('mobile_app_versions');
  const { data: pushes, loading: loadingPushes } = useRealtimeSubscription('push_campaigns');
  const { data: templates, loading: loadingTemplates } = useRealtimeSubscription('notification_templates');
  const { data: devices, loading: loadingDevices } = useRealtimeSubscription('mobile_devices');
  const { data: alerts, loading: loadingCrashes } = useRealtimeSubscription('system_alerts');
  const { data: flags, loading: loadingFlags } = useRealtimeSubscription('feature_flags');
  const { data: analytics, loading: loadingAnalytics } = useRealtimeSubscription('mobile_analytics');

  // Filter alerts to only show crashes
  const crashes = alerts.filter(a => a.alert_type === 'crash');

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

  // Versions
  const createVersion = async (data) => genericAction(() => supabase.from('mobile_app_versions').insert([data]), "Version created");
  const updateVersion = async (id, data) => genericAction(() => supabase.from('mobile_app_versions').update({ ...data, updated_at: new Date() }).eq('id', id), "Version updated");
  const publishVersion = async (id) => updateVersion(id, { status: 'released' });
  const deprecateVersion = async (id) => updateVersion(id, { status: 'deprecated' });
  const deleteVersion = async (id) => genericAction(() => supabase.from('mobile_app_versions').delete().eq('id', id), "Version deleted");

  // Push Campaigns
  const createPush = async (data) => genericAction(() => supabase.from('push_campaigns').insert([data]), "Push campaign created");
  const updatePush = async (id, data) => genericAction(() => supabase.from('push_campaigns').update({ ...data, updated_at: new Date() }).eq('id', id), "Push campaign updated");
  const sendPush = async (id) => updatePush(id, { status: 'sent', sent_date: new Date(), sent_count: Math.floor(Math.random() * 1000) + 50 }); // Mock sending logic
  const schedulePush = async (id, date) => updatePush(id, { status: 'scheduled', scheduled_date: date });
  const duplicatePush = async (push) => {
    const { id, created_at, updated_at, sent_date, sent_count, open_count, click_count, ...rest } = push;
    return createPush({ ...rest, title: `${rest.title} (Copy)`, status: 'draft' });
  };
  const deletePush = async (id) => genericAction(() => supabase.from('push_campaigns').delete().eq('id', id), "Push campaign deleted");

  // Devices
  const updateDeviceStatus = async (id, isActive) => genericAction(() => supabase.from('mobile_devices').update({ is_active: isActive, updated_at: new Date() }).eq('id', id), `Device ${isActive ? 'enabled' : 'disabled'}`);
  const sendTestPush = async (deviceId) => genericAction(async () => {
    // Mock sending test push
    await new Promise(resolve => setTimeout(resolve, 500));
  }, "Test push sent successfully");
  const deleteDevice = async (id) => genericAction(() => supabase.from('mobile_devices').delete().eq('id', id), "Device deleted");

  // Crashes (System Alerts)
  const acknowledgeCrash = async (id) => genericAction(() => supabase.from('system_alerts').update({ status: 'acknowledged', updated_at: new Date() }).eq('id', id), "Crash acknowledged");
  const markCrashFixed = async (id) => genericAction(() => supabase.from('system_alerts').update({ status: 'resolved', resolved_at: new Date(), updated_at: new Date() }).eq('id', id), "Crash marked as fixed");
  const deleteCrash = async (id) => genericAction(() => supabase.from('system_alerts').delete().eq('id', id), "Crash record deleted");

  // Feature Flags
  const createFeatureFlag = async (data) => genericAction(() => supabase.from('feature_flags').insert([data]), "Feature flag created");
  const updateFeatureFlag = async (id, data) => genericAction(() => supabase.from('feature_flags').update({ ...data, updated_at: new Date() }).eq('id', id), "Feature flag updated");
  const deleteFeatureFlag = async (id) => genericAction(() => supabase.from('feature_flags').delete().eq('id', id), "Feature flag deleted");

  // Push Templates (Notification Templates)
  // Mapping: name->name, title->subject, message->content
  const createPushTemplate = async (data) => {
    const mappedData = {
        name: data.name,
        subject: data.title,
        content: data.message,
        variables: {}
    };
    return genericAction(() => supabase.from('notification_templates').insert([mappedData]), "Template created");
  };
  
  const updatePushTemplate = async (id, data) => {
    const mappedData = {
        ...(data.name && { name: data.name }),
        ...(data.title && { subject: data.title }),
        ...(data.message && { content: data.message }),
        updated_at: new Date()
    };
    return genericAction(() => supabase.from('notification_templates').update(mappedData).eq('id', id), "Template updated");
  };
  
  const deletePushTemplate = async (id) => genericAction(() => supabase.from('notification_templates').delete().eq('id', id), "Template deleted");

  return {
    versions, loadingVersions, createVersion, updateVersion, publishVersion, deprecateVersion, deleteVersion,
    pushes, loadingPushes, createPush, updatePush, sendPush, schedulePush, duplicatePush, deletePush,
    templates, loadingTemplates, createPushTemplate, updatePushTemplate, deletePushTemplate,
    devices, loadingDevices, updateDeviceStatus, sendTestPush, deleteDevice,
    crashes, loadingCrashes, acknowledgeCrash, markCrashFixed, deleteCrash,
    flags, loadingFlags, createFeatureFlag, updateFeatureFlag, deleteFeatureFlag,
    analytics, loadingAnalytics
  };
};