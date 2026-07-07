import { colors } from '@/theme/colors';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import type { MobileJob } from '@/types/domain';
import { DriverService } from '@/modules/driver/services/driverService';
import GradientHeader from '@/components/ui/GradientHeader';
import Row from '@/components/ui/Row';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp, Banknote } from 'lucide-react-native';

type EarningJob = MobileJob & {
  accepted_bid_amount: number | string | null;
  commission_amount: number | string | null;
  driver_payout: number | string | null;
};

export default function DriverEarningsScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';

  const [jobs, setJobs] = useState<EarningJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const data = await DriverService.fetchDriverTrips(session.user.id, ['completed']);
      setJobs((data || []) as EarningJob[]);
    } catch (e) {
      console.error('Failed to fetch earnings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const payoutOf = (j: EarningJob) => {
    if (j.driver_payout != null) return Number(j.driver_payout);
    const gross = Number(j.accepted_bid_amount || 0);
    const commission = Number(j.commission_amount || 0);
    return Math.max(0, gross - commission);
  };

  const totalPayout = jobs.reduce((s, j) => s + payoutOf(j), 0);
  const totalCommission = jobs.reduce((s, j) => s + Number(j.commission_amount || 0), 0);

  const header = (
    <View>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient colors={[colors.navy, colors.navyLight, colors.navyMid]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-[28px] p-7 mb-4">
          <View className="absolute right-4 top-4 opacity-10"><TrendingUp size={84} color={colors.white} strokeWidth={1.5} /></View>
          <Text className="text-vanz-green font-bold text-xs uppercase tracking-[2px] mb-3">{t('earnings.totalTitle')}</Text>
          <Row className="items-end mb-1">
            <Text className="text-white font-black text-5xl">{totalPayout.toFixed(2)}</Text>
            <Text className="text-white/70 font-extrabold text-xl mb-1.5 ml-2 mr-2">{t('common.currency')}</Text>
          </Row>
          <Text className="text-white/50 font-medium text-xs mt-1">
            {jobs.length} {t(jobs.length > 1 ? 'earnings.completedPlural' : 'earnings.completedSingular')}
            {' · '}{t('earnings.commission')} {totalCommission.toFixed(2)} {t('common.currency')}
          </Text>
        </LinearGradient>
      </Animated.View>

      <Text className={`text-content text-lg font-black mb-3 ${isRtl ? 'text-right' : ''}`}>
        {t('earnings.detailTitle')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-surface">
        <GradientHeader title={t('profile.myEarnings')} backButton={() => router.back()} tall />
        <View className="px-5 pt-5"><ShimmerCard /><ShimmerCard /></View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('profile.myEarnings')} backButton={() => router.back()} tall />
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEarnings(); }} tintColor={colors.teal} />}
        renderItem={({ item, index }) => {
          const gross = Number(item.accepted_bid_amount || 0);
          const commission = Number(item.commission_amount || 0);
          const payout = payoutOf(item);
          const title = item.service_type === 'parcel' ? t('common.parcel') : (item.service_type || 'Mission');
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).springify()}>
              <View className="bg-surface-elevated rounded-2xl p-4 mb-3 border border-line shadow-card">
                <Row className="justify-between items-center mb-3">
                  <Text className={`text-content font-extrabold text-base flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>{title}</Text>
                  <Text className="text-vanz-green font-black text-lg">+{payout.toFixed(2)} {t('common.currency')}</Text>
                </Row>
                <Row className="justify-between pt-2 border-t border-line">
                  <Text className="text-content-secondary font-semibold text-xs">{t('earnings.gross')}: {gross.toFixed(2)}</Text>
                  <Text className="text-danger font-semibold text-xs">- {t('earnings.commission')} {commission.toFixed(2)}</Text>
                </Row>
                <Text className={`text-content-muted font-bold text-[11px] mt-2 ${isRtl ? 'text-right' : ''}`}>
                  {new Date(item.created_at || new Date().toISOString()).toLocaleDateString(isRtl ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={() => (
          <Animated.View entering={FadeInDown} className="items-center justify-center py-16">
            <View className="w-24 h-24 bg-surface-elevated rounded-full items-center justify-center shadow-card mb-5">
              <Banknote size={40} color={colors.slate} strokeWidth={1.8} />
            </View>
            <Text className="text-content-muted text-center text-sm font-semibold px-10">
              {t('earnings.empty')}
            </Text>
          </Animated.View>
        )}
      />
    </View>
  );
}
