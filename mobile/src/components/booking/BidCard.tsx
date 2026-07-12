import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useI18n } from '@/i18n';
import { useDirection } from '@/hooks/useDirection';
import Row from '@/components/ui/Row';
import { Star, Navigation, MessageSquare, ArrowRight, Check } from 'lucide-react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';

export type DriverUser = {
  first_name: string | null;
  last_name: string | null;
  cached_rating: number | string | null;
  total_reviews?: number | null;
};

export type BidDriver = {
  vehicle_type: string | null;
  users?: DriverUser | null;
};

export type ClientBid = {
  id: string;
  job_id: string;
  driver_id: string;
  amount: number | string;
  note: string | null;
  status: string;
  estimated_duration_minutes?: number | null;
  drivers?: BidDriver | null;
};

/** Sweeping shimmer overlay for the best-price bid card. */
function ShimmerSweep() {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 320 }, { rotate: '18deg' }] }));
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden rounded-card">
      <Animated.View style={style} className="absolute -top-4 -bottom-4 w-24 bg-vanz-yellow/20" />
    </View>
  );
}

interface BidCardProps {
  bid: ClientBid;
  index: number;
  isBestPrice: boolean;
  isFastest: boolean;
  /** Auction still live (job status === 'open'). */
  isLive: boolean;
  isAccepting: boolean;
  onAccept: () => void;
  onChat: () => void;
}

/** A single driver offer in the client's live-auction bid feed. */
export default function BidCard({ bid, index, isBestPrice, isFastest, isLive, isAccepting, onAccept, onChat }: BidCardProps) {
  const { t, locale } = useI18n();
  const c = useThemeColors();
  const { isRtl } = useDirection();

  const driverUser = bid.drivers?.users;
  const driverName = driverUser ? `${driverUser.first_name || ''} ${driverUser.last_name || ''}`.trim() : 'Transporteur';
  const driverRating = driverUser?.cached_rating ? Number(driverUser.cached_rating) : null;
  const driverReviews = driverUser?.total_reviews ?? null;
  const initial = driverName[0]?.toUpperCase() || 'T';

  return (
    <Animated.View entering={FadeInDown.delay(index * 200).springify()} className="mb-3">
      <View
        className={`bg-surface-elevated rounded-[20px] p-3.5 overflow-hidden ${isBestPrice ? 'border-[1.5px] border-vanz-yellow' : 'border border-line'}`}
        style={isBestPrice ? { shadowColor: colors.yellow, shadowOpacity: 0.18, shadowRadius: 16, elevation: 4 } : undefined}
      >
        {isBestPrice && isLive && <ShimmerSweep />}

        {/* driver + amount */}
        <Row className="items-start justify-between">
          <Row className="gap-3 flex-1">
            <View className="relative">
              <View className="w-11 h-11 rounded-xl bg-inverted items-center justify-center">
                <Text className="text-vanz-yellow font-black text-sm">{initial}</Text>
              </View>
              <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-vanz-green border-2 border-white" />
            </View>
            <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
              <Text className="text-content font-extrabold text-[15px] tracking-tight" numberOfLines={1}>{driverName}</Text>
              <Row className="items-center gap-1 mt-0.5">
                {driverRating != null ? (
                  <>
                    <Star size={12} color={colors.yellow} fill={colors.yellow} />
                    <Text className="text-content font-bold text-xs tabular-nums">{driverRating.toFixed(1)}</Text>
                    {driverReviews != null && (
                      <Text className="text-content-muted text-[11px] font-semibold">· {driverReviews} {t('bidCard.reviews')}</Text>
                    )}
                  </>
                ) : (
                  <View className="bg-vanz-green/10 px-2 py-0.5 rounded">
                    <Text className="text-vanz-green font-bold text-[10px] uppercase">{t('bidCard.newDriver')}</Text>
                  </View>
                )}
              </Row>
              {bid.drivers?.vehicle_type ? (
                <Text className="text-content-muted text-xs font-semibold mt-0.5" numberOfLines={1}>{bid.drivers.vehicle_type}</Text>
              ) : null}
            </View>
          </Row>
          <View className={isRtl ? 'items-start' : 'items-end'}>
            <Text className="text-content font-black text-[22px] tabular-nums leading-none">{bid.amount}</Text>
            <Text className="text-content-muted font-bold text-[10px] tabular-nums mt-0.5">{t('common.currency')}</Text>
          </View>
        </Row>

        {/* tags */}
        {(isBestPrice || isFastest || bid.note) && (
          <Row className="items-center flex-wrap gap-1.5 mt-2.5">
            {isBestPrice && (
              <View className="bg-vanz-yellow px-2 py-0.5 rounded-full"><Text className="text-content font-black text-[10px]">{t('bids.sortPrice')}</Text></View>
            )}
            {isFastest && (
              <View className="bg-vanz-green/15 px-2 py-0.5 rounded-full"><Text className="text-vanz-green font-black text-[10px]">{t('bids.sortFastest')}</Text></View>
            )}
            {bid.note ? <Text className="text-content-secondary text-[11px] italic flex-1" numberOfLines={1}>“{bid.note}”</Text> : null}
          </Row>
        )}

        {/* eta + actions (live auction) */}
        {isLive && bid.status !== 'rejected' && (
          <Row className="items-center mt-3 pt-3 border-t border-line">
            {bid.estimated_duration_minutes != null && (
              <Row className="items-center gap-1.5">
                <Navigation size={13} color={colors.muted} />
                <View>
                  <Text className="text-content font-bold text-xs tabular-nums leading-none">{bid.estimated_duration_minutes} {t('bids.min')}</Text>
                  <Text className="text-content-muted text-[9px] mt-0.5">{t('bidCard.toPickup')}</Text>
                </View>
              </Row>
            )}
            <Row className={`items-center gap-2 ${isRtl ? 'mr-auto' : 'ml-auto'}`}>
              <TouchableOpacity onPress={onChat} className="w-11 h-11 rounded-xl bg-surface-sunken border border-line-strong items-center justify-center active:bg-surface-sunken">
                <MessageSquare size={17} color={c.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onAccept}
                disabled={isAccepting}
                className="h-11 rounded-xl bg-inverted items-center justify-center flex-row gap-1.5 px-5 active:opacity-90"
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text className="text-white font-black text-sm">{t('client.accept')}</Text>
                    <ArrowRight size={15} color={colors.white} strokeWidth={2.6} />
                  </>
                )}
              </TouchableOpacity>
            </Row>
          </Row>
        )}

        {/* non-open states */}
        {!isLive && bid.status === 'accepted' && (
          <TouchableOpacity onPress={onChat} className="flex-row items-center justify-center bg-surface-sunken py-2.5 rounded-xl mt-3 active:bg-line">
            <MessageSquare size={15} color={c.textPrimary} />
            <Text className="text-content font-extrabold text-xs uppercase tracking-wide mx-2">
              {t('bidCard.chatWithDriver')}
            </Text>
          </TouchableOpacity>
        )}
        {bid.status === 'accepted' && (
          <Row className="bg-vanz-green/10 py-3 rounded-xl items-center justify-center gap-1.5 border border-vanz-green/20 mt-2">
            <Check size={15} color={colors.green} strokeWidth={3} />
            <Text className="text-vanz-green font-black text-sm uppercase tracking-wide">{t('bidCard.accepted')}</Text>
          </Row>
        )}
        {bid.status === 'rejected' && (
          <View className="bg-surface-sunken py-3 rounded-xl items-center border border-line mt-2">
            <Text className="text-content-muted font-bold text-sm">{t('bidCard.rejected')}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
