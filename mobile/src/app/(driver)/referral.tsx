import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import ReferralView from '@/components/referral/ReferralView';

export default function DriverReferralScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('profile.referral')} backButton={() => router.back()} tall />
      <ReferralView />
    </View>
  );
}
