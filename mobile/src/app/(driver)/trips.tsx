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
      locale === 'ar' ? 'بدء الرحلة' : 'Démarrer le trajet',
      locale === 'ar' ? 'هل أنت متأكد من بدء هذه الرحلة؟' : 'Êtes-vous sûr de vouloir démarrer ce trajet ?',
      [
        { text: locale === 'ar' ? 'إلغاء' : 'Annuler', style: 'cancel' },
        { text: locale === 'ar' ? 'بدء' : 'Démarrer', onPress: () => updateJobStatus(jobId, 'in_progress') }
      ]
    );
  };

  const handleCompleteTrip = (jobId: string) => {
    Alert.alert(
      locale === 'ar' ? 'إنهاء الرحلة' : 'Terminer le trajet',
      locale === 'ar' 
        ? 'لإنهاء الرحلة، يرجى التقاط صورة لإثبات التسليم.' 
        : 'Pour terminer le trajet, veuillez prendre une photo de preuve de livraison.',
      [
        { text: locale === 'ar' ? 'إلغاء' : 'Annuler', style: 'cancel' },
        {
          text: locale === 'ar' ? 'التقاط صورة' : 'Prendre photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                locale === 'ar' ? 'الصلاحية مطلوبة' : 'Permission requise',
                locale === 'ar' 
                  ? 'يرجى السماح بالوصول إلى الكاميرا لالتقاط إثبات التسليم.' 
                  : 'Veuillez autoriser l\'accès à la caméra pour capturer la preuve.'
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
                locale === 'ar' ? 'أحسنت!' : 'Bravo !',
                locale === 'ar' ? 'تم إنهاء الرحلة بنجاح.' : 'Course terminée avec succès.'
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
      matched: { bg: 'bg-blue-50', text: 'text-blue-600', label: locale === 'ar' ? 'معين' : 'Attribuée' },
      in_progress: { bg: 'bg-vanz-yellow/10', text: 'text-vanz-yellow-dark', label: locale === 'ar' ? 'قيد التنفيذ' : 'En cours' },
      completed: { bg: 'bg-vanz-green/10', text: 'text-vanz-green', label: locale === 'ar' ? 'مكتملة' : 'Terminée' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-400', label: locale === 'ar' ? 'ملغاة' : 'Annulée' },
    };
    return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-500', label: status };
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
    const title = item.service_type === 'parcel' ? (locale === 'ar' ? 'شحنة' : 'Colis') : (item.service_type || 'Mission');
    const progress = getProgressPercentage(item.status);

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <PressableCard className="mb-5 overflow-hidden">
          {/* Progress Bar Top */}
          {tab === 'active' && (
            <View className="w-full h-1.5 bg-gray-100">
              <View 
                className={`h-full ${item.status === 'in_progress' ? 'bg-vanz-yellow shadow-glow-yellow' : 'bg-vanz-teal shadow-glow-teal'}`} 
                style={{ width: `${progress}%` }} 
              />
            </View>
          )}

          <View className="p-5">
            <View className={`flex-row justify-between items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Text className={`text-vanz-navy font-black text-lg flex-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                {title}
              </Text>
              <View className={`${badge.bg} px-3 py-1 rounded-full ml-2 mr-2 border border-${badge.text.split('-')[1]}/10`}>
                <Text className={`${badge.text} font-bold text-[10px] uppercase tracking-wider`}>{badge.label}</Text>
              </View>
            </View>

            <View className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 mb-5 relative">
              <View className={`absolute top-8 bottom-8 w-px border-l-2 border-dashed border-gray-200 ${isRtl ? 'right-[29px]' : 'left-[29px]'}`} />
              
              <View className={`flex-row items-start mb-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <View className="w-7 h-7 rounded-full bg-vanz-teal/20 items-center justify-center mr-3 ml-3 relative z-10 border-2 border-white">
                  <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
                </View>
                <Text className={`text-vanz-navy font-bold text-sm flex-1 mt-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={2}>
                  {item.pickup_address}
                </Text>
              </View>
              
              <View className={`flex-row items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                <View className="w-7 h-7 rounded-xl bg-vanz-yellow/20 items-center justify-center mr-3 ml-3 relative z-10 border-2 border-white">
                  <View className="w-2.5 h-2.5 rounded-sm bg-vanz-yellow" />
                </View>
                <Text className={`text-vanz-navy font-bold text-sm flex-1 mt-1 ${isRtl ? 'text-right' : ''}`} numberOfLines={2}>
                  {item.dropoff_address}
                </Text>
              </View>
            </View>

            <View className={`flex-row justify-between items-center mb-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View>
                <Text className={`text-gray-400 font-bold text-xs uppercase tracking-wider mb-1 ${isRtl ? 'text-right' : ''}`}>
                  {locale === 'ar' ? 'السعر' : 'Tarif'}
                </Text>
                <Text className="text-vanz-navy font-black text-xl">
                  {item.accepted_bid_amount} {t('common.currency')}
                </Text>
              </View>
              <View>
                <Text className={`text-gray-400 font-bold text-xs uppercase tracking-wider mb-1 ${isRtl ? 'text-right' : ''}`}>
                  {locale === 'ar' ? 'التاريخ' : 'Date'}
                </Text>
                <Text className={`text-vanz-navy font-bold text-sm ${isRtl ? 'text-right' : ''}`}>
                  {new Date(item.scheduled_at || new Date().toISOString()).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {item.status === 'matched' && (
              <TouchableOpacity 
                onPress={() => handleStartTrip(item.id)}
                className="w-full h-14 rounded-xl overflow-hidden shadow-glow-yellow active:opacity-90"
              >
                <LinearGradient
                  colors={['#F5C800', '#D4AD00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full items-center justify-center flex-row"
                >
                  <Text className="text-white text-base mr-2 ml-2">▶️</Text>
                  <Text className="text-white font-black uppercase tracking-wide">
                    {locale === 'ar' ? 'بدء الرحلة' : 'Démarrer le trajet'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {item.status === 'in_progress' && (
              <TouchableOpacity 
                onPress={() => handleCompleteTrip(item.id)}
                className="w-full h-14 rounded-xl overflow-hidden shadow-glow-green active:opacity-90"
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full items-center justify-center flex-row"
                >
                  <Text className="text-white text-base mr-2 ml-2">✅</Text>
                  <Text className="text-white font-black uppercase tracking-wide">
                    {locale === 'ar' ? 'إنهاء الرحلة' : 'Terminer le trajet'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </PressableCard>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      {uploading && (
        <View className="absolute inset-0 bg-black/60 justify-center items-center z-50">
          <ActivityIndicator size="large" color="#38B6FF" />
          <Text className="text-white font-bold mt-4">Téléversement de la preuve...</Text>
        </View>
      )}
      <GradientHeader title={t('driver.trips')} tall>

        {/* Segmented Control */}
        <View className={`flex-row bg-white/10 p-1.5 rounded-2xl mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <TouchableOpacity 
            onPress={() => setTab('active')}
            className={`flex-1 py-3 items-center rounded-xl ${tab === 'active' ? 'bg-vanz-navy/50 border border-white/10 shadow-sm' : ''}`}
          >
            <Text className={`font-extrabold text-sm ${tab === 'active' ? 'text-vanz-yellow' : 'text-white/60'}`}>
              {locale === 'ar' ? 'النشطة' : 'En cours'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTab('history')}
            className={`flex-1 py-3 items-center rounded-xl ${tab === 'history' ? 'bg-vanz-navy/50 border border-white/10 shadow-sm' : ''}`}
          >
            <Text className={`font-extrabold text-sm ${tab === 'history' ? 'text-vanz-yellow' : 'text-white/60'}`}>
              {locale === 'ar' ? 'السجل' : 'Historique'}
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
            data={trips}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTrip}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <Animated.View entering={FadeInDown} className="flex-1 items-center justify-center py-20 mt-10">
                <View className="w-32 h-32 bg-white rounded-full items-center justify-center shadow-card mb-6">
                  <Text className="text-6xl">🛣️</Text>
                </View>
                <Text className="text-vanz-navy/40 text-center text-sm font-semibold leading-relaxed px-8">
                  {tab === 'active' 
                    ? (locale === 'ar' ? 'ليس لديك رحلات نشطة حالياً.' : 'Vous n\'avez aucun trajet en cours.') 
                    : (locale === 'ar' ? 'سجل رحلاتك فارغ.' : 'Votre historique est vide.')}
                </Text>
              </Animated.View>
            )}
          />
        )}
      </View>
    </View>
  );
}
