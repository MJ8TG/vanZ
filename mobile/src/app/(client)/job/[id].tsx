import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { authApiFetch } from '@/lib/api';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import type { MobileJob } from '@/types/domain';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

type DriverUser = {
  first_name: string | null;
  last_name: string | null;
  cached_rating: number | string | null;
};

type BidDriver = {
  vehicle_type: string | null;
  users?: DriverUser | null;
};

type RawBidDriver = {
  vehicle_type: string | null;
  users?: DriverUser | DriverUser[] | null;
};

type ClientBid = {
  id: string;
  job_id: string;
  driver_id: string;
  amount: number | string;
  note: string | null;
  status: string;
  drivers?: BidDriver | null;
};

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
  const { t, locale } = useI18n();
  const { session } = useAuthStore();

  const [accepting, setAccepting] = useState<string | null>(null);
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
      .channel(`client-tracking-${driverId}`)
      .on('broadcast', { event: 'location_update' }, (payload: any) => {
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

  const handleAcceptBid = async (bid: ClientBid) => {
    if (!job) return;

    Alert.alert(
      locale === 'ar' ? 'تأكيد' : 'Confirmer',
      locale === 'ar'
        ? 'هل تريد اختيار هذا العرض؟ سيتم فتح صفحة الدفع لتأكيد الحجز.'
        : 'Voulez-vous choisir cette offre ? La page de paiement va s’ouvrir pour confirmer la réservation.',
      [
        { text: locale === 'ar' ? 'إلغاء' : 'Annuler', style: 'cancel' },
        {
          text: locale === 'ar' ? 'قبول' : 'Accepter',
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
                throw new Error(payload.error || (locale === 'ar' ? 'تعذر قبول العرض.' : 'Impossible d’accepter cette offre.'));
              }

              if (payload.data?.payment_url) {
                await Linking.openURL(payload.data.payment_url);
              } else {
                Alert.alert(
                  locale === 'ar' ? 'الدفع' : 'Paiement',
                  locale === 'ar'
                    ? 'تم اختيار العرض. يرجى إكمال الدفع لتأكيد الحجز.'
                    : 'L’offre est sélectionnée. Terminez le paiement pour confirmer la réservation.'
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
      <View className="flex-1 bg-vanz-iceblue">
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
    open: locale === 'ar' ? 'مفتوح' : 'Ouverte',
    payment_pending: locale === 'ar' ? 'في انتظار الدفع' : 'Paiement en attente',
    matched: locale === 'ar' ? 'تم التعيين' : 'Attribuée',
    in_progress: locale === 'ar' ? 'قيد التنفيذ' : 'En cours',
    completed: locale === 'ar' ? 'مكتملة' : 'Terminée',
    expired: locale === 'ar' ? 'منتهية الصلاحية' : 'Expirée',
    cancelled: locale === 'ar' ? 'ملغاة' : 'Annulée',
  };


  const currentStatus = job?.status || 'open';

  // Tracking Stepper logic
  const steps = [
    { label: locale === 'ar' ? 'نشرت' : 'Créée', active: ['open', 'payment_pending', 'matched', 'in_progress', 'completed'] },
    { label: locale === 'ar' ? 'الدفع' : 'Paiement', active: ['payment_pending', 'matched', 'in_progress', 'completed'] },
    { label: locale === 'ar' ? 'تعيين' : 'Attribuée', active: ['matched', 'in_progress', 'completed'] },
    { label: locale === 'ar' ? 'تنفيذ' : 'En route', active: ['in_progress', 'completed'] },
    { label: locale === 'ar' ? 'مكتملة' : 'Livrée', active: ['completed'] },
  ];

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={t('client.jobDetails')} backButton={() => router.back()} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Map Preview Area */}
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
                  <View className="w-10 h-10 items-center justify-center bg-vanz-navy rounded-full border-2 border-white shadow-elevated">
                    <Text className="text-xl">🚚</Text>
                  </View>
                </Marker>
              )}
            </MapView>
          )}
          {/* Bottom rounded overlay to blend with cards */}
          <View className="absolute bottom-0 w-full h-6 bg-vanz-iceblue rounded-t-[24px]" />
        </View>

        <View className="px-5 -mt-6">
          {/* Status Tracker Stepper */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View className="bg-white p-5 rounded-card shadow-card mb-5 border border-gray-100">
              <View className={`flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
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
                            colors={isActive ? ['#38B6FF', '#38B6FF'] : ['#F0F6FA', '#F0F6FA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="w-full h-full"
                          />
                        </View>
                      )}
                      <View 
                        className={`w-8 h-8 rounded-full items-center justify-center border-4 ${
                          isActive ? 'bg-vanz-teal border-vanz-teal/20 shadow-glow-teal' : 'bg-gray-100 border-white'
                        }`}
                      >
                        {isActive && index === steps.findIndex(s => !s.active.includes(currentStatus)) - 1 || 
                         (isActive && index === steps.length -1) ? (
                          <View className="w-2.5 h-2.5 bg-white rounded-full" />
                        ) : isActive ? (
                          <Text className="text-[10px] text-white">✓</Text>
                        ) : null}
                      </View>
                      <Text className={`text-[9px] font-black uppercase tracking-wider mt-2 text-center ${isActive ? 'text-vanz-navy' : 'text-gray-400'}`}>
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* Trip Details Card */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View className="bg-white p-5 rounded-card shadow-card mb-6 border border-gray-100">
              <View className={`flex-row justify-between items-center mb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className={`text-vanz-navy font-black text-xl flex-1 ${isRtl ? 'text-right' : ''}`}>
                  {job?.service_type === 'parcel' ? (locale === 'ar' ? 'شحنة' : 'Colis') : (job?.service_type || 'Mission')}
                </Text>
                <View className="bg-vanz-teal/10 px-4 py-1.5 rounded-full border border-vanz-teal/20">
                  <Text className="text-vanz-teal font-extrabold text-xs">
                    {statusLabels[currentStatus] || currentStatus}
                  </Text>
                </View>
              </View>

              <View className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-4">
                <View className={`flex-row items-start mb-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className="w-5 h-5 rounded-full bg-vanz-teal/20 items-center justify-center mr-3 ml-3 mt-0.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
                  </View>
                  <Text className={`text-vanz-navy font-bold text-sm flex-1 ${isRtl ? 'text-right' : ''}`}>
                    {job?.pickup_address || 'Non spécifié'}
                  </Text>
                </View>
                
                <View className={`w-0.5 h-6 bg-gray-200 mb-2 -mt-2 ${isRtl ? 'right-5.5' : 'left-5.5'}`} />
                
                <View className={`flex-row items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className="w-5 h-5 rounded-xl bg-vanz-yellow/20 items-center justify-center mr-3 ml-3 mt-0.5">
                    <View className="w-2.5 h-2.5 rounded-sm bg-vanz-yellow" />
                  </View>
                  <Text className={`text-vanz-navy font-bold text-sm flex-1 ${isRtl ? 'text-right' : ''}`}>
                    {job?.dropoff_address || 'Non spécifié'}
                  </Text>
                </View>
              </View>

              {job?.description ? (
                <Text className={`text-vanz-navy/70 text-sm font-medium leading-relaxed ${isRtl ? 'text-right' : ''}`}>
                  {job.description}
                </Text>
              ) : null}

              {job?.accepted_bid_amount ? (
                <View className={`mt-5 pt-5 border-t border-gray-100 flex-row justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-vanz-navy/60 font-bold text-sm">
                    {locale === 'ar' ? 'السعر المتفق عليه' : 'Tarif convenu'}
                  </Text>
                  <Text className="text-vanz-teal font-black text-xl">
                    {job.accepted_bid_amount} {t('common.currency')}
                  </Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* Bids List Header */}
          <Animated.Text entering={FadeInDown.delay(300)} className={`text-vanz-navy text-lg font-black mb-4 ${isRtl ? 'text-right' : ''}`}>
            {t('client.offersReceived')} ({bids.length})
          </Animated.Text>
          
          {/* Driver Bids Loop */}
          {bids.map((bid, index) => {
            const driverUser = bid.drivers?.users;
            const driverName = driverUser ? `${driverUser.first_name || ''} ${driverUser.last_name || ''}`.trim() : 'Transporteur';
            const driverRating = driverUser?.cached_rating ? Number(driverUser.cached_rating) : null;
            const initial = driverName[0]?.toUpperCase() || 'T';

            return (
              <Animated.View key={bid.id} entering={FadeInDown.delay(300 + index * 100).springify()}>
                <PressableCard className="mb-4 overflow-hidden">
                  <View className="p-5">
                    <View className={`flex-row items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <View className={`flex-row items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <View className="w-12 h-12 bg-vanz-yellow/10 rounded-full items-center justify-center mr-3 ml-3 border-2 border-vanz-yellow/20">
                          <Text className="text-vanz-navy font-black text-lg">
                            {initial}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className={`text-vanz-navy font-bold text-base ${isRtl ? 'text-right' : ''}`}>
                            {driverName}
                          </Text>
                          {driverRating ? (
                            <View className={`flex-row items-center mt-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <Text className="text-vanz-yellow text-xs mr-1">⭐</Text>
                              <Text className="text-vanz-navy/70 font-bold text-xs">{driverRating.toFixed(1)}/5</Text>
                            </View>
                          ) : (
                            <View className={`flex-row items-center mt-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <View className="bg-vanz-green/10 px-2 py-0.5 rounded">
                                <Text className="text-vanz-green font-bold text-[10px] uppercase">Nouveau</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                      <View className="bg-vanz-teal/10 px-4 py-2 rounded-xl">
                        <Text className="text-vanz-teal font-black text-xl">{bid.amount} {t('common.currency')}</Text>
                      </View>
                    </View>

                    {bid.note ? (
                      <View className="bg-gray-50/80 p-3.5 rounded-xl mb-5">
                        <Text className={`text-vanz-navy/70 text-xs italic font-medium leading-relaxed ${isRtl ? 'text-right' : ''}`}>
                          "{bid.note}"
                        </Text>
                      </View>
                    ) : null}

                    {currentStatus === 'open' && bid.status !== 'rejected' && (
                      <TouchableOpacity 
                        onPress={() => handleAcceptBid(bid)}
                        disabled={accepting === bid.id}
                        className="w-full h-12 rounded-xl overflow-hidden shadow-glow-green active:opacity-90 mt-2"
                      >
                        <LinearGradient
                          colors={accepting === bid.id ? ['#22C55E80', '#16A34A80'] : ['#22C55E', '#16A34A']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          className="w-full h-full items-center justify-center flex-row"
                        >
                          {accepting === bid.id ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <Text className="text-white text-sm mr-2 ml-2">✓</Text>
                              <Text className="text-white font-black text-sm uppercase tracking-wide">{t('client.accept')}</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {bid.status === 'accepted' && (
                      <View className="bg-vanz-green/10 py-3.5 rounded-xl items-center border border-vanz-green/20 mt-2">
                        <Text className="text-vanz-green font-black text-sm uppercase tracking-wide">✓ {locale === 'ar' ? 'تم قبول العرض' : 'Offre acceptée'}</Text>
                      </View>
                    )}
                    {bid.status === 'rejected' && (
                      <View className="bg-gray-50 py-3.5 rounded-xl items-center border border-gray-100 mt-2">
                        <Text className="text-gray-400 font-bold text-sm">{locale === 'ar' ? 'تم رفض العرض' : 'Offre refusée'}</Text>
                      </View>
                    )}
                  </View>
                </PressableCard>
              </Animated.View>
            );
          })}

          {bids.length === 0 && (
            <Animated.View entering={FadeInDown.delay(400)} className="bg-white p-8 rounded-card items-center border border-gray-100 shadow-sm mt-2">
              <Text className="text-4xl mb-4 opacity-50">⏳</Text>
              <Text className="text-vanz-navy/50 text-center text-sm font-semibold leading-relaxed px-4">
                {t('client.noOffers')}
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
