import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuthStore } from '@/store/useAuthStore';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import type { MobileJob } from '@/types/domain';
import DriverJobSheet from '@/components/booking/DriverJobSheet';
import { DriverService } from '@/modules/driver/services/driverService';
import { useLocationBroadcaster } from '@/modules/driver/hooks/useLocationBroadcaster';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

type DriverJob = MobileJob & { bids?: { status: string }[] };

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function DriverMarketplaceScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();

  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<DriverJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DriverJob | null>(null);
  const [verified, setVerified] = useState(false);
  const [driverStatus, setDriverStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Status mapping
  const activeStatuses = ['open', 'payment_pending'];

  const isRtl = locale === 'ar';

  // Tunisia Default Region
  const initialRegion = {
    latitude: 36.8065,
    longitude: 10.1815,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  useEffect(() => {
    checkVerification();
  }, []);

  const checkVerification = async () => {
    if (!session?.user?.id) return;
    try {
      // Same rule as web: drivers.status === 'approved'
      const { data } = await datasql
        .from('drivers')
        .select('status, rejection_reason')
        .eq('id', session.user.id)
        .maybeSingle();

      const status = (data?.status as 'pending' | 'approved' | 'rejected' | undefined) ?? 'none';
      setDriverStatus(status);
      setRejectionReason(data?.rejection_reason ?? null);
      setVerified(status === 'approved');
      if (status === 'approved') {
        fetchMarket();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchMarket = async () => {
    try {
      const { data, error } = await datasql
        .from('jobs')
        .select('*, bids(status)')
        .in('status', activeStatuses)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (e) {
      console.error('Failed to fetch market jobs:', e);
    }
  };

  // Broadcast GPS while online (no specific job → general availability tracking).
  useLocationBroadcaster({
    driverId: session?.user?.id ?? null,
    isActive: online && verified,
    jobId: null,
  });

  // Toggle online/offline: persist to users table, then flip local state.
  const toggleOnline = async () => {
    const next = !online;
    setOnline(next); // optimistic
    if (!session?.user?.id) return;
    try {
      await DriverService.updateOnlineStatus(session.user.id, next);
      if (next) fetchMarket();
    } catch (e) {
      console.error('Failed to update online status:', e);
      setOnline(!next); // revert on failure
    }
  };

  // Safety: if the driver leaves the screen while online, mark them offline.
  const onlineRef = useRef(online);
  onlineRef.current = online;
  useEffect(() => {
    const userId = session?.user?.id;
    return () => {
      if (onlineRef.current && userId) {
        DriverService.updateOnlineStatus(userId, false).catch(() => {});
      }
    };
  }, [session?.user?.id]);

  // Check if driver has already bid on this job
  const hasBidOnJob = (job: DriverJob) => {
    return job.bids && job.bids.length > 0;
  };

  if (!verified && !checkingAuth) {
    // Pending review — documents submitted, waiting for admin approval.
    if (driverStatus === 'pending') {
      return (
        <View className="flex-1 bg-vanz-iceblue justify-center items-center p-6">
          <Animated.View entering={FadeInDown.springify()} className="items-center">
            <View className="w-32 h-32 bg-vanz-teal/20 rounded-full items-center justify-center mb-6">
              <Text className="text-6xl">⏳</Text>
            </View>
            <Text className="text-vanz-navy text-2xl font-black mb-4 text-center">
              {locale === 'ar' ? 'قيد المراجعة' : 'En cours de vérification'}
            </Text>
            <Text className="text-vanz-navy/60 text-center mb-10 font-medium px-4 leading-relaxed">
              {locale === 'ar'
                ? 'تم استلام مستنداتك. سنخطرك فور الموافقة على حسابك.'
                : 'Vos documents ont été reçus. Vous serez notifié dès la validation de votre compte.'}
            </Text>
            <TouchableOpacity
              onPress={checkVerification}
              className="px-8 h-14 bg-white rounded-2xl items-center justify-center shadow-card border border-gray-100 active:bg-gray-50"
            >
              <Text className="text-vanz-navy font-extrabold">{locale === 'ar' ? 'تحديث الحالة' : 'Actualiser'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    // No driver record yet, or rejected → show onboarding CTA.
    const isRejected = driverStatus === 'rejected';
    return (
      <View className="flex-1 bg-vanz-iceblue justify-center items-center p-6">
        <Animated.View entering={FadeInDown.springify()} className="items-center">
          <View className={`w-32 h-32 rounded-full items-center justify-center mb-6 ${isRejected ? 'bg-red-100' : 'bg-vanz-yellow/20'}`}>
            <Text className="text-6xl">{isRejected ? '⚠️' : '📋'}</Text>
          </View>
          <Text className="text-vanz-navy text-2xl font-black mb-4 text-center">
            {isRejected
              ? (locale === 'ar' ? 'تم رفض الطلب' : 'Demande refusée')
              : (locale === 'ar' ? 'مطلوب التحقق' : 'Vérification requise')}
          </Text>
          <Text className="text-vanz-navy/60 text-center mb-10 font-medium px-4 leading-relaxed">
            {isRejected
              ? (rejectionReason || (locale === 'ar' ? 'يرجى إعادة تقديم مستنداتك.' : 'Veuillez soumettre à nouveau vos documents.'))
              : (locale === 'ar'
                ? 'يرجى تقديم مستنداتك للبدء في استقبال طلبات النقل والعمل كسائق.'
                : 'Veuillez soumettre vos documents pour commencer à accepter des missions.')}
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(driver)/verify')}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-yellow active:opacity-90"
          >
            <LinearGradient
              colors={['#F5C800', '#D4AD00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full items-center justify-center"
            >
              <Text className="text-white text-xl font-extrabold">
                {isRejected ? (locale === 'ar' ? 'إعادة التقديم' : 'Resoumettre') : (locale === 'ar' ? 'التحقق الآن' : 'Vérifier maintenant')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-vanz-iceblue">
      {/* Map Background */}
      <MapView
        ref={mapRef}
        className="w-full h-full absolute"
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        // customMapStyle={/* Add snazzy maps dark theme here if desired */}
      >
        {online && jobs.map((job) => {
          if (!job.pickup_lat || !job.pickup_lng) return null;
          const isSelected = selectedJob?.id === job.id;
          const hasBid = hasBidOnJob(job);
          
          return (
            <Marker
              key={job.id}
              coordinate={{ latitude: job.pickup_lat, longitude: job.pickup_lng }}
              onPress={() => setSelectedJob(job)}
              zIndex={isSelected ? 10 : 1}
            >
              <View className={`items-center justify-center ${isSelected ? 'scale-125' : ''}`}>
                <View className={`px-3 py-1.5 rounded-full border-2 border-white shadow-sm flex-row items-center ${
                  hasBid ? 'bg-vanz-teal' : isSelected ? 'bg-vanz-yellow' : 'bg-vanz-navy'
                }`}>
                  <Text className="text-white font-bold text-xs tracking-wider">
                    {hasBid ? '✓' : job.load_capacity?.replace('van_', 'Van ').toUpperCase() || 'VAN'}
                  </Text>
                </View>
                <View className={`w-2.5 h-2.5 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white ${
                  hasBid ? 'bg-vanz-teal' : isSelected ? 'bg-vanz-yellow' : 'bg-vanz-navy'
                }`} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Controls Overlay */}
      <View
        className={`absolute w-full px-5 flex-row justify-between items-start z-10 ${isRtl ? 'flex-row-reverse' : ''}`}
        style={{ top: Math.max(insets.top, 16) + 8 }}
      >
        <TouchableOpacity 
          className="w-12 h-12 bg-card-glass rounded-full justify-center items-center shadow-elevated border border-white/50 active:opacity-90"
          onPress={() => router.push('/(driver)/profile')}
        >
          <Text className="text-xl text-vanz-navy font-bold">☰</Text>
        </TouchableOpacity>

        {/* Online Toggle Pill */}
        <TouchableOpacity
          onPress={toggleOnline}
          className={`h-12 px-6 rounded-full flex-row items-center justify-center shadow-elevated border border-white/50 active:opacity-90 ${
            online ? 'bg-white' : 'bg-vanz-navy'
          } ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <View className={`w-3 h-3 rounded-full mr-2 ml-2 ${online ? 'bg-vanz-green shadow-glow-green' : 'bg-red-500'}`} />
          <Text className={`font-black text-sm uppercase tracking-wide ${online ? 'text-vanz-navy' : 'text-white'}`}>
            {online ? (locale === 'ar' ? 'متصل' : 'En ligne') : (locale === 'ar' ? 'غير متصل' : 'Hors ligne')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline Blanket / List View overlay */}
      {!online ? (
        <Animated.View
          entering={FadeIn.delay(300)}
          className="absolute w-full p-5 z-10"
          style={{ bottom: 60 + Math.max(insets.bottom, 12) }}
        >
          <View className="bg-card-glass p-8 rounded-[32px] items-center border border-white/50 shadow-elevated">
            <Text className="text-5xl mb-4">🌙</Text>
            <Text className="text-vanz-navy text-xl font-black mb-2 text-center">
              {locale === 'ar' ? 'أنت غير متصل' : 'Vous êtes hors ligne'}
            </Text>
            <Text className="text-vanz-navy/60 text-center font-medium leading-relaxed">
              {locale === 'ar' 
                ? 'قم بالاتصال لبدء استقبال الطلبات ورؤية الخريطة.' 
                : 'Passez en ligne pour voir les missions disponibles sur la carte.'}
            </Text>
          </View>
        </Animated.View>
      ) : (
        <View className="absolute right-5 z-10" style={{ bottom: 80 + Math.max(insets.bottom, 12) }}>
          <TouchableOpacity 
            onPress={fetchMarket}
            className="w-12 h-12 bg-white rounded-full justify-center items-center shadow-elevated border border-gray-100 active:bg-gray-50"
          >
            <Text className="text-xl">🔄</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet for Job Detail/Bid */}
      {selectedJob && online && (
        <DriverJobSheet
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onBidSuccess={() => {
            setSelectedJob(null);
            fetchMarket();
          }}
        />
      )}
    </View>
  );
}
