import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableCard from '@/components/ui/PressableCard';
import { useEffect } from 'react';

export default function ModeSelectorScreen() {
  const router = useRouter();
  const { setMode, session, mode: currentMode } = useAuthStore();
  const { t } = useI18n();

  useEffect(() => {
    if (session) {
      router.replace(currentMode === 'driver' ? '/(driver)' : '/(client)');
    }
  }, [session, currentMode, router]);

  const handleSelectMode = (mode: 'client' | 'driver') => {
    setMode(mode);
    router.push('/auth/register');
  };

  return (
    <LinearGradient
      colors={['#0B1021', '#131B36', '#1A2444']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center p-6"
    >
      <View className="absolute inset-0 bg-vanz-teal/5" />
      
      <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-12 items-center">
        <Image
          source={require('../../assets/images/logo-mark.png')}
          accessibilityLabel="VanZ"
          className="w-36 h-20 mb-8"
          resizeMode="contain"
        />
        <Text className="text-white text-3xl font-black mb-3 text-center tracking-tight">
          {t('modeSelector.title')}
        </Text>
        <Text className="text-white/70 text-center text-lg font-medium leading-relaxed px-4">
          {t('modeSelector.subtitle')}
        </Text>
      </Animated.View>

      <View className="w-full gap-6">
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <PressableCard 
            onPress={() => handleSelectMode('client')}
            className="w-full bg-white/10 border-2 border-white/20 p-6 shadow-glow-teal"
            pressScale={0.95}
          >
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-vanz-teal/20 items-center justify-center mr-5 border-2 border-vanz-teal/30">
                <Text className="text-3xl">📦</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-extrabold mb-1">{t('modeSelector.clientTitle')}</Text>
                <Text className="text-white/70 text-sm font-medium">
                  {t('modeSelector.clientDesc')}
                </Text>
              </View>
            </View>
          </PressableCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <PressableCard 
            onPress={() => handleSelectMode('driver')}
            className="w-full bg-white/10 border-2 border-white/20 p-6 shadow-glow-yellow"
            pressScale={0.95}
          >
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-vanz-yellow/20 items-center justify-center mr-5 border-2 border-vanz-yellow/30">
                <Text className="text-3xl">🚛</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-extrabold mb-1">{t('modeSelector.driverTitle')}</Text>
                <Text className="text-white/70 text-sm font-medium">
                  {t('modeSelector.driverDesc')}
                </Text>
              </View>
            </View>
          </PressableCard>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
