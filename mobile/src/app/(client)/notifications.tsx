import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import NotificationsView from '@/components/notifications/NotificationsView';

export default function ClientNotificationsScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader
        title={t('profile.notifications')}
        backButton={() => router.back()}
        tall
      />
      <NotificationsView
        resolveHref={(n) =>
          n.data?.conversation_id
            ? `/(client)/chat/${n.data.conversation_id}`
            : n.data?.job_id
              ? `/(client)/job/${n.data.job_id}`
              : null
        }
      />
    </View>
  );
}
