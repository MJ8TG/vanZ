import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import SettingsView from '@/components/settings/SettingsView';

export default function ClientSettingsScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('settings.title')} backButton={() => router.back()} tall />
      <SettingsView helpHref="/(client)/help" />
    </View>
  );
}
