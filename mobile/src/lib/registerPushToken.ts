import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { datasql } from './supabase';

/**
 * Acquire this device's Expo push token and store it in `push_tokens` for the
 * signed-in user, so the backend (sendPushNotification) can reach them.
 * Safe to call repeatedly — it upserts on (user_id, token). No-ops on
 * simulators/emulators (which can't receive a real push token).
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    // Android 13+ requires a channel to exist before the permission prompt
    // appears and before a token can be fetched.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#38B6FF',
      });
    }

    if (!Device.isDevice) return; // push tokens are only issued to physical devices

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as unknown as { easConfig?: { projectId?: string } })?.easConfig?.projectId;
    if (!projectId) return;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (!token) return;

    await datasql
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform: Platform.OS, is_active: true },
        { onConflict: 'user_id,token' }
      );
  } catch (e) {
    console.error('registerPushToken failed:', e);
  }
}
