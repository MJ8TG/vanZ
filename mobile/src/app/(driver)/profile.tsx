import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, withRepeat, withTiming, useSharedValue, useAnimatedStyle, Easing } from 'react-native-reanimated';
import PressableCard from '@/components/ui/PressableCard';
import Row from '@/components/ui/Row';
import {
  Bell, Gift, Truck, TrendingUp, Lock, Globe, RefreshCw, LogOut, AlertTriangle,
  ChevronRight, ChevronLeft, type LucideIcon,
} from 'lucide-react-native';
import { useDriverApplication } from '@/modules/driver/hooks/useDriverApplication';
import { useEffect } from 'react';

function ProfileRow({ Icon, label, onPress, delay, isRtl }: {
  Icon: LucideIcon; label: string; onPress: () => void; delay: number; isRtl: boolean;
}) {
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <PressableCard onPress={onPress} className="p-4 rounded-2xl">
        <Row className="items-center justify-between">
          <Row className="items-center">
            <View className="w-10 h-10 bg-surface-sunken rounded-xl items-center justify-center mx-4">
              <Icon size={18} color={colors.muted} strokeWidth={2.4} />
            </View>
            <Text className="text-content text-base font-extrabold">{label}</Text>
          </Row>
          <Chevron size={18} color={colors.slate} strokeWidth={2.4} />
        </Row>
      </PressableCard>
    </Animated.View>
  );
}

export default function DriverProfileScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, logout } = useAuthStore();
  const { t, locale, setLocale } = useI18n();

  const handleLogout = () => {
    Alert.alert(
      t('client.logout'), 
      t('profile.logoutConfirm'), 
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('client.logout'),
          style: 'destructive',
          onPress: async () => {
            await datasql.auth.signOut();
            logout();
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const userPhone = session?.user?.phone || '+216 XX XXX XXX';
  const userName = session?.user?.user_metadata?.full_name || t('profile.fallbackDriver');
  const initial = userName[0]?.toUpperCase() || 'T';

  // Real verification status from the drivers table (same as web: drivers.status === 'approved').
  // Optimistic (true) until loaded to avoid the banner flashing on mount.
  const { data: driverApp } = useDriverApplication(session?.user?.id);
  const isVerified = driverApp ? driverApp.status === 'approved' : true;

  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value
  }));

  const isRtl = locale === 'ar';

  return (
    <View className="flex-1 bg-surface">
      {/* Profile Header */}
      <LinearGradient
        colors={[colors.navy, colors.navyLight, colors.navyMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pb-12 px-6 items-center rounded-b-[40px] shadow-glow-yellow relative z-10"
        style={{ paddingTop: Math.max(insets.top, 16) + 32 }}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center">
          <View className="w-28 h-28 bg-vanz-yellow/20 rounded-full items-center justify-center mb-4 border-2 border-white/10 relative">
            <View className="absolute inset-0 rounded-full bg-vanz-yellow/10 blur-xl" />
            <View className="w-24 h-24 bg-vanz-yellow rounded-full items-center justify-center shadow-glow-yellow border-4 border-vanz-navy">
              <Text className="text-content text-4xl font-black">{initial}</Text>
            </View>
          </View>
          <Text className="text-white text-2xl font-black">{userName}</Text>
          <View className="bg-white/10 px-4 py-1.5 rounded-full mt-2 border border-white/10">
            <Text className="text-white/80 text-sm font-bold tracking-widest">{userPhone}</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Profile Options List */}
      <ScrollView className="flex-1 px-5 pt-8" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {!isVerified && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <PressableCard 
                onPress={() => router.push('/(driver)/verify')}
                className="mb-4 overflow-hidden"
              >
                <Animated.View style={animatedPulseStyle} className="absolute inset-0 bg-vanz-yellow/5" />
                <Row className="p-4 rounded-2xl items-center border-2 border-vanz-yellow/30">
                  <View className="w-12 h-12 bg-vanz-yellow/10 rounded-xl items-center justify-center mr-4 ml-4">
                    <AlertTriangle size={22} color={colors.yellowDark} strokeWidth={2.2} />
                  </View>
                  <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                    <Text className={`text-content font-extrabold text-base mb-0.5 ${isRtl ? 'text-right' : ''}`}>
                      {t('profile.notVerifiedTitle')}
                    </Text>
                    <Text className={`text-content-secondary font-semibold text-xs ${isRtl ? 'text-right' : ''}`}>
                      {t('profile.notVerifiedBody')}
                    </Text>
                  </View>
                  {isRtl
                    ? <ChevronLeft size={20} color={colors.yellowDark} strokeWidth={2.6} />
                    : <ChevronRight size={20} color={colors.yellowDark} strokeWidth={2.6} />}
                </Row>
              </PressableCard>
            </Animated.View>
          )}

          <ProfileRow Icon={Bell} label={t('profile.notifications')} onPress={() => router.push('/(driver)/notifications' as Href)} delay={250} isRtl={isRtl} />
          <ProfileRow Icon={Gift} label={t('profile.referral')} onPress={() => router.push('/(driver)/referral' as Href)} delay={280} isRtl={isRtl} />
          <ProfileRow Icon={Truck} label={t('profile.vehicleInfo')} onPress={() => router.push('/(driver)/vehicle' as Href)} delay={300} isRtl={isRtl} />
          <ProfileRow Icon={TrendingUp} label={t('profile.myEarnings')} onPress={() => router.push('/(driver)/earnings' as Href)} delay={350} isRtl={isRtl} />
          <ProfileRow Icon={Lock} label={t('client.accountSettings')} onPress={() => router.push('/(driver)/settings' as Href)} delay={400} isRtl={isRtl} />

          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <PressableCard
              onPress={() => setLocale(locale === 'fr' ? 'ar' : 'fr')}
              className="p-4 rounded-2xl"
            >
              <Row className="items-center justify-between">
                <Row className="items-center">
                  <View className="w-10 h-10 bg-surface-sunken rounded-xl items-center justify-center mx-4">
                    <Globe size={18} color={colors.muted} strokeWidth={2.4} />
                  </View>
                  <Text className="text-content text-base font-extrabold">{t('client.language')}</Text>
                </Row>
                <View className="bg-inverted/5 px-3 py-1 rounded-lg">
                  <Text className="text-content-secondary font-black text-xs">
                    {locale === 'fr' ? 'Français' : 'العربية'}
                  </Text>
                </View>
              </Row>
            </PressableCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <PressableCard
              onPress={() => {
                useAuthStore.getState().setMode('client');
                router.replace('/(client)');
              }}
              className="mt-4 p-[2px] rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={[colors.teal, colors.tealDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute inset-0"
              />
              <Row className="bg-surface-elevated p-4 rounded-[14px] items-center justify-center">
                <RefreshCw size={18} color={c.textPrimary} strokeWidth={2.4} />
                <Text className="text-content font-black text-base mx-3">
                  {t('profile.switchToClient')}
                </Text>
              </Row>
            </PressableCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).springify()}>
            <TouchableOpacity onPress={handleLogout}>
              <Row className="mt-8 p-4 items-center justify-center bg-danger/10 rounded-2xl border border-danger/30 active:bg-danger/15">
                <LogOut size={18} color="#EF4444" strokeWidth={2.4} />
                <Text className="text-danger font-extrabold text-base mx-2">{t('client.logout')}</Text>
              </Row>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
