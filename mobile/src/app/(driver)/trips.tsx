import { colors } from '@/theme/colors';
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { datasql } from '@/lib/supabase';
import { authApiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import type { MobileJob } from '@/types/domain';
import GradientHeader from '@/components/ui/GradientHeader';
import PressableCard from '@/components/ui/PressableCard';
import EmptyState from '@/components/ui/EmptyState';
import Row from '@/components/ui/Row';
import { Play, CheckCircle, Route } from 'lucide-react-native';
import SosButton from '@/components/ui/SosButton';
import DriverStatsHeader from '@/components/driver/DriverStatsHeader';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrips } from '@/modules/driver/hooks/useTrips';
import { useRealtimeSync } from '@/modules/booking/hooks/useRealtimeSync';
import { useLocationBroadcaster } from '@/modules/driver/hooks/useLocationBroadcaster';

export default function DriverTripsScreen() {
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [uploading, setUploading] = useState(false);

  // TanStack Query to fetch driver trips
  const { data: trips = [], isLoading, refetch } = useTrips(session?.user?.id, tab);

  // Sync state changes automatically
  useRealtimeSync(session?.user?.id);

  // Broadcast driver coordinates if on an active trip (status = in_progress)
  const activeTrip = trips.find(t => t.status === 'in_progress');
  useLocationBroadcaster({
    driverId: session?.user?.id || null,
    isActive: !!activeTrip,
    jobId: activeTrip?.id || null,
  });

  useFocusEffect(useCallback(() => {
    refetch();
  }, [tab, refetch]));

  const updateJobStatus = async (jobId: string, newStatus: 'in_progress') => {
    if (!session?.user?.id) return;
    try {
      const res = await authApiFetch('/api/jobs/update-status', {
        method: 'POST',
        body: JSON.stringify({
          job_id: jobId,
          driver_id: session.user.id,
          status: newStatus
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to start trip.');
      }
      refetch();
    } catch (e: any) {
      console.error(e);
      Alert.alert(t('common.error'), e.message || String(e));
    }
  };

  const handleStartTrip = (jobId: string) => {
    Alert.alert(
      t('trips.startTitle'),
      t('trips.startBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('trips.start'), onPress: () => updateJobStatus(jobId, 'in_progress') }
      ]
    );
  };

  const handleCompleteTrip = (jobId: string) => {
    Alert.alert(
      t('trips.completeTitle'),
      t('trips.completeBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('trips.takePhoto'),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                t('driverForm.permTitle'),
                t('trips.permCameraProof')
              );
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'images',
              quality: 0.7,
            });

            if (result.canceled || !result.assets || !result.assets[0]) {
              return;
            }

            const uri = result.assets[0].uri;
            setUploading(true);
            try {
              // Convert local URI to Blob
              const blobRes = await fetch(uri);
              const blob = await blobRes.blob();

              const filePath = `${session!.user.id}/${Date.now()}_proof.jpg`;
              
              // Upload to private bucket "delivery-proofs"
              const { data: uploadData, error: uploadErr } = await datasql.storage
                .from('delivery-proofs')
                .upload(filePath, blob, {
                  contentType: 'image/jpeg',
                  upsert: true
                });

              if (uploadErr) throw uploadErr;

              // Post completion to backend API
              const res = await authApiFetch('/api/jobs/complete', {
                method: 'POST',
                body: JSON.stringify({
                  job_id: jobId,
                  driver_id: session!.user.id,
                  delivery_photo_url: uploadData.path
                })
              });

              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to complete job API.');
              }

              Alert.alert(
                t('trips.doneTitle'),
                t('trips.doneBody')
              );
              refetch();
            } catch (e: any) {
              console.error(e);
              Alert.alert(t('common.error'), e.message || String(e));
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      matched: { bg: 'bg-info/10', text: 'text-info', label: t('trips.statusMatched') },
      in_progress: { bg: 'bg-vanz-yellow/10', text: 'text-vanz-yellow-dark', label: t('trips.statusInProgress') },
      completed: { bg: 'bg-vanz-green/10', text: 'text-vanz-green', label: t('trips.statusCompleted') },
      cancelled: { bg: 'bg-surface-sunken', text: 'text-content-muted', label: t('trips.statusCancelled') },
    };
    return badges[status] || { bg: 'bg-surface-sunken', text: 'text-content-secondary', label: status };
  };

  const getProgressPercentage = (status: string) => {
    if (status === 'matched') return 25;
    if (status === 'in_progress') return 75;
    if (status === 'completed') return 100;
    return 0;
  };

  const isRtl = locale === 'ar';

  const renderTrip = ({ item, index }: { item: MobileJob, index: number }) => {
    const badge = getStatusBadge(item.status);
    const title = item.service_type === 'parcel' ? t('common.parcel') : (item.service_type || 'Mission');
    const progress = getProgressPercentage(item.status);

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <PressableCard className="mb-5 overflow-hidden">
          {/* Progress Bar Top */}
          {tab === 'active' && (
            <View className="w-full h-1.5 bg-surface-sunken">
              <View 
                className={`h-full ${item.status === 'in_progress' ? 'bg-vanz-yellow shadow-glow-yellow' : 'bg-vanz-teal shadow-glow-teal'}`} 
                style={{ width: `${progress}%` }} 
              />
            </View>
          )}

          <View className="p-5">
            <Row className="justify-between items-start mb-4">
              <Text className={`text-content font-black text-lg flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                {title}
              </Text>
              <View className={`${badge.bg} px-3 py-1 rounded-full ml-2 mr-2 border border-${badge.text.split('-')[1]}/10`}>
                <Text className={`${badge.text} font-bold text-[10px] uppercase tracking-wider`}>{badge.label}</Text>
              </View>
            </Row>

            <View className="bg-surface-sunken/80 p-4 rounded-2xl border border-line mb-5 relative">
              <View className={`absolute top-8 bottom-8 w-px border-l-2 border-dashed border-line-strong ${isRtl ? 'right-[29px]' : 'left-[29px]'}`} />

              <Row className="items-start mb-3.5">
                <View className="w-7 h-7 rounded-full bg-vanz-teal/20 items-center justify-center mr-3 ml-3 relative z-10 border-2 border-white">
                  <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
                </View>
                <Text className={`text-content font-bold text-sm flex-1 mt-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={2}>
                  {item.pickup_address}
                </Text>
              </Row>

              <Row className="items-start">
                <View className="w-7 h-7 rounded-xl bg-vanz-yellow/20 items-center justify-center mr-3 ml-3 relative z-10 border-2 border-white">
                  <View className="w-2.5 h-2.5 rounded-sm bg-vanz-yellow" />
                </View>
                <Text className={`text-content font-bold text-sm flex-1 mt-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={2}>
                  {item.dropoff_address}
                </Text>
              </Row>
            </View>

            <Row className="justify-between items-center mb-5">
              <View>
                <Text className={`text-content-muted font-bold text-xs uppercase tracking-wider mb-1 ${isRtl ? 'text-right' : ''}`}>
                  {t('trips.price')}
                </Text>
                <Text className="text-content font-black text-xl">
                  {item.accepted_bid_amount} {t('common.currency')}
                </Text>
              </View>
              <View>
                <Text className={`text-content-muted font-bold text-xs uppercase tracking-wider mb-1 ${isRtl ? 'text-right' : ''}`}>
                  {t('trips.date')}
                </Text>
                <Text className={`text-content font-bold text-sm ${isRtl ? 'text-right' : ''}`}>
                  {new Date(item.scheduled_at || new Date().toISOString()).toLocaleDateString()}
                </Text>
              </View>
            </Row>

            {item.status === 'matched' && (
              <TouchableOpacity 
                onPress={() => handleStartTrip(item.id)}
                className="w-full h-14 rounded-xl overflow-hidden shadow-glow-yellow active:opacity-90"
              >
                <LinearGradient
                  colors={[colors.yellow, colors.yellowDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full items-center justify-center flex-row"
                >
                  <Play size={18} color={colors.white} fill={colors.white} strokeWidth={2} />
                  <Text className="text-white font-black uppercase tracking-wide ml-2">
                    {t('trips.startTitle')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {item.status === 'in_progress' && (
              <Row className="items-center gap-2">
                <SosButton jobId={item.id} variant="floating" className="h-14 px-4" />
                <TouchableOpacity
                  onPress={() => handleCompleteTrip(item.id)}
                  className="flex-1 h-14 rounded-xl overflow-hidden shadow-glow-green active:opacity-90"
                >
                  <LinearGradient
                    colors={[colors.green, colors.greenDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="w-full h-full items-center justify-center flex-row"
                  >
                    <CheckCircle size={18} color={colors.white} strokeWidth={2.4} />
                    <Text className="text-white font-black uppercase tracking-wide ml-2">
                      {t('trips.completeTitle')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Row>
            )}
          </View>
        </PressableCard>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-surface">
      {uploading && (
        <View className="absolute inset-0 bg-black/60 justify-center items-center z-50">
          <ActivityIndicator size="large" color={colors.teal} />
          <Text className="text-white font-bold mt-4">Téléversement de la preuve...</Text>
        </View>
      )}
      <GradientHeader title={t('driver.trips')} tall>

        {/* Segmented Control */}
        <Row className="bg-white/10 p-1.5 rounded-2xl mt-4">
          <TouchableOpacity
            onPress={() => setTab('active')}
            className={`flex-1 py-3 items-center rounded-xl ${tab === 'active' ? 'bg-inverted/50 border border-white/10 shadow-sm' : ''}`}
          >
            <Text className={`font-extrabold text-sm ${tab === 'active' ? 'text-vanz-yellow' : 'text-white/60'}`}>
              {t('trips.tabActive')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTab('history')}
            className={`flex-1 py-3 items-center rounded-xl ${tab === 'history' ? 'bg-inverted/50 border border-white/10 shadow-sm' : ''}`}
          >
            <Text className={`font-extrabold text-sm ${tab === 'history' ? 'text-vanz-yellow' : 'text-white/60'}`}>
              {t('trips.tabHistory')}
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
            data={trips}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTrip}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListHeaderComponent={tab === 'active' ? <DriverStatsHeader /> : null}
            ListEmptyComponent={() => (
              <EmptyState
                Icon={Route}
                accent="yellow"
                title={tab === 'active' ? t('trips.emptyActive') : t('trips.emptyHistory')}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}
