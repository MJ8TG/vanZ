import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import SettingsView from '@/components/settings/SettingsView';

export default function DriverSettingsScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={locale === 'ar' ? 'الإعدادات' : 'Paramètres'} backButton={() => router.back()} tall />
      <SettingsView helpHref="/(driver)/help" />
    </View>
  );
}
