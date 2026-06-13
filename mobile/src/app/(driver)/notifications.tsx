import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import NotificationsView from '@/components/notifications/NotificationsView';

export default function DriverNotificationsScreen() {
  const router = useRouter();
  const { locale } = useI18n();

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader
        title={locale === 'ar' ? 'الإشعارات' : 'Notifications'}
        backButton={() => router.back()}
        tall
      />
      <NotificationsView
        resolveHref={(n) =>
          n.data?.conversation_id
            ? `/(driver)/chat/${n.data.conversation_id}`
            : n.data?.job_id
              ? `/(driver)/bid/${n.data.job_id}`
              : null
        }
      />
    </View>
  );
}
