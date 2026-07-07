import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { View, TouchableOpacity, Text, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import type MapView from 'react-native-maps';
import { useI18n } from '@/i18n';
import type { PlaceSelection, ServiceType, LoadCapacity } from '@/types/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import VanzLogo from '@/components/ui/VanzLogo';
import Row from '@/components/ui/Row';
import AddressSearchSheet from '@/components/booking/AddressSearchSheet';
import { useHomeData } from '@/modules/booking/hooks/useHomeData';
import type { SavedAddress } from '@/modules/booking/services/bookingService';
import { useAuthStore } from '@/store/useAuthStore';
import { datasql } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Check,
  Truck,
  Sofa,
  Boxes,
  Zap,
  Building2,
  Navigation2,
  ArrowRight,
  Search,
  MapPin,
  Clock,
  Shield,
  Plus,
  Star,
  type LucideIcon,
} from 'lucide-react-native';

type ServiceOption = {
  key: ServiceType;
  Icon: LucideIcon;
  accent: 'teal' | 'yellow' | 'indigo' | 'purple' | 'navy' | 'green';
  descKey: string;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  { key: 'moving',    Icon: Truck,       accent: 'teal',   descKey: 'home.svcMovingDesc' },
  { key: 'furniture', Icon: Sofa,        accent: 'yellow', descKey: 'home.svcFurnitureDesc' },
  { key: 'parcel',    Icon: Boxes,       accent: 'indigo', descKey: 'home.svcParcelDesc' },
  { key: 'express',   Icon: Zap,         accent: 'purple', descKey: 'home.svcExpressDesc' },
  { key: 'office',    Icon: Building2,   accent: 'navy',   descKey: 'home.svcOfficeDesc' },
  { key: 'intercity', Icon: Navigation2, accent: 'green',  descKey: 'home.svcIntercityDesc' },
];

const ACCENT_COLOR: Record<ServiceOption['accent'], string> = {
  teal: colors.teal,
  yellow: colors.yellow,
  indigo: '#2F5FE0',
  purple: '#8B34E8',
  navy: colors.navy,
  green: colors.green,
};

