import { colors } from '@/theme/colors';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { useDriverStats } from '@/modules/driver/hooks/useDriverStats';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Row from '@/components/ui/Row';
import { Briefcase, Star, Truck } from 'lucide-react-native';

/**
 * Stitch "Chauffeur — Tableau de bord" header:
 * weekly earnings card + rating / trips stat tiles.
 */
export default function DriverStatsHeader() {
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';

  const { data } = useDriverStats(session?.user?.id);
  const weekEarnings = data?.weekEarnings ?? 0;
  const todayEarnings = data?.todayEarnings ?? 0;
  const weekTrips = data?.weekTrips ?? 0;
  const rating = data?.rating ?? null;

  return (
    <View className="mb-5">
      {/* Weekly earnings card */}
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        <View className="rounded-[24px] overflow-hidden shadow-glow-teal mb-3">
          <LinearGradient
            colors={[colors.teal, colors.tealDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5"
          >
            <Row className="justify-between items-center mb-2">
              <Text className="text-white/80 font-bold text-xs uppercase tracking-[2px]">
                {t('statsHeader.weekEarnings')}
              </Text>
              <Briefcase size={22} color="rgba(255,255,255,0.6)" strokeWidth={2.2} />
            </Row>
            <Text className={`text-white font-black text-4xl mb-3 ${isRtl ? 'text-right' : ''}`}>
              {weekEarnings.toFixed(0)} <Text className="text-xl font-extrabold text-white/80">{t('common.currency')}</Text>
            </Text>
            <Row className="bg-inverted/20 rounded-xl px-4 py-2.5 justify-between items-center">
              <Text className="text-white/80 font-bold text-xs">
                {t('statsHeader.today')}
              </Text>
              <Text className="text-white font-black text-base">
                {todayEarnings.toFixed(0)} {t('common.currency')}
              </Text>
            </Row>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Stat tiles */}
      <Animated.View entering={FadeInDown.delay(150).springify()} className={`flex-row gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <View className="flex-1 bg-surface-elevated rounded-2xl p-4 items-center shadow-card border border-line">
          <View className="w-10 h-10 bg-vanz-yellow/15 rounded-full items-center justify-center mb-2">
            <Star size={18} color={colors.yellow} fill={colors.yellow} strokeWidth={2} />
          </View>
          <Text className="text-content font-black text-xl">{rating ? rating.toFixed(1) : '—'}</Text>
          <Text className="text-content-muted font-bold text-[10px] uppercase tracking-wide mt-0.5">
            {t('statsHeader.overallRating')}
          </Text>
        </View>
        <View className="flex-1 bg-surface-elevated rounded-2xl p-4 items-center shadow-card border border-line">
          <View className="w-10 h-10 bg-vanz-teal/15 rounded-full items-center justify-center mb-2">
            <Truck size={18} color={colors.teal} strokeWidth={2.2} />
          </View>
          <Text className="text-content font-black text-xl">{weekTrips}</Text>
          <Text className="text-content-muted font-bold text-[10px] uppercase tracking-wide mt-0.5">
            {t('statsHeader.weekTrips')}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
