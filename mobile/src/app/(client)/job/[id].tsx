import { colors } from '@/theme/colors';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState, useEffect } from 'react';
import { authApiFetch } from '@/lib/api';
import { datasql } from '@/lib/supabase';
import { driverTrackingChannel, LOCATION_UPDATE_EVENT } from '@/lib/realtime';
import { serviceLabel } from '@/lib/serviceLabel';
import { useI18n } from '@/i18n';
import type { MobileJob } from '@/types/domain';
import GradientHeader from '@/components/ui/GradientHeader';
import Row from '@/components/ui/Row';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Navigation, MessageSquare, ArrowRight, ChevronLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import RadarPulse from '@/components/ui/RadarPulse';
import SosButton from '@/components/ui/SosButton';
import BidCard, { type ClientBid, type DriverUser, type BidDriver } from '@/components/booking/BidCard';

type RawBidDriver = {
  vehicle_type: string | null;
  users?: DriverUser | DriverUser[] | null;
};

type BidSort = 'price' | 'fastest' | 'rating';

type AcceptBidResponse = {
  error?: string;
  data?: {
    payment_url?: string;
    payment_pending?: boolean;
  };
};

type RawClientBid = Omit<ClientBid, 'drivers'> & {
  drivers?: RawBidDriver | RawBidDriver[] | null;
};

/** Blinking green "live" dot for the searching/viewers pill. */
function LiveDot() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.2, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={style} className="w-2 h-2 rounded-full bg-vanz-green shadow-glow-green" />
  );
}

