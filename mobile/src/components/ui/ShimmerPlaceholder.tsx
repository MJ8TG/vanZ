import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface ShimmerPlaceholderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export default function ShimmerPlaceholder({
  width = '100%',
  height = 20,
  borderRadius = 12,
  className = '',
}: ShimmerPlaceholderProps) {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmerValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerValue.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: typeof width === 'number' ? width : undefined,
          height,
          borderRadius,
          backgroundColor: '#E2E8F0',
        },
        animatedStyle,
      ]}
      className={`${typeof width === 'string' ? 'w-full' : ''} ${className}`}
    />
  );
}

/** Pre-built shimmer card for job/trip lists */
export function ShimmerCard() {
  return (
    <View className="bg-white p-5 rounded-card mb-4 border border-gray-100">
      <View className="flex-row justify-between items-center mb-3.5">
        <ShimmerPlaceholder width={120} height={18} borderRadius={8} />
        <ShimmerPlaceholder width={70} height={24} borderRadius={12} />
      </View>
      <ShimmerPlaceholder height={14} borderRadius={6} className="mb-2.5" />
      <ShimmerPlaceholder width={200} height={14} borderRadius={6} className="mb-4" />
      <View className="flex-row justify-between">
        <ShimmerPlaceholder width={80} height={16} borderRadius={8} />
        <ShimmerPlaceholder width={60} height={16} borderRadius={8} />
      </View>
    </View>
  );
}
