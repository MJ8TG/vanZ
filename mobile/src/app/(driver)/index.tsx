import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { datasql } from '@/lib/supabase';
import { authApiFetch } from '@/lib/api';
import { useI18n } from '@/i18n';
import type { MobileJob } from '@/types/domain';
import { DriverService } from '@/modules/driver/services/driverService';
import { useLocationBroadcaster } from '@/modules/driver/hooks/useLocationBroadcaster';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import VanzLogo from '@/components/ui/VanzLogo';
import Row from '@/components/ui/Row';
import EmptyState from '@/components/ui/EmptyState';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Power,
  MapPin,
  Truck,
  Minus,
  Plus,
  Check,
  Clock,
  AlertTriangle,
  ClipboardList,
  Radio,
} from 'lucide-react-native';

type DriverJob = MobileJob & {
  bids?: { status: string }[];
  client?: { first_name: string | null; last_name: string | null; cached_rating: number | null } | null;
};

type DriverStats = {
  todayEarnings: number;
  todayTrips: number;
};

const SUGGESTED_BID_BY_CAPACITY: Record<string, number> = {
  moto: 18,
  van_s: 30,
  van_xl: 45,
  camion: 65,
};

const formatOnlineTime = (ms: number) => {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function DriverMarketplaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { t, locale } = useI18n();

  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<DriverJob[]>([]);
  const [verified, setVerified] = useState(false);
  const [driverStatus, setDriverStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stats, setStats] = useState<DriverStats>({ todayEarnings: 0, todayTrips: 0 });
  const [onlineSince, setOnlineSince] = useState<number | null>(null);
  const [onlineElapsed, setOnlineElapsed] = useState(0);

  const isRtl = locale === 'ar';
  const fullName = session?.user?.user_metadata?.full_name as string | undefined;
  const initials = (fullName || 'D').trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('');
  const c = useThemeColors();

  const activeStatuses = ['open', 'payment_pending'];

  useEffect(() => {
    checkVerification();
  }, []);

  const checkVerification = async () => {
    if (!session?.user?.id) return;
    try {
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
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchMarket = useCallback(async () => {
    try {
      const { data, error } = await datasql
        .from('jobs')
        .select('*, bids(status), client:users!client_id(first_name, last_name, cached_rating)')
        .in('status', activeStatuses)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data || []) as DriverJob[]);
    } catch (e) {
      console.error('Failed to fetch market jobs:', e);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    try {
      const [{ data: txs }, { count: tripsCount }] = await Promise.all([
        datasql
          .from('wallet_transactions')
          .select('amount, created_at')
          .eq('user_id', userId)
          .eq('type', 'earning')
          .gte('created_at', todayStart),
        datasql
          .from('jobs')
          .select('id, bids!inner(driver_id, status)', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('bids.driver_id', userId)
          .eq('bids.status', 'accepted')
          .gte('updated_at', todayStart),
      ]);

      const today = (txs || []).reduce((sum, tx: any) => sum + Number(tx.amount), 0);
      setStats({ todayEarnings: today, todayTrips: tripsCount || 0 });
    } catch (e) {
      console.error('Failed to fetch driver stats:', e);
    }
  }, [session?.user?.id]);

  // Broadcast GPS while online (general availability — no specific job).
  useLocationBroadcaster({
    driverId: session?.user?.id ?? null,
    isActive: online && verified,
    jobId: null,
  });

  const toggleOnline = async () => {
    const next = !online;
    setOnline(next);
    setOnlineSince(next ? Date.now() : null);
    if (next) setOnlineElapsed(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!session?.user?.id) return;
    try {
      await DriverService.updateOnlineStatus(session.user.id, next);
      if (next) {
        fetchMarket();
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to update online status:', e);
      setOnline(!next);
      setOnlineSince(!next ? Date.now() : null);
    }
  };

  // Tick the online-time counter every minute while online.
  useEffect(() => {
    if (!online || !onlineSince) return;
    const id = setInterval(() => setOnlineElapsed(Date.now() - onlineSince), 30000);
    setOnlineElapsed(Date.now() - onlineSince);
    return () => clearInterval(id);
  }, [online, onlineSince]);

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

  // ───────────────────── Verification gates (unchanged behaviour) ─────────────────────
  if (!verified && !checkingAuth) {
    if (driverStatus === 'pending') {
      return (
        <View className="flex-1 bg-surface justify-center items-center p-6">
          <Animated.View entering={FadeInDown.springify()} className="items-center">
            <View className="w-32 h-32 bg-vanz-teal/20 rounded-full items-center justify-center mb-6">
              <Clock size={52} color={colors.teal} strokeWidth={1.8} />
            </View>
            <Text className="text-content text-2xl font-black mb-4 text-center">
              {t('dispatch.pendingReview')}
            </Text>
            <Text className="text-content-secondary text-center mb-10 font-medium px-4 leading-relaxed">
              {t('dispatch.pendingBody')}
            </Text>
            <TouchableOpacity
              onPress={checkVerification}
              className="px-8 h-14 bg-surface-elevated rounded-2xl items-center justify-center shadow-card border border-line active:bg-surface-sunken"
            >
              <Text className="text-content font-extrabold">{t('dispatch.refreshStatus')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    const isRejected = driverStatus === 'rejected';
    return (
      <View className="flex-1 bg-surface justify-center items-center p-6">
        <Animated.View entering={FadeInDown.springify()} className="items-center">
          <View className={`w-32 h-32 rounded-full items-center justify-center mb-6 ${isRejected ? 'bg-danger/15' : 'bg-vanz-yellow/20'}`}>
            {isRejected
              ? <AlertTriangle size={52} color="#EF4444" strokeWidth={1.8} />
              : <ClipboardList size={52} color={colors.yellowDark} strokeWidth={1.8} />}
          </View>
          <Text className="text-content text-2xl font-black mb-4 text-center">
            {isRejected
              ? t('becomeDriver.rejectedTitle')
              : t('dispatch.verificationRequired')}
          </Text>
          <Text className="text-content-secondary text-center mb-10 font-medium px-4 leading-relaxed">
            {isRejected
              ? (rejectionReason || t('dispatch.resubmitBody'))
              : t('dispatch.verifyBody')}
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(driver)/verify')}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-yellow active:opacity-90"
          >
            <LinearGradient
              colors={[colors.yellow, colors.yellowDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full items-center justify-center"
            >
              <Text className="text-white text-xl font-extrabold">
                {isRejected ? t('dispatch.resubmit') : t('dispatch.verifyNow')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ───────────────────── Active dispatch screen ─────────────────────
  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 + Math.max(insets.bottom, 12) + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={{ paddingTop: Math.max(insets.top, 16) }} className="px-5 pb-2 bg-surface">
          <Animated.View
            entering={FadeInDown.delay(40).springify()}
            className={`flex-row items-center justify-between mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <Row className="items-center gap-2">
              <VanzLogo size={26} />
              <View className="bg-vanz-teal/15 border border-vanz-teal/30 px-2 py-0.5 rounded-full">
                <Text className="text-vanz-teal text-[10px] font-black tracking-[2px]">
                  {t('driver.rolePill')}
                </Text>
              </View>
            </Row>

            <Row className="items-center gap-2">
              <TouchableOpacity
                onPress={() => router.push('/(driver)/notifications')}
                className="w-11 h-11 rounded-2xl bg-surface-elevated border border-line items-center justify-center shadow-sm active:bg-surface-sunken"
                accessibilityLabel="Notifications"
              >
                <Bell size={20} color={c.textPrimary} strokeWidth={2.1} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(driver)/profile')}
                className="relative w-11 h-11 rounded-full bg-inverted items-center justify-center shadow-card"
                accessibilityLabel="Profile"
              >
                <Text className="text-vanz-yellow font-black text-xs">{initials}</Text>
                {online && (
                  <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-vanz-green border-2 border-vanz-iceblue" />
                )}
              </TouchableOpacity>
            </Row>
          </Animated.View>
        </View>

        {/* ONLINE / OFFLINE SWITCH CARD */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="px-5 mt-4">
          <TouchableOpacity
            onPress={toggleOnline}
            activeOpacity={0.9}
            className={`rounded-card p-5 shadow-card border ${
              online ? 'bg-inverted border-vanz-green/50' : 'bg-surface-elevated border-line'
            }`}
          >
            <Row className="items-center">
              <View
                className={`w-14 h-14 rounded-2xl items-center justify-center ${
                  online ? 'bg-vanz-green/20 border border-vanz-green/40' : 'bg-surface-sunken'
                }`}
              >
                <Power size={26} color={online ? colors.green : c.textPrimary} strokeWidth={2.2} />
              </View>
              <View className={`flex-1 mx-4 ${isRtl ? 'items-end' : ''}`}>
                <Text className={`text-lg font-black tracking-tight ${online ? 'text-white' : 'text-content'}`}>
                  {online ? t('driver.onlineCardOn') : t('driver.onlineCardOff')}
                </Text>
                <Text className={`text-xs font-semibold mt-0.5 ${online ? 'text-white/70' : 'text-content-secondary'}`}>
                  {online ? t('driver.onlineSubOn') : t('driver.onlineSubOff')}
                </Text>
              </View>
              <View
                className={`w-14 h-8 rounded-full flex-row items-center px-1 ${
                  online ? 'bg-vanz-green justify-end' : 'bg-gray-200 justify-start'
                }`}
              >
                <View className="w-6 h-6 rounded-full bg-surface-elevated shadow-sm" />
              </View>
            </Row>
          </TouchableOpacity>
        </Animated.View>

        {/* 3-STAT STRIP */}
        <Animated.View entering={FadeInDown.delay(160).springify()} className="px-5 mt-4">
          <Row className="gap-3">
            <View className="flex-1 bg-surface-elevated rounded-2xl p-3.5 border border-line shadow-sm">
              <Text className="text-content-muted font-bold text-[10px] uppercase tracking-widest">
                {t('driver.statToday')}
              </Text>
              <Text className="text-content font-black text-2xl mt-1 tabular-nums">
                {stats.todayEarnings.toFixed(0)}
                <Text className="text-sm text-vanz-teal font-extrabold"> {t('common.currency')}</Text>
              </Text>
            </View>
            <View className="flex-1 bg-surface-elevated rounded-2xl p-3.5 border border-line shadow-sm">
              <Text className="text-content-muted font-bold text-[10px] uppercase tracking-widest">
                {t('driver.statTrips')}
              </Text>
              <Text className="text-content font-black text-2xl mt-1 tabular-nums">{stats.todayTrips}</Text>
            </View>
            <View className="flex-1 bg-surface-elevated rounded-2xl p-3.5 border border-line shadow-sm">
              <Text className="text-content-muted font-bold text-[10px] uppercase tracking-widest">
                {t('driver.statOnlineTime')}
              </Text>
              <Text className="text-content font-black text-2xl mt-1 tabular-nums">
                {formatOnlineTime(onlineElapsed)}
              </Text>
            </View>
          </Row>
        </Animated.View>

        {/* JOB FEED */}
        <View className="px-5 mt-6">
          <Row className="items-center justify-between mb-4">
            <Text className={`text-content font-black text-lg ${isRtl ? 'text-right' : ''}`}>
              {t('driver.feedTitle')}
            </Text>
            {online && (
              <Row className="items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-vanz-green shadow-glow-green" />
                <Text className="text-vanz-green font-black text-xs uppercase tracking-wide">
                  {t('dispatch.live')}
                </Text>
              </Row>
            )}
          </Row>
          {!online ? (
            <Animated.View entering={FadeInDown.delay(220).springify()} className="bg-surface-elevated border border-line rounded-card p-6 items-center shadow-sm">
              <View className="w-14 h-14 rounded-full bg-surface-sunken items-center justify-center mb-3">
                <Power size={26} color={c.textPrimary} strokeWidth={2.2} />
              </View>
              <Text className="text-content font-black text-base text-center">{t('driver.onlineCardOff')}</Text>
              <Text className="text-content-secondary font-semibold text-xs text-center mt-1">
                {t('driver.onlineSubOff')}
              </Text>
            </Animated.View>
          ) : jobs.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(220).springify()} className="bg-surface-elevated border border-line rounded-card py-4 shadow-sm">
              <EmptyState compact accent="yellow" Icon={Radio} title={t('driver.emptyFeed')} />
            </Animated.View>
          ) : (
            <View className="gap-3">
              {jobs.map((job, i) => (
                <JobFeedCard
                  key={job.id}
                  job={job}
                  delay={220 + i * 80}
                  onBidSuccess={() => {
                    fetchMarket();
                    fetchStats();
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================== JOB CARD ============================== */
function JobFeedCard({
  job,
  delay,
  onBidSuccess,
}: {
  job: DriverJob;
  delay: number;
  onBidSuccess: () => void;
}) {
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const isRtl = locale === 'ar';
  const alreadyBid = !!(job.bids && job.bids.length > 0);
  const c = useThemeColors();

  const suggested = SUGGESTED_BID_BY_CAPACITY[job.load_capacity ?? 'van_s'] ?? 30;
  const [amount, setAmount] = useState<number>(suggested);
  const [submitting, setSubmitting] = useState(false);

  const clientName = (() => {
    const first = job.client?.first_name ?? '';
    const last = job.client?.last_name ?? '';
    if (!first && !last) return t('profile.fallbackClient');
    return last ? `${first} ${last[0]}.` : first;
  })();

  const loadLabel = (() => {
    const cap = job.load_capacity;
    if (cap === 'moto') return t('dispatch.capMoto');
    if (cap === 'van_s') return t('dispatch.capVanS');
    if (cap === 'van_xl') return t('dispatch.capVanXl');
    if (cap === 'camion') return t('dispatch.capCamion');
    return cap ?? '';
  })();

  const adjust = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount((a) => Math.max(1, a + delta));
  };

  const placeBid = async () => {
    if (!session?.user?.id || alreadyBid || submitting) return;
    setSubmitting(true);
    try {
      const res = await authApiFetch('/api/bids/create', {
        method: 'POST',
        body: JSON.stringify({
          job_id: job.id,
          driver_id: session.user.id,
          amount,
          note: null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        if (res.status === 409 && payload?.error?.includes('Offre déjà envoyée')) {
          Alert.alert(
            t('jobSheet.alreadyBidTitle'),
            t('jobSheet.alreadyBidBody')
          );
        } else {
          throw new Error(payload?.error || "Impossible d'envoyer l'offre.");
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBidSuccess();
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <View className="bg-surface-elevated rounded-card border border-line shadow-card p-4">
        {/* Client + load capacity */}
        <Row className="items-center justify-between">
          <Row className="items-center gap-2">
            <View className="w-9 h-9 rounded-full bg-inverted items-center justify-center">
              <Text className="text-vanz-yellow text-xs font-black">
                {clientName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View className={isRtl ? 'items-end' : ''}>
              <Text className="text-content font-black text-sm tracking-tight">{clientName}</Text>
              {typeof job.client?.cached_rating === 'number' && (
                <Text className="text-content-secondary text-[11px] font-semibold">
                  ★ {job.client.cached_rating.toFixed(1)}
                </Text>
              )}
            </View>
          </Row>
          <View className="bg-surface-sunken border border-line px-2.5 py-1 rounded-lg flex-row items-center gap-1.5">
            <Truck size={12} color={c.textPrimary} strokeWidth={2.4} />
            <Text className="text-content text-[11px] font-black">{loadLabel}</Text>
          </View>
        </Row>

        {/* Route */}
        <View className="bg-surface rounded-2xl p-3 mt-3">
          <Row className="items-start">
            <View className="w-6 items-center mt-1">
              <View className="w-2.5 h-2.5 rounded-full bg-vanz-green border-2 border-white" />
              <View className="w-px h-6 bg-gray-300 my-1" />
              <View className="w-2.5 h-2.5 rounded-sm bg-vanz-yellow border-2 border-white" />
            </View>
            <View className={`flex-1 ml-2 mr-2 ${isRtl ? 'items-end' : ''}`}>
              <Text className={`text-content text-xs font-bold ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                {job.pickup_address}
              </Text>
              <View className="h-3.5" />
              <Text className={`text-content text-xs font-bold ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                {job.dropoff_address}
              </Text>
            </View>
          </Row>
        </View>

        {/* Description (if any) */}
        {job.description ? (
          <Row className="items-center mt-3 gap-1.5">
            <MapPin size={12} color={colors.muted} strokeWidth={2.2} />
            <Text className="text-content-secondary text-[11px] font-semibold flex-1" numberOfLines={1}>
              {job.description}
            </Text>
          </Row>
        ) : null}

        {/* Bid stepper + Place bid button */}
        <Row className="items-center gap-2 mt-4">
          <TouchableOpacity
            onPress={() => adjust(-5)}
            disabled={alreadyBid}
            className="w-10 h-12 rounded-xl bg-surface-sunken border border-line-strong items-center justify-center active:bg-surface-sunken"
          >
            <Minus size={16} color={c.textPrimary} strokeWidth={2.6} />
          </TouchableOpacity>
          <View className="flex-1 h-12 rounded-xl bg-surface border border-vanz-teal/30 flex-row items-center justify-center">
            <TextInput
              editable={!alreadyBid}
              keyboardType="numeric"
              value={String(amount)}
              onChangeText={(v) => {
                const n = parseInt(v.replace(/[^\d]/g, ''), 10);
                if (!isNaN(n)) setAmount(Math.max(1, n));
                else setAmount(0);
              }}
              className="text-content font-black text-lg text-center tabular-nums w-16 p-0"
            />
            <Text className="text-vanz-teal font-black text-xs ml-1">{t('common.currency')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => adjust(5)}
            disabled={alreadyBid}
            className="w-10 h-12 rounded-xl bg-surface-sunken border border-line-strong items-center justify-center active:bg-surface-sunken"
          >
            <Plus size={16} color={c.textPrimary} strokeWidth={2.6} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={placeBid}
            disabled={alreadyBid || submitting}
            className={`flex-2 h-12 rounded-xl items-center justify-center flex-row gap-1.5 px-4 ${
              alreadyBid ? 'bg-surface-sunken' : 'bg-inverted active:opacity-90'
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : alreadyBid ? (
              <>
                <Check size={14} color={c.textPrimary} strokeWidth={3} />
                <Text className="text-content font-black text-xs">{t('driver.alreadyBid')}</Text>
              </>
            ) : (
              <Text className="text-white font-black text-xs">{t('driver.placeBid')}</Text>
            )}
          </TouchableOpacity>
        </Row>
      </View>
    </Animated.View>
  );
}
