import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import HelpView from '@/components/help/HelpView';

export default function ClientHelpScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={locale === 'ar' ? 'مركز المساعدة' : "Centre d'aide"} backButton={() => router.back()} tall />
      <HelpView />
    </View>
  );
}