export default function ClientHomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { session } = useAuthStore();
  const c = useThemeColors();

  const [pickup, setPickup] = useState<PlaceSelection | null>(null);
  const [dropoff, setDropoff] = useState<PlaceSelection | null>(null);
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | 'mapPreview' | null>(null);

  const [serviceType, setServiceType] = useState<ServiceType>('moving');
  // Kept (defaulted) so the publish payload stays complete — these are collected
  // on the details step, not on the prototype's compose-first home.
  const [vehicle] = useState<LoadCapacity>('van_s');
  const [description] = useState('');
  const [timeSlot] = useState<'matin' | 'après-midi' | 'soir'>('matin');
  const [scheduled, setScheduled] = useState(false);
  const [insured, setInsured] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const { data: home } = useHomeData(session?.user?.id);
  const savedAddresses = home?.savedAddresses ?? [];
  const favDrivers = home?.favDrivers ?? [];

  const isRtl = locale === 'ar';
  // Saved addresses rendered as predefined rows so the search screen is never an
  // empty void — these show instantly with no Places API call (and survive an
  // unconfigured/over-quota key).
  const savedPredefined = savedAddresses
    .filter((a) => a.lat != null && a.lng != null)
    .map((a) => ({
      description: a.address,
      label: a.label,
      geometry: { location: { lat: Number(a.lat), lng: Number(a.lng) } },
    }));
  const meta = session?.user?.user_metadata ?? {};
  const firstName =
    (meta.first_name as string | undefined)?.trim() ||
    ((meta.full_name as string | undefined)?.trim().split(/\s+/)[0]) ||
    '';

  const handlePlaceSelect = (
    data: { description: string },
    details: { geometry: { location: { lat: number; lng: number } } } | null
  ) => {
    if (!details) return;
    const location = {
      description: data.description,
      lat: details.geometry.location.lat,
      lng: details.geometry.location.lng,
    };
    if (activeInput === 'pickup') setPickup(location);
    if (activeInput === 'dropoff') setDropoff(location);

    setActiveInput('mapPreview');
    setTimeout(() => {
      mapRef.current?.animateToRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }, 100);
  };

  const applySaved = (a: SavedAddress) => {
    Haptics.selectionAsync();
    const sel: PlaceSelection = { description: a.address, lat: Number(a.lat), lng: Number(a.lng) };
    if (!pickup) setPickup(sel);
    else setDropoff(sel);
  };

  const handlePublish = async () => {
    if (!session?.user?.id || !pickup || !dropoff) {
      Alert.alert(t('common.error'), t('auth.fillRequiredFieldsError'));
      return;
    }
    setIsPublishing(true);
    try {
      const scheduledDate = scheduled ? new Date(Date.now() + 86400000) : new Date();
      const { data, error } = await datasql
        .from('jobs')
        .insert({
          client_id: session.user.id,
          service_type: serviceType,
          pickup_address: pickup.description,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_address: dropoff.description,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          load_capacity: vehicle,
          description,
          scheduled_at: scheduledDate.toISOString(),
          time_slot: timeSlot,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/(client)/job/${data.id}`);
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setIsPublishing(false);
    }
  };

  const routeReady = !!pickup && !!dropoff;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-surface">
      {/* HEADER */}
      <View style={{ paddingTop: Math.max(insets.top, 16) }} className="px-5 pb-1 bg-surface">
        <Animated.View entering={FadeInDown.delay(40).springify()} className={`flex-row items-center justify-between mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <VanzLogo size={30} />
          <TouchableOpacity
            onPress={() => router.push('/(client)/notifications')}
            className="w-11 h-11 rounded-2xl bg-surface-elevated border border-line items-center justify-center shadow-sm active:bg-surface-sunken"
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color={c.textPrimary} strokeWidth={2.1} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).springify()} className="mt-4">
          <Text className={`text-sm text-content-secondary font-semibold ${isRtl ? 'text-right' : ''}`}>
            {t('home.greeting')}{firstName ? `, ${firstName}` : ''} 👋
          </Text>
          <Text className={`text-content text-[26px] font-black mt-1 leading-tight tracking-tight ${isRtl ? 'text-right' : ''}`}>
            {t('home.headline')}
          </Text>
        </Animated.View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 + Math.max(insets.bottom, 12) + 128 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ROUTE CARD */}
        <Animated.View entering={FadeInDown.delay(140).springify()} className="px-5 mt-4">
          <View className="bg-surface-elevated rounded-card shadow-card border border-line px-1.5 py-1">
            <TouchableOpacity onPress={() => setActiveInput('pickup')} className={`flex-row items-center px-2.5 py-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className="w-2.5 h-2.5 rounded-full bg-vanz-green" style={{ shadowColor: colors.green, shadowOpacity: 0.4, shadowRadius: 4 }} />
              <View className={`flex-1 mx-3 ${isRtl ? 'items-end' : ''}`}>
                <Text className="text-content-muted font-bold text-[10px] uppercase tracking-[0.08em]">{t('home.departure')}</Text>
                <Text className={`text-sm mt-0.5 ${pickup ? 'text-content font-bold' : 'text-content-muted font-semibold'} ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                  {pickup ? pickup.description : t('createJob.pickupLabel')}
                </Text>
              </View>
              <Search size={16} color={c.textMuted} strokeWidth={2.2} />
            </TouchableOpacity>

            <View className={`h-px bg-surface-sunken ${isRtl ? 'mr-9' : 'ml-9'}`} />

            <TouchableOpacity onPress={() => setActiveInput('dropoff')} className={`flex-row items-center px-2.5 py-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <MapPin size={14} color={colors.yellowDark} strokeWidth={2.4} />
              <View className={`flex-1 mx-3 ${isRtl ? 'items-end' : ''}`}>
                <Text className="text-content-muted font-bold text-[10px] uppercase tracking-[0.08em]">{t('home.arrival')}</Text>
                <Text className={`text-sm mt-0.5 ${dropoff ? 'text-content font-bold' : 'text-content-muted font-semibold'} ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                  {dropoff ? dropoff.description : t('createJob.dropoffLabel')}
                </Text>
              </View>
              <Search size={16} color={c.textMuted} strokeWidth={2.2} />
            </TouchableOpacity>

            {savedAddresses.length > 0 && (
              <Row className="gap-2 px-2 pb-2 pt-1">
                {savedAddresses.map((a) => (
                  <TouchableOpacity key={a.id} onPress={() => applySaved(a)} className="flex-1 bg-surface rounded-xl px-2.5 py-2 border border-line active:bg-surface-sunken">
                    <Text className="text-content font-bold text-xs" numberOfLines={1}>{a.label}</Text>
                    <Text className="text-content-muted font-semibold text-[10px] mt-0.5" numberOfLines={1}>{a.address}</Text>
                  </TouchableOpacity>
                ))}
              </Row>
            )}
          </View>
        </Animated.View>

        {/* 01 — SERVICES */}
        <View className="px-5 mt-7">
          <Row className="items-center gap-2 mb-3">
            <Text className="text-vanz-teal-dark font-black text-xs tabular-nums">01</Text>
            <Text className={`text-content font-black text-[17px] tracking-tight ${isRtl ? 'text-right' : ''}`}>{t('home.whatService')}</Text>
          </Row>
          <View className="flex-row flex-wrap justify-between gap-y-2.5">
            {SERVICE_OPTIONS.map((opt, i) => {
              const sel = serviceType === opt.key;
              const accentHex = ACCENT_COLOR[opt.accent];
              const label = ({
                parcel: t('createJob.svcParcel'), furniture: t('createJob.svcFurniture'),
                moving: t('createJob.svcMoving'), express: t('createJob.svcExpress'),
                office: t('createJob.svcOffice'), intercity: t('createJob.svcIntercity'),
              } as Record<ServiceType, string>)[opt.key];
              const Icon = opt.Icon;
              return (
                <Animated.View key={opt.key} entering={FadeInDown.delay(170 + i * 50).springify()} className="w-[48.5%]">
                  <TouchableOpacity
                    onPress={() => { setServiceType(opt.key); Haptics.selectionAsync(); }}
                    activeOpacity={0.85}
                    className={`px-4 py-3.5 rounded-[18px] border-[1.5px] ${sel ? 'border-vanz-teal bg-vanz-teal/[0.08]' : 'border-line bg-surface-elevated'}`}
                  >
                    <Row className="items-start justify-between" style={{ minHeight: 26 }}>
                      <Icon size={24} color={accentHex} strokeWidth={2.1} />
                      {sel && (
                        <View className="w-5.5 h-5.5 rounded-full bg-vanz-teal items-center justify-center" style={{ width: 22, height: 22 }}>
                          <Check size={13} color="#ffffff" strokeWidth={3} />
                        </View>
                      )}
                    </Row>
                    <Text className={`text-content text-[14.5px] font-extrabold mt-3 tracking-tight ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>{label}</Text>
                    <Text className={`text-[11.5px] text-content-secondary font-semibold mt-0.5 ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>{t(opt.descKey)}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* OPTIONS CHIPS */}
        <Animated.View entering={FadeInDown.delay(360).springify()} className="px-5 mt-4">
          <Row className="flex-wrap gap-2">
            <Chip Icon={Zap} label={t('home.optNow')} active={!scheduled} onPress={() => setScheduled(false)} isRtl={isRtl} />
            <Chip Icon={Clock} label={t('home.optSchedule')} active={scheduled} onPress={() => setScheduled(true)} isRtl={isRtl} />
            <Chip Icon={Shield} label={t('home.optInsure')} active={insured} onPress={() => setInsured((v) => !v)} isRtl={isRtl} />
            <Chip Icon={Plus} label={t('home.optAddStop')} active={false} onPress={() => Alert.alert('VanZ', t('home.soon'))} isRtl={isRtl} />
          </Row>
        </Animated.View>

        {/* 02 — TRUSTED DRIVERS */}
        {favDrivers.length > 0 && (
          <View className="mt-7">
            <View className="px-5">
              <Row className="items-center gap-2 mb-1">
                <Text className="text-vanz-teal-dark font-black text-xs tabular-nums">02</Text>
                <Text className={`text-content font-black text-[17px] tracking-tight ${isRtl ? 'text-right' : ''}`}>{t('home.trustedDrivers')}</Text>
              </Row>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
              {favDrivers.map((d) => (
                <View key={d.driver_id} style={{ width: 134 }} className="bg-surface-elevated border border-line rounded-2xl p-3">
                  <View className="flex-row items-center justify-between">
                    <View className="w-9 h-9 rounded-xl bg-inverted items-center justify-center">
                      <Text className="text-vanz-yellow font-black text-[11px]">{d.initials}</Text>
                    </View>
                    <Star size={13} color={colors.yellow} fill={colors.yellow} />
                  </View>
                  <Text className="text-content font-extrabold text-[13px] mt-2 tracking-tight" numberOfLines={1}>{d.name || t('home.fallbackDriverName')}</Text>
                  {d.vehicle ? <Text className="text-content-muted text-[11px] font-semibold mt-0.5" numberOfLines={1}>{d.vehicle}</Text> : null}
                  {d.rating != null && (
                    <View className="flex-row items-center gap-1 mt-1.5">
                      <Star size={11} color={colors.yellow} fill={colors.yellow} />
                      <Text className="text-content font-bold text-[11px] tabular-nums">{d.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* STICKY CTA */}
      <View className="absolute left-0 right-0 px-5 py-3 bg-surface/95" style={{ bottom: 60 + Math.max(insets.bottom, 12) }}>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={isPublishing || !routeReady}
          className={`w-full h-16 rounded-2xl overflow-hidden active:opacity-90 ${!routeReady ? 'opacity-50' : 'shadow-glow-yellow'}`}
        >
          <LinearGradient colors={[colors.yellow, colors.yellowDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }}>
            {isPublishing ? (
              <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.navy} /></View>
            ) : (
              <Row className="flex-1 items-center justify-between px-5">
                <Text className="text-content text-lg font-black tracking-tight">{t('home.publishJob')}</Text>
                <Row className="items-center gap-2">
                  <Text className="text-content-secondary text-xs font-bold tabular-nums">{t('home.priceHint')}</Text>
                  <ArrowRight size={20} color={colors.navy} strokeWidth={2.6} />
                </Row>
              </Row>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddressSearchSheet
        activeInput={activeInput}
        onClose={() => setActiveInput(null)}
        pickup={pickup}
        dropoff={dropoff}
        savedPredefined={savedPredefined}
        onPlaceSelect={handlePlaceSelect}
        mapRef={mapRef}
      />
    </KeyboardAvoidingView>
  );
}

function Chip({ Icon, label, active, onPress, isRtl }: { Icon: LucideIcon; label: string; active: boolean; onPress: () => void; isRtl: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-1 px-3 py-2 rounded-full border ${active ? 'bg-inverted border-vanz-navy' : 'bg-surface-elevated border-line'} ${isRtl ? 'flex-row-reverse' : ''}`}
    >
      <Icon size={13} color={active ? colors.yellow : colors.muted} strokeWidth={2.4} />
      <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-content-secondary'}`}>{label}</Text>
    </TouchableOpacity>
  );
}
