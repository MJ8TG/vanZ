import { colors } from '@/theme/colors';
import { View, Text, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation,
  FadeInDown,
  FadeIn,
  SharedValue,
  withSpring
} from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { ForceLight } from '@/theme/ThemedRoot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, Truck, Handshake, type LucideIcon } from 'lucide-react-native';
import PremiumButton from '@/components/ui/PremiumButton';

const Dot = ({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const widthAnimation = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [10, 24, 10],
      Extrapolation.CLAMP
    );
    const opacityAnimation = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );
    return {
      width: withSpring(widthAnimation, { damping: 12, stiffness: 150 }),
      opacity: opacityAnimation,
    };
  });

  return (
    <Animated.View
      style={[animatedDotStyle]}
      className="h-2.5 rounded-full bg-vanz-teal"
    />
  );
};

const slides: Array<{
  id: string; titleKey: string; descKey: string; Icon: LucideIcon; color: string; glow: string;
}> = [
  {
    id: '1',
    titleKey: 'welcome.slides.1.title',
    descKey: 'welcome.slides.1.desc',
    Icon: Package,
    color: 'bg-vanz-teal',
    glow: 'shadow-glow-teal'
  },
  {
    id: '2',
    titleKey: 'welcome.slides.2.title',
    descKey: 'welcome.slides.2.desc',
    Icon: Truck,
    color: 'bg-vanz-yellow',
    glow: 'shadow-glow-yellow'
  },
  {
    id: '3',
    titleKey: 'welcome.slides.3.title',
    descKey: 'welcome.slides.3.desc',
    Icon: Handshake,
    color: 'bg-vanz-green',
    glow: 'shadow-glow-green'
  }
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useI18n();
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // Mutating a Reanimated shared value inside a worklet is the intended API.
      // eslint-disable-next-line react-hooks/immutability
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderItem = ({ item, index }: { item: typeof slides[0], index: number }) => {
    return (
      <View style={{ width }} className="items-center justify-center px-8 py-4">
        <Animated.View
          entering={FadeInDown.delay(index * 100).springify()}
          className={`w-36 h-36 rounded-full ${item.color} items-center justify-center mb-8 ${item.glow}`}
        >
          <View className="w-28 h-28 rounded-full bg-white/20 items-center justify-center border-4 border-white/30">
            <item.Icon color="#fff" size={48} strokeWidth={2} />
          </View>
        </Animated.View>
        
        <Animated.Text 
          entering={FadeIn.delay(300)}
          className="text-content text-3xl font-extrabold mb-4 text-center"
        >
          {t(item.titleKey)}
        </Animated.Text>
        
        <Animated.Text 
          entering={FadeIn.delay(400)}
          className="text-content-secondary text-center text-lg font-medium leading-relaxed px-2"
        >
          {t(item.descKey)}
        </Animated.Text>
      </View>
    );
  };

  return (
    <ForceLight>
    <View className="flex-1 bg-surface">
      {/* Header Logo with Gradient */}
      <LinearGradient
        colors={[colors.navy, colors.navyLight, 'transparent']}
        className="pb-16 items-center absolute top-0 w-full z-10"
        style={{ paddingTop: Math.max(insets.top, 16) + 24 }}
      >
        <Image
          source={require('../../assets/images/logo-mark.png')}
          accessibilityLabel="VanZ"
          className="w-44 h-20"
          resizeMode="contain"
        />
      </LinearGradient>

      {/* Carousel — takes all remaining vertical space */}
      <View className="flex-1" style={{ marginTop: Math.max(insets.top, 16) + 64 }}>
        <Animated.FlatList
          data={slides}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      </View>

      {/* Footer & Controls with Glass Effect — content-sized so it never clips on small screens */}
      <View className="px-8 pb-10 gap-5 bg-card-glass border-t border-white/50 shadow-elevated">

        {/* Pagination Indicators */}
        <View className="flex-row justify-center gap-2 pt-5">
          {slides.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} width={width} />
          ))}
        </View>

        {/* Action Buttons */}
        <Animated.View entering={FadeIn.delay(500)} className="w-full gap-4">
          <PremiumButton
            title={t('welcome.start')}
            variant="primary"
            onPress={() => router.push('/mode-selector')}
          />

          <PremiumButton
            title={t('auth.loginButton')}
            variant="secondary"
            onPress={() => router.push('/auth/login')}
          />

          <TouchableOpacity
            onPress={() => setLocale(locale === 'fr' ? 'ar' : 'fr')}
            className="mt-2 items-center pb-2"
          >
            <Text className="text-content-secondary font-bold">{t('welcome.switchLang')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
    </ForceLight>
  );
}
