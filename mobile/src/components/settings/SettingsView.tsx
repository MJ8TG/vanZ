import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import PressableCard from '@/components/ui/PressableCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  /** Route for the in-app Help Center (mode-specific). */
  helpHref: string;
}

// Defined at module scope (not inside the render) so React keeps a stable
// component identity and doesn't remount on every parent re-render.
function Section({ title, isRtl }: { title: string; isRtl: boolean }) {
  return (
    <Text className={`text-vanz-navy/40 font-black text-xs uppercase tracking-wider mb-3 mt-6 ${isRtl ? 'text-right' : ''}`}>
      {title}
    </Text>
  );
}

export default function SettingsView({ helpHref }: Props) {
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const { locale, setLocale } = useI18n();
  const ar = locale === 'ar';
  const isRtl = ar;

  const meta = (session?.user?.user_metadata ?? {}) as { full_name?: string };
  const name = meta.full_name || (ar ? 'مستخدم' : 'Utilisateur');
  const email = session?.user?.email || '—';
  const phone = session?.user?.phone || '—';

  const openWeb = (path: string) => {
    const base = getApiBaseUrl();
    if (!base) {
      Alert.alert(ar ? 'غير متاح' : 'Indisponible', ar ? 'تعذر فتح الصفحة.' : "Impossible d'ouvrir la page.");
      return;
    }
    Linking.openURL(`${base}/${locale}/${path}`).catch(() => {});
  };

  const handleLogout = () => {
    Alert.alert(
      ar ? 'تسجيل الخروج' : 'Déconnexion',
      ar ? 'هل أنت متأكد؟' : 'Êtes-vous sûr ?',
      [
        { text: ar ? 'إلغاء' : 'Annuler', style: 'cancel' },
        {
          text: ar ? 'تسجيل الخروج' : 'Déconnexion',
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

  const legal = [
    { path: 'conditions-utilisation', fr: "Conditions d'utilisation", ar: 'شروط الاستخدام', icon: '📜' },
    { path: 'politique-confidentialite', fr: 'Confidentialité', ar: 'الخصوصية', icon: '🔒' },
    { path: 'cookies', fr: 'Cookies', ar: 'ملفات الارتباط', icon: '🍪' },
  ];

  return (
    <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Account info */}
      <Section title={ar ? 'الحساب' : 'Compte'} isRtl={isRtl} />
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
          <View className={`flex-row justify-between py-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Text className="text-vanz-navy/50 font-semibold text-sm">{ar ? 'الاسم' : 'Nom'}</Text>
            <Text className="text-vanz-navy font-black text-sm">{name}</Text>
          </View>
          <View className={`flex-row justify-between py-2 border-t border-gray-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Text className="text-vanz-navy/50 font-semibold text-sm">Email</Text>
            <Text className="text-vanz-navy font-black text-sm">{email}</Text>
          </View>
          <View className={`flex-row justify-between py-2 border-t border-gray-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Text className="text-vanz-navy/50 font-semibold text-sm">{ar ? 'الهاتف' : 'Téléphone'}</Text>
            <Text className="text-vanz-navy font-black text-sm">{phone}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Preferences */}
      <Section title={ar ? 'التفضيلات' : 'Préférences'} isRtl={isRtl} />
      <Animated.View entering={FadeInDown.delay(140).springify()}>
        <PressableCard onPress={() => setLocale(ar ? 'fr' : 'ar')} className={`p-4 rounded-2xl flex-row items-center justify-between mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 ml-4"><Text className="text-lg">🌐</Text></View>
            <Text className="text-vanz-navy text-base font-extrabold">{ar ? 'اللغة' : 'Langue'}</Text>
          </View>
          <View className="bg-vanz-teal/10 px-3 py-1 rounded-lg"><Text className="text-vanz-teal font-black text-xs">{ar ? 'العربية' : 'Français'}</Text></View>
        </PressableCard>

        <PressableCard onPress={() => router.push(helpHref as Href)} className={`p-4 rounded-2xl flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 ml-4"><Text className="text-lg">❓</Text></View>
            <Text className="text-vanz-navy text-base font-extrabold">{ar ? 'مركز المساعدة' : "Centre d'aide"}</Text>
          </View>
          <Text className="text-gray-300 font-bold text-lg">{isRtl ? '←' : '→'}</Text>
        </PressableCard>
      </Animated.View>

      {/* Legal */}
      <Section title={ar ? 'قانوني' : 'Légal'} isRtl={isRtl} />
      <Animated.View entering={FadeInDown.delay(200).springify()} className="gap-3">
        {legal.map((l) => (
          <PressableCard key={l.path} onPress={() => openWeb(l.path)} className={`p-4 rounded-2xl flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
            <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 ml-4"><Text className="text-lg">{l.icon}</Text></View>
              <Text className="text-vanz-navy text-base font-extrabold">{ar ? l.ar : l.fr}</Text>
            </View>
            <Text className="text-gray-300 font-bold text-lg">↗</Text>
          </PressableCard>
        ))}
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInDown.delay(260).springify()}>
        <TouchableOpacity onPress={handleLogout} className="mt-8 p-4 items-center flex-row justify-center bg-red-50 rounded-2xl border border-red-100 active:bg-red-100">
          <Text className="text-red-500 text-lg mr-2 ml-2">🚪</Text>
          <Text className="text-red-500 font-extrabold text-base">{ar ? 'تسجيل الخروج' : 'Déconnexion'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}