const firstOrNull = <T,>(value: T | T[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

const normalizeBid = (bid: RawClientBid): ClientBid => {
  const driver = firstOrNull(bid.drivers);
  const user = firstOrNull(driver?.users);

  return {
    ...bid,
    drivers: driver
      ? {
          vehicle_type: driver.vehicle_type,
          users: user,
        }
      : null,
  };
};

import { useAuthStore } from '@/store/useAuthStore';
import { useJobDetails } from '@/modules/booking/hooks/useJobDetails';
import { useRealtimeSync } from '@/modules/booking/hooks/useRealtimeSync';

export default function ClientJobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { session } = useAuthStore();

  const [accepting, setAccepting] = useState<string | null>(null);
  const [sort, setSort] = useState<BidSort>('price');
  const [driverLocation, setDriverLocation] = useState<{ latitude: number, longitude: number, heading?: number } | null>(null);

  // Fetch job and bids using TanStack Query hooks
  const { data, isLoading, refetch } = useJobDetails(id);
  const job = data?.job || null;
  const bids = (data?.bids as unknown as RawClientBid[] || []).map(normalizeBid);

  // Automatic query invalidation on realtime database modifications
  useRealtimeSync(session?.user?.id);

  // Live driver location tracking subscriber
  useEffect(() => {
    if (!job || !job.accepted_bid_id || !['matched', 'in_progress'].includes(job.status)) {
      setDriverLocation(null);
      return;
    }

    const acceptedBid = bids.find(b => b.id === job.accepted_bid_id);
    if (!acceptedBid) return;

    const driverId = acceptedBid.driver_id;
    
    // Subscribe to coordinates broadcast by driver
    const trackingChannel = datasql
      .channel(driverTrackingChannel(driverId))
      .on('broadcast', { event: LOCATION_UPDATE_EVENT }, (payload: any) => {
        if (payload?.payload?.lat && payload?.payload?.lng) {
          setDriverLocation({
            latitude: payload.payload.lat,
            longitude: payload.payload.lng,
            heading: payload.payload.heading,
          });
        }
      })
      .subscribe();

    return () => {
      datasql.removeChannel(trackingChannel);
    };
  }, [job, bids]);

  const openChat = async (driverId: string) => {
    try {
      const { data: conv } = await datasql
        .from('conversations')
        .select('id')
        .eq('job_id', id)
        .eq('driver_id', driverId)
        .maybeSingle();

      if (conv?.id) {
        router.push(`/(client)/chat/${conv.id}`);
      } else {
        Alert.alert(t('common.error'), t('jobDetails.chatUnavailable'));
      }
    } catch (e) {
      console.error('Failed to open chat:', e);
    }
  };

  const handleAcceptBid = async (bid: ClientBid) => {
    if (!job) return;

    Alert.alert(
      t('jobDetails.confirmTitle'),
      t('jobDetails.confirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('client.accept'),
          onPress: async () => {
            setAccepting(bid.id);
            try {
              const res = await authApiFetch('/api/jobs/accept', {
                method: 'POST',
                body: JSON.stringify({
                  job_id: id,
                  bid_id: bid.id,
                  client_id: job.client_id,
                }),
              });

              const payload = (await res.json()) as AcceptBidResponse;

              if (!res.ok) {
                throw new Error(payload.error || t('jobDetails.acceptFailed'));
              }

              if (payload.data?.payment_url) {
                await Linking.openURL(payload.data.payment_url);
              } else {
                Alert.alert(
                  t('jobDetails.paymentTitle'),
                  t('jobDetails.paymentBody')
                );
              }
              refetch();
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              Alert.alert(t('common.error'), message);
            } finally {
              setAccepting(null);
            }
          }
        }
      ]
    );
  };

  const isRtl = locale === 'ar';
  
  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <GradientHeader title={t('client.jobDetails')} backButton={() => router.back()} />
        <View className="p-5">
          <ShimmerCard />
          <View className="mt-4 gap-4">
            <ShimmerCard />
            <ShimmerCard />
          </View>
        </View>
      </View>
    );
  }

  const statusLabels: Record<string, string> = {
    open: t('jobDetails.statusOpen'),
    payment_pending: t('jobDetails.statusPaymentPending'),
    matched: t('jobDetails.statusMatched'),
    in_progress: t('jobDetails.statusInProgress'),
    completed: t('jobDetails.statusCompleted'),
    expired: t('jobDetails.statusExpired'),
    cancelled: t('jobDetails.statusCancelled'),
  };


  const currentStatus = job?.status || 'open';

  // Tracking Stepper logic
  const steps = [
    { label: t('jobDetails.stepCreated'), active: ['open', 'payment_pending', 'matched', 'in_progress', 'completed'] },
    { label: t('jobDetails.paymentTitle'), active: ['payment_pending', 'matched', 'in_progress', 'completed'] },
    { label: t('jobDetails.stepMatched'), active: ['matched', 'in_progress', 'completed'] },
    { label: t('jobDetails.stepEnRoute'), active: ['in_progress', 'completed'] },
    { label: t('jobDetails.stepDelivered'), active: ['completed'] },
  ];

  return (
    <View className={`flex-1 ${currentStatus === 'open' ? 'bg-inverted' : 'bg-surface'}`}>
      {currentStatus === 'open' ? (
        /* Immersive live-auction header — slim, transparent, back chevron only */
        <Row style={{ paddingTop: Math.max(insets.top, 16) }} className="px-4 pb-1 items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
          >
            <ChevronLeft size={20} color="#ffffff" style={isRtl ? { transform: [{ scaleX: -1 }] } : undefined} />
          </TouchableOpacity>
        </Row>
      ) : (
        <GradientHeader title={t('client.jobDetails')} backButton={() => router.back()} />
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {currentStatus === 'open' ? (
          <View className="pt-2 pb-3 items-center">
            <Row className="items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 mb-4">
              <LiveDot />
              <Text className="text-white font-bold text-xs tabular-nums">
                {t('bids.live')}{bids.length > 0 ? ` · ${bids.length} ${t('bids.offersCount')}` : ''}
              </Text>
            </Row>
            <Text className="text-white text-2xl font-black mb-1 text-center px-6">
              {bids.length === 0
                ? t('jobDetails.searchingDrivers')
                : t('jobDetails.chooseDriver')}
            </Text>
            {job?.pickup_address && job?.dropoff_address && (
              <Text className="text-white/55 text-xs font-semibold text-center px-8" numberOfLines={1}>
                {job.pickup_address.split(',')[0]} → {job.dropoff_address.split(',')[0]} · {serviceLabel(job?.service_type, t)}
              </Text>
            )}
            {bids.length === 0 && <RadarPulse />}
          </View>
        ) : (
          /* Map Preview Area */
          <View className="h-48 w-full bg-gray-200">
            {job?.pickup_lat && job?.pickup_lng && (
              <MapView
                className="w-full h-full"
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: job.pickup_lat,
                  longitude: job.pickup_lng,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={!!driverLocation}
                zoomEnabled={!!driverLocation}
                pitchEnabled={!!driverLocation}
                rotateEnabled={!!driverLocation}
              >
                {/* Pickup Marker */}
                <Marker coordinate={{ latitude: job.pickup_lat, longitude: job.pickup_lng }} title="Départ">
                  <View className="w-8 h-8 items-center justify-center bg-vanz-teal rounded-full border-2 border-white shadow-md">
                    <Text className="text-xs">📍</Text>
                  </View>
                </Marker>

                {/* Live Driver Tracking Marker */}
                {driverLocation && (
                  <Marker coordinate={driverLocation} title="Livreur" flat>
                    <View className="w-10 h-10 items-center justify-center bg-inverted rounded-full border-2 border-white shadow-elevated">
                      <Text className="text-xl">🚚</Text>
                    </View>
                  </Marker>
                )}
              </MapView>
            )}
            {/* Emergency SOS — available while the trip is live */}
            {['matched', 'in_progress'].includes(currentStatus) && (
              <View className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'}`}>
                <SosButton jobId={id} variant="floating" />
              </View>
            )}
            {/* Bottom rounded overlay to blend with cards */}
            <View className="absolute bottom-0 w-full h-6 bg-surface rounded-t-[24px]" />
          </View>
        )}

        <View className={`px-5 ${currentStatus === 'open' ? 'mt-2' : '-mt-6'}`}>
          {/* Stepper + job-details card: hidden during the live auction so the bid feed
              stays front-and-center (matches the prototype's BidsScreen). */}
          {currentStatus !== 'open' && (
          <>
          {/* Status Tracker Stepper */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View className="bg-surface-elevated p-5 rounded-card shadow-card mb-5 border border-line">
              <Row className="justify-between items-center">
                {steps.map((step, index) => {
                  const isActive = step.active.includes(currentStatus);
                  return (
                    <View key={index} className="flex-1 items-center relative">
                      {/* Progress Line */}
                      {index > 0 && (
                        <View 
                          className={`absolute top-4 w-full h-1.5 -translate-y-[0.5px] rounded-full ${isRtl ? 'right-1/2' : 'left-1/2'}`}
                          style={{ zIndex: -1 }}
                        >
                          <LinearGradient
                            colors={isActive ? [colors.teal, colors.teal] : [colors.iceblue, colors.iceblue]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="w-full h-full"
                          />
                        </View>
                      )}
                      <View 
                        className={`w-8 h-8 rounded-full items-center justify-center border-4 ${
                          isActive ? 'bg-vanz-teal border-vanz-teal/20 shadow-glow-teal' : 'bg-surface-sunken border-white'
                        }`}
                      >
                        {isActive && index === steps.findIndex(s => !s.active.includes(currentStatus)) - 1 || 
                         (isActive && index === steps.length -1) ? (
                          <View className="w-2.5 h-2.5 bg-surface-elevated rounded-full" />
                        ) : isActive ? (
                          <Check size={10} color={colors.white} strokeWidth={3} />
                        ) : null}
                      </View>
                      <Text className={`text-[9px] font-black uppercase tracking-wider mt-2 text-center ${isActive ? 'text-content' : 'text-content-muted'}`}>
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </Row>
            </View>
          </Animated.View>

          {/* Trip Details Card */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View className="bg-surface-elevated p-5 rounded-card shadow-card mb-6 border border-line">
              <Row className="justify-between items-center mb-5">
                <Text className={`text-content font-black text-xl flex-1 ${isRtl ? 'text-right' : ''}`}>
                  {serviceLabel(job?.service_type, t)}
                </Text>
                <View className="bg-vanz-teal/10 px-4 py-1.5 rounded-full border border-vanz-teal/20">
                  <Text className="text-vanz-teal font-extrabold text-xs">
                    {statusLabels[currentStatus] || currentStatus}
                  </Text>
                </View>
              </Row>

              <View className="bg-surface-sunken/50 p-4 rounded-2xl border border-line mb-4">
                <Row className="items-start mb-3.5">
                  <View className="w-5 h-5 rounded-full bg-vanz-teal/20 items-center justify-center mr-3 ml-3 mt-0.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
                  </View>
                  <Text className={`text-content font-bold text-sm flex-1 ${isRtl ? 'text-right' : ''}`}>
                    {job?.pickup_address || 'Non spécifié'}
                  </Text>
                </Row>

                <View className={`w-0.5 h-6 bg-gray-200 mb-2 -mt-2 ${isRtl ? 'right-5.5' : 'left-5.5'}`} />

                <Row className="items-start">
                  <View className="w-5 h-5 rounded-xl bg-vanz-yellow/20 items-center justify-center mr-3 ml-3 mt-0.5">
                    <View className="w-2.5 h-2.5 rounded-sm bg-vanz-yellow" />
                  </View>
                  <Text className={`text-content font-bold text-sm flex-1 ${isRtl ? 'text-right' : ''}`}>
                    {job?.dropoff_address || 'Non spécifié'}
                  </Text>
                </Row>
              </View>

              {job?.description ? (
                <Text className={`text-content-secondary text-sm font-medium leading-relaxed ${isRtl ? 'text-right' : ''}`}>
                  {job.description}
                </Text>
              ) : null}

              {job?.accepted_bid_amount ? (
                <Row className="mt-5 pt-5 border-t border-line justify-between items-center">
                  <Text className="text-content-secondary font-bold text-sm">
                    {t('jobDetails.agreedPrice')}
                  </Text>
                  <Text className="text-vanz-teal font-black text-xl">
                    {job.accepted_bid_amount} {t('common.currency')}
                  </Text>
                </Row>
              ) : null}
            </View>
          </Animated.View>
          </>
          )}

          {/* Review CTA — once the mission is completed */}
          {currentStatus === 'completed' && job?.accepted_bid_id && (
            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <TouchableOpacity
                onPress={() => router.push(`/(client)/review/${id}` as Href)}
                className="mb-6 h-14 rounded-2xl overflow-hidden shadow-glow-yellow active:opacity-90"
              >
                <LinearGradient
                  colors={[colors.yellow, colors.yellowDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full items-center justify-center flex-row"
                >
                  <Text className="text-lg mr-2 ml-2">⭐</Text>
                  <Text className="text-content font-black text-base">
                    {t('jobDetails.leaveReview')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Bids List Header */}
          <Animated.Text entering={FadeInDown.delay(300)} className={`${currentStatus === 'open' ? 'text-white' : 'text-content'} text-lg font-black mb-4 ${isRtl ? 'text-right' : ''}`}>
            {t('client.offersReceived')} ({bids.length})
          </Animated.Text>

          {/* Sort tabs — only while the auction is live with more than one offer */}
          {currentStatus === 'open' && bids.length > 1 && (
            <Animated.View entering={FadeInDown.delay(320)} className={`flex-row gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {([['price', t('bids.sortPrice')], ['fastest', t('bids.sortFastest')], ['rating', t('bids.sortRated')]] as [BidSort, string][]).map(([key, label]) => {
                const on = sort === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setSort(key)}
                    className={`flex-1 py-2.5 rounded-xl items-center border ${on ? 'bg-vanz-teal/15 border-vanz-teal' : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-black ${on ? 'text-vanz-teal' : 'text-white/60'}`}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}

          {/* Driver Bids Loop */}
          {(() => {
            const lowestAmount = bids.length > 1
              ? Math.min(...bids.map((b) => Number(b.amount)))
              : null;
            const etas = bids.map((b) => b.estimated_duration_minutes).filter((e): e is number => e != null);
            const fastestEta = etas.length > 1 ? Math.min(...etas) : null;
            const sortedBids = currentStatus === 'open'
              ? [...bids].sort((a, b) => {
                  if (sort === 'price') return Number(a.amount) - Number(b.amount);
                  if (sort === 'fastest') {
                    return (a.estimated_duration_minutes ?? Infinity) - (b.estimated_duration_minutes ?? Infinity);
                  }
                  const ar = a.drivers?.users?.cached_rating ? Number(a.drivers.users.cached_rating) : 0;
                  const br = b.drivers?.users?.cached_rating ? Number(b.drivers.users.cached_rating) : 0;
                  return br - ar;
                })
              : bids;
            return sortedBids.map((bid, index) => {
              const isBestPrice = lowestAmount !== null && Number(bid.amount) === lowestAmount;
              const isFastest = fastestEta !== null && bid.estimated_duration_minutes === fastestEta;
              return (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  index={index}
                  isBestPrice={isBestPrice}
                  isFastest={isFastest}
                  isLive={currentStatus === "open"}
                  isAccepting={accepting === bid.id}
                  onAccept={() => handleAcceptBid(bid)}
                  onChat={() => openChat(bid.driver_id)}
                />
              );
            });
          })()}

          {bids.length === 0 && currentStatus === 'open' && (
            <Animated.View entering={FadeInDown.delay(400)} className="bg-white/10 p-8 rounded-card items-center border border-white/20 shadow-sm mt-2">
              <Text className="text-4xl mb-4 opacity-50">⏳</Text>
              <Text className="text-white/70 text-center text-sm font-semibold leading-relaxed px-4">
                {t('client.noOffers')}
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
