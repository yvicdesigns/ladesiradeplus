import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/customSupabaseClient';

const isNative = () => Capacitor.isNativePlatform();

export const initPushNotifications = async (userId) => {
  if (!isNative() || !userId) return;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    await supabase
      .from('push_tokens')
      .upsert({ user_id: userId, token: token.value, platform: Capacitor.getPlatform() }, { onConflict: 'user_id' });
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Received foreground:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push] Action performed:', action);
  });
};

export const removePushToken = async (userId) => {
  if (!userId) return;
  await supabase.from('push_tokens').delete().eq('user_id', userId);
};
