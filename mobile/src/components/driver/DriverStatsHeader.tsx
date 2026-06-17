import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * Stitch "Chauffeur — Tableau de bord" header:
 * weekly earnings card + rating / trips stat tiles.
 */
export default function DriverStatsHeader() {
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';

  const [weekEarnings, setWeekEarnings] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekTrips, setWeekTrips] = useState(0);
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    (async () => {
      try {
        const [{ data: txs }, { count: tripsCount }, { data: user }] = await Promise.all([
          datasql
            .from('wallet_transactions')
            .select('amount, type, created_at')
            .eq('user_id', userId)
            .eq('type', 'earning')
            .gte('created_at', weekAgo),
          datasql
            .from('jobs')
            .select('id, bids!inner(driver_id, status)', { count: 'exact', head: true })
            .eq('status', 'completed')
            .eq('bids.driver_id', userId)
            .eq('bids.status', 'accepted')
            .gte('updated_at', weekAgo),
          datasql.from('users').select('cached_rating').eq('id', userId).single(),
        ]);

        const week = (txs || []).reduce((sum, tx: any) => sum + Number(tx.amount), 0);
        const today = (txs || [])
          .filter((tx: any) => tx.created_at >= todayStart)
          .reduce((sum, tx: any) => sum + Number(tx.amount), 0);

        setWeekEarnings(week);
        setTodayEarnings(today);
        setWeekTrips(tripsCount || 0);
        setRating(user?.cached_rating ? Number(user.cached_rating) : null);
      } catch (e) {
        console.error('Failed to fetch driver stats:', e);
      }
    })();
  }, [session?.user?.id]);

  return (
    <View className="mb-5">
      {/* Weekly earnings card */}
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        <View className="rounded-[24px] overflow-hidden shadow-glow-teal mb-3">
          <LinearGradient
            colors={['#38B6FF', '#2196D6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5"
          >
            <View className={`flex-row justify-between items-center mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-white/80 font-bold text-xs uppercase tracking-[2px]">
                {locale === 'ar' ? 'أرباح الأسبوع' : 'Gains de la semaine'}
              </Text>
              <Text className="text-2xl opacity-60">💼</Text>
            </View>
            <Text className={`text-white font-black text-4xl mb-3 ${isRtl ? 'text-right' : ''}`}>
              {weekEarnings.toFixed(0)} <Text className="text-xl font-extrabold text-white/80">{t('common.currency')}</Text>
            </Text>
            <View className={`bg-vanz-navy/20 rounded-xl px-4 py-2.5 flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className="text-white/80 font-bold text-xs">
                {locale === 'ar' ? 'اليوم' : "Aujourd'hui"}
              </Text>
              <Text className="text-white font-black text-base">
                {todayEarnings.toFixed(0)} {t('common.currency')}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Stat tiles */}
      <Animated.View entering={FadeInDown.delay(150).springify()} className={`flex-row gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-card border border-gray-100">
          <View className="w-10 h-10 bg-vanz-yellow/15 rounded-full items-center justify-center mb-2">
            <Text className="text-lg">⭐</Text>
          </View>
          <Text className="text-vanz-navy font-black text-xl">{rating ? rating.toFixed(1) : '—'}</Text>
          <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wide mt-0.5">
            {locale === 'ar' ? 'التقييم العام' : 'Note globale'}
          </Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-card border border-gray-100">
          <View className="w-10 h-10 bg-vanz-teal/15 rounded-full items-center justify-center mb-2">
            <Text className="text-lg">🚚</Text>
          </View>
          <Text className="text-vanz-navy font-black text-xl">{weekTrips}</Text>
          <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-wide mt-0.5">
            {locale === 'ar' ? 'رحلات (الأسبوع)' : 'Courses (7j)'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
