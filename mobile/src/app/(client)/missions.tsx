import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import type { MobileJob } from '@/types/domain';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
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
      open: { bg: 'bg-vanz-teal/10', text: 'text-vanz-teal', label: locale === 'ar' ? 'مفتوح' : 'Ouverte' },
      payment_pending: { bg: 'bg-vanz-yellow/10', text: 'text-vanz-yellow-dark', label: locale === 'ar' ? 'الدفع' : 'Paiement' },
      matched: { bg: 'bg-blue-50', text: 'text-blue-600', label: locale === 'ar' ? 'تم التعيين' : 'Attribuée' },
      in_progress: { bg: 'bg-vanz-green/10', text: 'text-vanz-green', label: locale === 'ar' ? 'قيد التنفيذ' : 'En cours' },
      completed: { bg: 'bg-green-50', text: 'text-green-600', label: locale === 'ar' ? 'مكتملة' : 'Terminée' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-400', label: locale === 'ar' ? 'ملغاة' : 'Annulée' },
      expired: { bg: 'bg-red-50', text: 'text-red-500', label: locale === 'ar' ? 'منتهية' : 'Expirée' },
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

    const title = item.service_type === 'parcel' ? (locale === 'ar' ? 'شحنة' : 'Colis') : (item.service_type || 'Mission');

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <PressableCard 
          onPress={() => router.push(`/(client)/job/${item.id}`)}
          className={`mb-4 overflow-hidden border-l-4 ${tab === 'active' ? 'border-l-vanz-teal' : 'border-l-gray-300'}`}
        >
          <View className="p-5">
            <View className={`flex-row justify-between items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className={`text-vanz-navy font-black text-lg flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                {title}
              </Text>
              <View className={`${badge.bg} px-3 py-1 rounded-full ml-2 mr-2 border border-${badge.text.split('-')[1]}/10`}>
                <Text className={`${badge.text} font-bold text-[10px] uppercase tracking-wider`}>{badge.label}</Text>
              </View>
            </View>

            <View className="space-y-3 mb-5">
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-sm mr-3 ml-3">📍</Text>
                <Text className={`text-vanz-navy/70 text-xs font-semibold flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                  {item.pickup_address || 'Départ non spécifié'}
                </Text>
              </View>
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-sm mr-3 ml-3">🎯</Text>
                <Text className={`text-vanz-navy/70 text-xs font-semibold flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                  {item.dropoff_address || 'Arrivée non spécifiée'}
                </Text>
              </View>
            </View>

            <View className={`flex-row justify-between items-center pt-4 border-t border-gray-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-vanz-teal font-black text-base">
                {item.accepted_bid_amount 
                  ? `${item.accepted_bid_amount} ${t('common.currency')}` 
                  : hasBids 
                    ? `Min: ${minBid} ${t('common.currency')}` 
                    : t('client.noOffers')}
              </Text>
              
              <View className="bg-vanz-iceblue px-3 py-1.5 rounded-lg">
                <Text className="text-vanz-navy/60 font-bold text-xs">
                  {new Date(item.created_at || new Date().toISOString()).toLocaleDateString(locale === 'ar' ? 'ar-TN' : 'fr-FR', {
                    day: 'numeric', month: 'short'
                  })}
                </Text>
              </View>
            </View>
          </View>
        </PressableCard>
      </Animated.View>
    );
  };

  const isRtl = locale === 'ar';

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={t('client.missions')} tall>
        {/* Segmented Control inside Header */}
        <View className={`flex-row bg-white/10 p-1.5 rounded-2xl mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <TouchableOpacity 
            onPress={() => setTab('active')}
            className={`flex-1 py-3 items-center rounded-xl ${tab === 'active' ? 'bg-white shadow-card' : ''}`}
          >
            <Text className={`font-extrabold text-sm ${tab === 'active' ? 'text-vanz-teal' : 'text-white/60'}`}>
              {t('client.active')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTab('history')}
            className={`flex-1 py-3 items-center rounded-xl ${tab === 'history' ? 'bg-white shadow-card' : ''}`}
          >
            <Text className={`font-extrabold text-sm ${tab === 'history' ? 'text-vanz-teal' : 'text-white/60'}`}>
              {t('client.history')}
            </Text>
          </TouchableOpacity>
        </View>
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
              <Animated.View entering={FadeInDown} className="flex-1 items-center justify-center py-20 mt-10">
                <View className="w-32 h-32 bg-white rounded-full items-center justify-center shadow-card mb-6">
                  <Text className="text-6xl">📭</Text>
                </View>
                <Text className="text-vanz-navy/40 text-center text-sm font-semibold leading-relaxed px-8">
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
