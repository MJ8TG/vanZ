import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import HelpView from '@/components/help/HelpView';

export default function ClientHelpScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('settings.helpCenter')} backButton={() => router.back()} tall />
      <HelpView />
    </View>
  );
}
