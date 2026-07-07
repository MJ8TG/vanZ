import { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { ShieldAlert } from 'lucide-react-native';
import { authApiFetch } from '@/lib/api';
import { useI18n } from '@/i18n';

interface SosButtonProps {
  jobId?: string | null;
  /** 'floating' = compact pill for map overlays; 'inline' = full-width row button. */
  variant?: 'floating' | 'inline';
  className?: string;
}

/**
 * Emergency SOS trigger. Posts the user's current GPS to /api/sos, which
 * (server-side, holding the edge secret) invokes the `sos-alert` edge function
 * to SMS + push the admin team. No direct functions.invoke from the client —
 * sos-alert is gated by verifyWebhookSecret.
 */
export default function SosButton({ jobId, variant = 'floating', className = '' }: SosButtonProps) {
  const { t, locale } = useI18n();
  const [sending, setSending] = useState(false);

  const fire = async () => {
    setSending(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Best-effort location — send the alert even if GPS is unavailable.
      let lat: number | null = null;
      let lng: number | null = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      const res = await authApiFetch('/api/sos', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId ?? null, lat, lng }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'sos_failed');
      }

      Alert.alert(t('sos.sentTitle'), t('sos.sentBody'));
    } catch (e) {
      Alert.alert(t('sos.confirmTitle'), t('sos.error'));
    } finally {
      setSending(false);
    }
  };

  const confirm = () => {
    Alert.alert(t('sos.confirmTitle'), t('sos.confirmBody'), [
      { text: t('sos.cancel'), style: 'cancel' },
      { text: t('sos.confirmCta'), style: 'destructive', onPress: fire },
    ]);
  };

  if (variant === 'inline') {
    return (
      <TouchableOpacity
        onPress={confirm}
        disabled={sending}
        accessibilityRole="button"
        accessibilityLabel={t('sos.button')}
        className={`h-12 rounded-2xl bg-danger/10 border border-danger/40 flex-row items-center justify-center gap-2 active:bg-danger/15 ${className}`}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#E5484D" />
        ) : (
          <>
            <ShieldAlert size={18} color="#E5484D" strokeWidth={2.4} />
            <Text className="text-danger font-black text-sm uppercase tracking-wide">{t('sos.button')}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={confirm}
      disabled={sending}
      accessibilityRole="button"
      accessibilityLabel={t('sos.button')}
      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-2xl bg-danger/15 border border-danger/50 active:bg-danger/25 ${className}`}
    >
      {sending ? (
        <ActivityIndicator size="small" color="#E5484D" />
      ) : (
        <>
          <ShieldAlert size={15} color="#E5484D" strokeWidth={2.4} />
          <Text className="text-danger font-black text-xs">{t('sos.button')}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
