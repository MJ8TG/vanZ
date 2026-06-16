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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const slides = [
  {
    id: '1',
    titleKey: 'welcome.slides.1.title',
    descKey: 'welcome.slides.1.desc',
    icon: '📦',
    color: 'bg-vanz-teal',
    textColor: 'text-vanz-teal',
    glow: 'shadow-glow-teal'
  },
  {
    id: '2',
    titleKey: 'welcome.slides.2.title',
    descKey: 'welcome.slides.2.desc',
    icon: '🚚',
    color: 'bg-vanz-yellow',
    textColor: 'text-vanz-yellow',
    glow: 'shadow-glow-yellow'
  },
  {
    id: '3',
    titleKey: 'welcome.slides.3.title',
    descKey: 'welcome.slides.3.desc',
    icon: '🤝',
    color: 'bg-vanz-green',
    textColor: 'text-vanz-green',
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
            <Text className="text-6xl">{item.icon}</Text>
          </View>
        </Animated.View>
        
        <Animated.Text 
          entering={FadeIn.delay(300)}
          className="text-vanz-navy text-3xl font-extrabold mb-4 text-center"
        >
          {t(item.titleKey)}
        </Animated.Text>
        
        <Animated.Text 
          entering={FadeIn.delay(400)}
          className="text-gray-500 text-center text-lg font-medium leading-relaxed px-2"
        >
          {t(item.descKey)}
        </Animated.Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      {/* Header Logo with Gradient */}
      <LinearGradient
        colors={['#0B1021', '#131B36', 'transparent']}
        className="pb-16 items-center absolute top-0 w-full z-10"
        style={{ paddingTop: Math.max(insets.top, 16) + 24 }}
      >
        <Image
          source={require('../../assets/images/logo-mark.png')}
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
          <TouchableOpacity 
            onPress={() => router.push('/auth/register')}
            className="w-full h-16 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90"
          >
            <LinearGradient
              colors={['#38B6FF', '#2196D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full items-center justify-center"
            >
              <Text className="text-white text-xl font-extrabold">{t('welcome.start')}</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push('/auth/login')}
            className="w-full h-16 bg-white border-2 border-gray-100 rounded-2xl items-center justify-center shadow-card active:bg-gray-50"
          >
            <Text className="text-vanz-navy text-xl font-extrabold">{t('auth.loginButton')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setLocale(locale === 'fr' ? 'ar' : 'fr')}
            className="mt-2 items-center pb-2"
          >
            <Text className="text-vanz-navy/50 font-bold">{t('welcome.switchLang')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
