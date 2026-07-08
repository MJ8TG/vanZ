import { colors } from '@/theme/colors';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import * as Haptics from 'expo-haptics';
import { useTheme, type ThemeMode } from '@/theme/useTheme';
import { useThemeColors } from '@/theme/useThemeColors';
import PressableCard from '@/components/ui/PressableCard';
import Row from '@/components/ui/Row';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Globe, HelpCircle, FileText, Shield, Cookie, LogOut, ExternalLink,
  ChevronRight, ChevronLeft, Sun, Moon, Smartphone, Palette, type LucideIcon,
} from 'lucide-react-native';

const THEME_OPTIONS: { key: ThemeMode; Icon: LucideIcon; labelKey: string }[] = [
  { key: 'light', Icon: Sun, labelKey: 'settings.themeLight' },
  { key: 'dark', Icon: Moon, labelKey: 'settings.themeDark' },
  { key: 'system', Icon: Smartphone, labelKey: 'settings.themeSystem' },
];

interface Props {
  /** Route for the in-app Help Center (mode-specific). */
  helpHref: string;
}

// Defined at module scope (not inside the render) so React keeps a stable
// component identity and doesn't remount on every parent re-render.
function Section({ title, isRtl }: { title: string; isRtl: boolean }) {
  return (
    <Text className={`text-content-muted font-black text-xs uppercase tracking-wider mb-3 mt-6 ${isRtl ? 'text-right' : ''}`}>
      {title}
    </Text>
  );
}

export default function SettingsView({ helpHref }: Props) {
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const { t, locale, setLocale } = useI18n();
  const { mode, setMode } = useTheme();
  const c = useThemeColors();
  const isRtl = locale === 'ar';

  const meta = (session?.user?.user_metadata ?? {}) as { full_name?: string };
  const name = meta.full_name || t('settings.defaultUser');
  const email = session?.user?.email || '—';
  const phone = session?.user?.phone || '—';

  const openWeb = (path: string) => {
    const base = getApiBaseUrl();
    if (!base) {
      Alert.alert(t('settings.unavailableTitle'), t('settings.unavailableBody'));
      return;
    }
    Linking.openURL(`${base}/${locale}/${path}`).catch(() => {});
  };

  const handleLogout = () => {
    Alert.alert(
      t('client.logout'),
      t('settings.logoutConfirm'),
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

  const legal: { path: string; labelKey: string; Icon: LucideIcon }[] = [
    { path: 'conditions-utilisation', labelKey: 'settings.legalTerms', Icon: FileText },
    { path: 'politique-confidentialite', labelKey: 'settings.legalPrivacy', Icon: Shield },
    { path: 'cookies', labelKey: 'settings.legalCookies', Icon: Cookie },
  ];
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Account info */}
      <Section title={t('settings.sectionAccount')} isRtl={isRtl} />
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <View className="bg-surface-elevated rounded-2xl p-5 border border-line shadow-card">
          <Row className="justify-between py-2">
            <Text className="text-content-secondary font-semibold text-sm">{t('settings.name')}</Text>
            <Text className="text-content font-black text-sm">{name}</Text>
          </Row>
          <Row className="justify-between py-2 border-t border-line">
            <Text className="text-content-secondary font-semibold text-sm">Email</Text>
            <Text className="text-content font-black text-sm">{email}</Text>
          </Row>
          <Row className="justify-between py-2 border-t border-line">
            <Text className="text-content-secondary font-semibold text-sm">{t('driverForm.phone')}</Text>
            <Text className="text-content font-black text-sm">{phone}</Text>
          </Row>
        </View>
      </Animated.View>

      {/* Preferences */}
      <Section title={t('settings.sectionPrefs')} isRtl={isRtl} />
      <Animated.View entering={FadeInDown.delay(140).springify()}>
        {/* Appearance — light / dark / system */}
        <View className="bg-surface-elevated rounded-2xl p-4 border border-line shadow-card mb-3">
          <Row className={`items-center mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <View className="w-10 h-10 bg-surface-sunken rounded-xl items-center justify-center mx-4"><Palette size={18} color={colors.muted} strokeWidth={2.4} /></View>
            <Text className="text-content text-base font-extrabold">{t('settings.theme')}</Text>
          </Row>
          <Row className="gap-2">
            {THEME_OPTIONS.map(({ key, Icon, labelKey }) => {
              const active = mode === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMode(key);
                  }}
                  activeOpacity={0.85}
                  className={`flex-1 py-3 rounded-xl items-center border ${active ? 'bg-vanz-teal/10 border-vanz-teal' : 'bg-surface-sunken border-line'}`}
                >
                  <Icon size={18} color={active ? colors.teal : c.textMuted} strokeWidth={2.3} />
                  <Text className={`text-xs font-bold mt-1 ${active ? 'text-vanz-teal' : 'text-content-secondary'}`}>{t(labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </Row>
        </View>

        <PressableCard onPress={() => setLocale(locale === 'ar' ? 'fr' : 'ar')} className="p-4 rounded-2xl mb-3">
          <Row className="items-center justify-between">
            <Row className="items-center">
              <View className="w-10 h-10 bg-surface-sunken rounded-xl items-center justify-center mx-4"><Globe size={18} color={colors.muted} strokeWidth={2.4} /></View>
              <Text className="text-content text-base font-extrabold">{t('client.language')}</Text>
            </Row>
            <View className="bg-vanz-teal/10 px-3 py-1 rounded-lg"><Text className="text-vanz-teal font-black text-xs">{t('settings.currentLanguage')}</Text></View>
          </Row>
        </PressableCard>

        <PressableCard onPress={() => router.push(helpHref as Href)} className="p-4 rounded-2xl">
          <Row className="items-center justify-between">
            <Row className="items-center">
              <View className="w-10 h-10 bg-surface-sunken rounded-xl items-center justify-center mx-4"><HelpCircle size={18} color={colors.muted} strokeWidth={2.4} /></View>
              <Text className="text-content text-base font-extrabold">{t('settings.helpCenter')}</Text>
            </Row>
            <Chevron size={18} color={colors.slate} strokeWidth={2.4} />
          </Row>
        </PressableCard>
      </Animated.View>

      {/* Legal */}
      <Section title={t('settings.sectionLegal')} isRtl={isRtl} />
      <Animated.View entering={FadeInDown.delay(200).springify()} className="gap-3">
        {legal.map((l) => (
          <PressableCard key={l.path} onPress={() => openWeb(l.path)} className="p-4 rounded-2xl">
            <Row className="items-center justify-between">
              <Row className="items-center">
                <View className="w-10 h-10 bg-surface-sunken rounded-xl items-center justify-center mx-4"><l.Icon size={18} color={colors.muted} strokeWidth={2.4} /></View>
                <Text className="text-content text-base font-extrabold">{t(l.labelKey)}</Text>
              </Row>
              <ExternalLink size={16} color={colors.slate} strokeWidth={2.4} />
            </Row>
          </PressableCard>
        ))}
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInDown.delay(260).springify()}>
        <TouchableOpacity onPress={handleLogout}>
          <Row className="mt-8 p-4 items-center justify-center bg-danger/10 rounded-2xl border border-danger/30 active:bg-danger/15">
            <LogOut size={18} color="#EF4444" strokeWidth={2.4} />
            <Text className="text-danger font-extrabold text-base mx-2">{t('client.logout')}</Text>
          </Row>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}
