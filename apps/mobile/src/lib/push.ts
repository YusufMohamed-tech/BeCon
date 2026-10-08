import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests push permission, obtains the native device push token, and upserts
 * it into the `devices` table for the signed-in user. Safe to call on every
 * login / app start — the unique constraint on fcm_token makes it idempotent.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  // Push only works on physical devices.
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return;

  // Android requires a notification channel.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Native device token (FCM on Android, APNs on iOS) — matches our FCM sender.
  const tokenResponse = await Notifications.getDevicePushTokenAsync();
  const token = tokenResponse.data;
  if (!token) return;

  await supabase
    .from('devices')
    .upsert(
      {
        user_id: userId,
        fcm_token: token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'fcm_token' },
    );
}
