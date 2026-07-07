import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { serviceLabel } from '@/lib/serviceLabel';
import type { MobileJob } from '@/types/domain';
import { colors } from '@/theme/colors';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import Row from '@/components/ui/Row';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import { MapPin, Flag } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMissions } from '@/modules/booking/hooks/useMissions';
import { useRealtimeSync } from '@/modules/booking/hooks/useRealtimeSync';

type ClientMissionJob = MobileJob & { bids?: Array<{ amount: number | string }> };

export default function ClientMissionsScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const { data: jobs = [], isLoading, refetch } = useMissions(session?.user?.id, tab);

  // Enable automatic query cache invalidation on realtime changes
  useRealtimeSync(session?.user?.id);

  // Refetch when the screen comes back into focus
  useFocusEffect(useCallback(() => {
    refetch();
  }, [tab, refetch]));

  const getStatusBadge = (status: string) => {

    const badges: Record<string, { bg: string; text: string; label: string }> = {
      open: { bg: 'bg-vanz-teal/10', text: 'text-vanz-teal', label: t('jobDetails.statusOpen') },
      payment_pending: { bg: 'bg-vanz-yellow/10', text: 'text-vanz-yellow-dark', label: t('jobDetails.stepPayment') },
      matched: { bg: 'bg-blue-50', text: 'text-blue-600', label: t('jobDetails.statusMatched') },
      in_progress: { bg: 'bg-vanz-green/10', text: 'text-vanz-green', label: t('jobDetails.statusInProgress') },
      completed: { bg: 'bg-green-50', text: 'text-green-600', label: t('jobDetails.statusCompleted') },
      cancelled: { bg: 'bg-surface-sunken', text: 'text-content-muted', label: t('jobDetails.statusCancelled') },
      expired: { bg: 'bg-red-50', text: 'text-red-500', label: t('jobDetails.statusExpired') },
    };
    return badges[status] || badges.open;
  };

  const renderJob = ({ item, index }: { item: ClientMissionJob, index: number }) => {
    const badge = getStatusBadge(item.status);
    const bids = item.bids ?? [];
    const hasBids = bids.length > 0;
    
    let minBid = 0;
    if (hasBids) {
      minBid = Math.min(...bids.map((b) => Number(b.amount || 0)));
    }

    const title = serviceLabel(item.service_type, t);

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <PressableCard 
          onPress={() => router.push(`/(client)/job/${item.id}`)}
          className={`mb-4 overflow-hidden border-l-4 ${tab === 'active' ? 'border-l-vanz-teal' : 'border-l-gray-300'}`}
        >
          <View className="p-5">
            <Row className="justify-between items-start mb-4">
              <Text className={`text-content font-black text-lg flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                {title}
              </Text>
              <View className={`${badge.bg} px-3 py-1 rounded-full ml-2 mr-2 border border-${badge.text.split('-')[1]}/10`}>
                <Text className={`${badge.text} font-bold text-[10px] uppercase tracking-wider`}>{badge.label}</Text>
              </View>
            </Row>

            <View className="space-y-3 mb-5">
              <Row className="items-center">
                <View className="mr-3 ml-3"><MapPin size={14} color={colors.green} strokeWidth={2.4} /></View>
                <Text className={`text-content-secondary text-xs font-semibold flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                  {item.pickup_address || 'Départ non spécifié'}
                </Text>
              </Row>
              <Row className="items-center">
                <View className="mr-3 ml-3"><Flag size={14} color={colors.yellowDark} strokeWidth={2.4} /></View>
                <Text className={`text-content-secondary text-xs font-semibold flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                  {item.dropoff_address || 'Arrivée non spécifiée'}
                </Text>
              </Row>
            </View>

            <Row className="justify-between items-center pt-4 border-t border-line">
              <Text className="text-vanz-teal font-black text-base">
                {item.accepted_bid_amount 
                  ? `${item.accepted_bid_amount} ${t('common.currency')}` 
                  : hasBids 
                    ? `Min: ${minBid} ${t('common.currency')}` 
                    : t('client.noOffers')}
              </Text>
              
              <View className="bg-surface px-3 py-1.5 rounded-lg">
                <Text className="text-content-secondary font-bold text-xs">
                  {new Date(item.created_at || new Date().toISOString()).toLocaleDateString(isRtl ? 'ar-TN' : 'fr-FR', {
                    day: 'numeric', month: 'short'
                  })}
                </Text>
              </View>
            </Row>
          </View>
        </PressableCard>
      </Animated.View>
    );
  };

  const isRtl = locale === 'ar';

  return (
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('client.missions')} tall>
        {/* Segmented Control inside Header */}
        <Row className="bg-white/10 p-1.5 rounded-2xl mt-4">
          <TouchableOpacity
            onPress={() => setTab('active')}
            className={`flex-1 py-3 items-center rounded-xl ${tab === 'active' ? 'bg-surface-elevated shadow-card' : ''}`}
          >
            <Text className={`font-extrabold text-sm ${tab === 'active' ? 'text-vanz-teal' : 'text-white/60'}`}>
              {t('client.active')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTab('history')}
            className={`flex-1 py-3 items-center rounded-xl ${tab === 'history' ? 'bg-surface-elevated shadow-card' : ''}`}
          >
            <Text className={`font-extrabold text-sm ${tab === 'history' ? 'text-vanz-teal' : 'text-white/60'}`}>
              {t('client.history')}
            </Text>
          </TouchableOpacity>
        </Row>
      </GradientHeader>

      <View className="flex-1 px-5 pt-5 pb-24">
        {isLoading ? (
          <View>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderJob}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <Animated.View entering={FadeInDown} className="flex-1 items-center justify-center py-16 mt-8">
                <Image
                  source={require('../../../assets/images/empty/no-missions.png')}
                  style={{ width: 200, height: 200 }}
                  resizeMode="contain"
                  className="mb-5"
                />
                <Text className="text-content-secondary text-center text-sm font-semibold leading-relaxed px-8">
                  {tab === 'active'
                    ? t('client.noActive')
                    : t('client.emptyHistory')}
                </Text>
              </Animated.View>
            )}
          />
        )}
      </View>
    </View>
  );
}
