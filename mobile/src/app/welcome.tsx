import { View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
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

const { width } = Dimensions.get('window');

const Dot = ({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) => {
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
  const { t, locale, setLocale } = useI18n();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  const renderItem = ({ item, index }: { item: typeof slides[0], index: number }) => {
    return (
      <View style={{ width }} className="items-center justify-center px-8 pt-10">
        <Animated.View 
          entering={FadeInDown.delay(index * 100).springify()}
          className={`w-40 h-40 rounded-full ${item.color} items-center justify-center mb-12 ${item.glow}`}
        >
          <View className="w-32 h-32 rounded-full bg-white/20 items-center justify-center border-4 border-white/30">
            <Text className="text-7xl">{item.icon}</Text>
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
        className="pt-20 pb-16 items-center absolute top-0 w-full z-10"
      >
        <Image 
          source={require('../../assets/images/logo.png')} 
          className="w-48 h-16" 
          resizeMode="contain" 
          style={{ tintColor: '#ffffff' }}
        />
      </LinearGradient>

      {/* Carousel */}
      <View className="flex-[3] mt-20">
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
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        />
      </View>

      {/* Footer & Controls with Glass Effect */}
      <View className="flex-1 px-8 pb-12 justify-end gap-8 bg-card-glass border-t border-white/50 shadow-elevated">
        
        {/* Pagination Indicators */}
        <View className="flex-row justify-center gap-2 mb-2 pt-6">
          {slides.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} />
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
