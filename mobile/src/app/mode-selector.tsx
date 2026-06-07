import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { datasql } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableCard from '@/components/ui/PressableCard';

export default function ModeSelectorScreen() {
  const router = useRouter();
  const { setMode } = useAuthStore();
  const { t } = useI18n();

  const handleSelectMode = async (mode: 'client' | 'driver') => {
    // Save to local store
    setMode(mode);
    
    // Save role to database
    try {
      const { data: { session } } = await datasql.auth.getSession();
      if (session?.user?.id) {
        await datasql.from('users').update({ role: mode }).eq('id', session.user.id);
      }
    } catch (e) {
      console.error('Failed to save role to DB', e);
    }

    // The AuthProvider in _layout.tsx will automatically redirect, but we can also push manually if needed.
    if (mode === 'client') router.replace('/(client)');
    else router.replace('/(driver)');
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
          source={require('../../assets/images/logo.png')} 
          className="w-40 h-12 mb-8" 
          resizeMode="contain" 
          style={{ tintColor: '#ffffff' }}
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
