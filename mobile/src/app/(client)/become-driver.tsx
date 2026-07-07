import { colors } from '@/theme/colors';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import GradientHeader from '@/components/ui/GradientHeader';
import DriverApplicationForm from '@/components/driver/DriverApplicationForm';
import { useDriverApplication } from '@/modules/driver/hooks/useDriverApplication';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Clock, CheckCircle, AlertTriangle, type LucideIcon } from 'lucide-react-native';

type AppStatus = 'pending' | 'approved' | 'rejected';

/**
 * Client "Devenir chauffeur" demande. A client can submit a driver application
 * here, but stays a client until an admin approves it (no driver access before
 * confirmation). If a demande already exists we show its status instead of the
 * form, so the client can't blindly re-submit.
 */
export default function BecomeDriverScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t } = useI18n();

  const { data, isLoading } = useDriverApplication(session?.user?.id);
  const [reapply, setReapply] = useState(false);

  const status = (data?.status as AppStatus) ?? null;
  const rejectionReason = data?.rejection_reason ?? null;

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
    );
  }

  // No demande yet, or re-applying after a rejection → show the application form.
  if (!status || (status === 'rejected' && reapply)) {
    return <DriverApplicationForm onDone={() => router.replace('/(client)')} />;
  }

  // Otherwise show the current demande status.
  const view: { Icon: LucideIcon; iconColor: string; tint: string; title: string; body: string } = {
    pending: {
      Icon: Clock,
      iconColor: colors.yellowDark,
      tint: 'bg-vanz-yellow/15',
      title: t('becomeDriver.pendingTitle'),
      body: t('becomeDriver.pendingBody'),
    },
    approved: {
      Icon: CheckCircle,
      iconColor: colors.green,
      tint: 'bg-vanz-green/15',
      title: t('becomeDriver.approvedTitle'),
      body: t('becomeDriver.approvedBody'),
    },
    rejected: {
      Icon: AlertTriangle,
      iconColor: '#EF4444',
      tint: 'bg-danger/15',
      title: t('becomeDriver.rejectedTitle'),
      body: rejectionReason || t('becomeDriver.rejectedBody'),
    },
  }[status];

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader
        title={t('client.becomeDriver')}
        backButton={() => router.back()}
        tall
      />
      <View className="flex-1 px-6 pt-10 items-center">
        <Animated.View entering={FadeInDown.springify()} className="w-full bg-surface-elevated rounded-3xl shadow-card border border-line p-7 items-center">
          <View className={`w-20 h-20 rounded-full ${view.tint} items-center justify-center mb-5`}>
            <view.Icon size={36} color={view.iconColor} strokeWidth={2.2} />
          </View>
          <Text className="text-content text-xl font-black text-center mb-2">{view.title}</Text>
          <Text className="text-content-secondary text-sm font-medium text-center leading-relaxed">{view.body}</Text>

          {status === 'rejected' && (
            <TouchableOpacity
              onPress={() => setReapply(true)}
              className="mt-7 w-full h-14 rounded-2xl bg-vanz-teal items-center justify-center active:opacity-90"
            >
              <Text className="text-white font-extrabold text-base">{t('becomeDriver.reapply')}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <TouchableOpacity onPress={() => router.back()} className="mt-6 py-3">
          <Text className="text-content-secondary font-bold">{t('becomeDriver.back')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
