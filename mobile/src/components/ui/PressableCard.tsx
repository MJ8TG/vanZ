import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PressableCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  className?: string;
  /** Scale factor on press, 0.97 is subtle, 0.92 is pronounced */
  pressScale?: number;
}

export default function PressableCard({ 
  children, 
  className = '', 
  pressScale = 0.97,
  onPress,
  ...rest 
}: PressableCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={animatedStyle}
      className={`bg-white rounded-card shadow-card border border-gray-100 ${className}`}
      activeOpacity={0.95}
      onPressIn={() => {
        scale.value = withSpring(pressScale, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={onPress}
      {...rest}
    >
      {children}
    </AnimatedTouchable>
  );
}
