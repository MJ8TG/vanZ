import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, withRepeat, withTiming, useSharedValue, useAnimatedStyle, Easing } from 'react-native-reanimated';
import PressableCard from '@/components/ui/PressableCard';
import { useEffect } from 'react';

export default function DriverProfileScreen() {
  const router = useRouter();
  const { session, logout } = useAuthStore();
  const { t, locale, setLocale } = useI18n();

  const handleLogout = () => {
    Alert.alert(
      t('client.logout'), 
      locale === 'ar' ? 'هل أنت متأكد أنك تريد تسجيل الخروج؟' : 'Êtes-vous sûr de vouloir vous déconnecter ?', 
      [
        { text: locale === 'ar' ? 'إلغاء' : 'Annuler', style: 'cancel' },
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
  const userName = session?.user?.user_metadata?.full_name || (locale === 'ar' ? 'ناقل' : 'Transporteur');
  const initial = userName[0]?.toUpperCase() || 'T';
  const isVerified = false; // Mock

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
    <View className="flex-1 bg-vanz-iceblue">
      {/* Profile Header */}
      <LinearGradient
        colors={['#0B1021', '#131B36', '#1A2444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-20 pb-12 px-6 items-center rounded-b-[40px] shadow-glow-yellow relative z-10"
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center">
          <View className="w-28 h-28 bg-vanz-yellow/20 rounded-full items-center justify-center mb-4 border-2 border-white/10 relative">
            <View className="absolute inset-0 rounded-full bg-vanz-yellow/10 blur-xl" />
            <View className="w-24 h-24 bg-vanz-yellow rounded-full items-center justify-center shadow-glow-yellow border-4 border-vanz-navy">
              <Text className="text-vanz-navy text-4xl font-black">{initial}</Text>
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
                <View className={`p-4 rounded-2xl flex-row items-center border-2 border-vanz-yellow/30 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className="w-12 h-12 bg-vanz-yellow/10 rounded-xl items-center justify-center mr-4 ml-4">
                    <Text className="text-2xl">⚠️</Text>
                  </View>
                  <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                    <Text className={`text-vanz-navy font-extrabold text-base mb-0.5 ${isRtl ? 'text-right' : ''}`}>
                      {locale === 'ar' ? 'حسابك غير مفعل' : 'Compte non vérifié'}
                    </Text>
                    <Text className={`text-vanz-navy/60 font-semibold text-xs ${isRtl ? 'text-right' : ''}`}>
                      {locale === 'ar' ? 'اضغط هنا لتقديم مستنداتك.' : 'Appuyez pour soumettre vos documents.'}
                    </Text>
                  </View>
                  <Text className="text-vanz-yellow font-bold text-lg">{isRtl ? '←' : '→'}</Text>
                </View>
              </PressableCard>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <PressableCard className={`p-4 rounded-2xl flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 ml-4">
                  <Text className="text-lg">🚚</Text>
                </View>
                <Text className="text-vanz-navy text-base font-extrabold">
                  {locale === 'ar' ? 'معلومات المركبة' : 'Mon Véhicule'}
                </Text>
              </View>
              <Text className="text-gray-300 font-bold text-lg">{isRtl ? '←' : '→'}</Text>
            </PressableCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <PressableCard className={`p-4 rounded-2xl flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 ml-4">
                  <Text className="text-lg">🔐</Text>
                </View>
                <Text className="text-vanz-navy text-base font-extrabold">{t('client.accountSettings')}</Text>
              </View>
              <Text className="text-gray-300 font-bold text-lg">{isRtl ? '←' : '→'}</Text>
            </PressableCard>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <PressableCard 
              onPress={() => setLocale(locale === 'fr' ? 'ar' : 'fr')}
              className={`p-4 rounded-2xl flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <View className={`flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 ml-4">
                  <Text className="text-lg">🌐</Text>
                </View>
                <Text className="text-vanz-navy text-base font-extrabold">{t('client.language')}</Text>
              </View>
              <View className="bg-vanz-navy/5 px-3 py-1 rounded-lg">
                <Text className="text-vanz-navy/70 font-black text-xs">
                  {locale === 'fr' ? 'Français' : 'العربية'}
                </Text>
              </View>
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
                colors={['#38B6FF', '#2196D6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute inset-0"
              />
              <View className={`bg-white p-4 rounded-[14px] flex-row items-center justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Text className="text-xl mr-3 ml-3">🔄</Text>
                <Text className="text-vanz-navy font-black text-base">
                  {locale === 'ar' ? 'التبديل إلى عميل' : 'Passer en mode Client'}
                </Text>
              </View>
            </PressableCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).springify()}>
            <TouchableOpacity onPress={handleLogout} className="mt-8 p-4 items-center flex-row justify-center bg-red-50 rounded-2xl border border-red-100 active:bg-red-100">
              <Text className="text-red-500 text-lg mr-2">🚪</Text>
              <Text className="text-red-500 font-extrabold text-base">{t('client.logout')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
