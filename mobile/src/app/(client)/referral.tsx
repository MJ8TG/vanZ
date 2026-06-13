import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import ReferralView from '@/components/referral/ReferralView';

export default function ClientReferralScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={locale === 'ar' ? 'الإحالة' : 'Parrainage'} backButton={() => router.back()} tall />
      <ReferralView />
    </View>
  );
}
