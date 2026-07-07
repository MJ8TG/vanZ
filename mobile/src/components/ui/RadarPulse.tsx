import { colors } from '@/theme/colors';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Truck } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

export default function RadarPulse() {
  const scale1 = useSharedValue(0);
  const scale2 = useSharedValue(0);
  const scale3 = useSharedValue(0);

  useEffect(() => {
    const config = { duration: 3000, easing: Easing.out(Easing.ease) };
    scale1.value = withRepeat(withTiming(1, config), -1, false);
    scale2.value = withDelay(1000, withRepeat(withTiming(1, config), -1, false));
    scale3.value = withDelay(2000, withRepeat(withTiming(1, config), -1, false));
  }, [scale1, scale2, scale3]);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value * 4 }],
    opacity: interpolate(scale1.value, [0, 0.5, 1], [0.8, 0.4, 0]),
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value * 4 }],
    opacity: interpolate(scale2.value, [0, 0.5, 1], [0.8, 0.4, 0]),
  }));

  const style3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value * 4 }],
    opacity: interpolate(scale3.value, [0, 0.5, 1], [0.8, 0.4, 0]),
  }));

  return (
    <View className="items-center justify-center my-8 h-32">
      <Animated.View className="absolute w-16 h-16 rounded-full bg-vanz-teal border border-vanz-teal" style={style1} />
      <Animated.View className="absolute w-16 h-16 rounded-full bg-vanz-teal border border-vanz-teal" style={style2} />
      <Animated.View className="absolute w-16 h-16 rounded-full bg-vanz-teal border border-vanz-teal" style={style3} />
      
      {/* Center badge — amber rounded square with Truck, matches prototype */}
      <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: colors.yellow, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 }}>
        <Truck size={26} color={colors.navy} strokeWidth={2.1} />
      </View>
    </View>
  );
}
