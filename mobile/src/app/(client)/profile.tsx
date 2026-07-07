import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableCard from '@/components/ui/PressableCard';
import Row from '@/components/ui/Row';
import { useDirection } from '@/hooks/useDirection';
import {
  Wallet, Bell, MapPin, Gift, Lock, Globe, Truck, LogOut, ChevronRight, ChevronLeft,
  type LucideIcon,
} from 'lucide-react-native';

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

export default function ClientProfileScreen() {
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
  const userName = session?.user?.user_metadata?.full_name || t('profile.fallbackClient');
  const initial = userName[0]?.toUpperCase() || 'C';

  const isRtl = locale === 'ar';

  return (
    <View className="flex-1 bg-surface">
      {/* Profile Header */}
      <LinearGradient
        colors={[colors.navy, colors.navyLight, colors.navyMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pb-12 px-6 items-center rounded-b-[40px] shadow-glow-teal relative z-10"
        style={{ paddingTop: Math.max(insets.top, 16) + 32 }}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center">
          <View className="w-28 h-28 bg-vanz-teal/20 rounded-full items-center justify-center mb-4 border-2 border-white/10 relative">
            <View className="absolute inset-0 rounded-full bg-vanz-teal/10 blur-xl" />
            <View className="w-24 h-24 bg-vanz-teal rounded-full items-center justify-center shadow-glow-teal border-4 border-vanz-navy">
              <Text className="text-white text-4xl font-black">{initial}</Text>
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
          <ProfileRow Icon={Wallet} label={t('profile.wallet')} onPress={() => router.push('/(client)/wallet' as Href)} delay={140} isRtl={isRtl} />
          <ProfileRow Icon={Bell} label={t('profile.notifications')} onPress={() => router.push('/(client)/notifications' as Href)} delay={150} isRtl={isRtl} />
          <ProfileRow Icon={MapPin} label={t('profile.myAddresses')} onPress={() => router.push('/(client)/addresses' as Href)} delay={180} isRtl={isRtl} />
          <ProfileRow Icon={Gift} label={t('profile.referral')} onPress={() => router.push('/(client)/referral' as Href)} delay={190} isRtl={isRtl} />
          <ProfileRow Icon={Lock} label={t('client.accountSettings')} onPress={() => router.push('/(client)/settings' as Href)} delay={200} isRtl={isRtl} />

          <Animated.View entering={FadeInDown.delay(300).springify()}>
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
                <View className="bg-vanz-teal/10 px-3 py-1 rounded-lg">
                  <Text className="text-vanz-teal font-black text-xs">
                    {locale === 'fr' ? 'Français' : 'العربية'}
                  </Text>
                </View>
              </Row>
            </PressableCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <PressableCard
              onPress={() => router.push('/(client)/become-driver' as Href)}
              className="mt-4 p-[2px] rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={[colors.yellow, colors.yellowDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute inset-0"
              />
              <Row className="bg-surface-elevated p-4 rounded-[14px] items-center justify-center">
                <Truck size={20} color={c.textPrimary} strokeWidth={2.4} />
                <Text className="text-content font-black text-base mx-3">
                  {t('client.becomeDriver')}
                </Text>
              </Row>
            </PressableCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <TouchableOpacity onPress={handleLogout}>
              <Row className="mt-8 p-4 items-center justify-center bg-red-50 rounded-2xl border border-red-100 active:bg-red-100">
                <LogOut size={18} color="#EF4444" strokeWidth={2.4} />
                <Text className="text-red-500 font-extrabold text-base mx-2">{t('client.logout')}</Text>
              </Row>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
