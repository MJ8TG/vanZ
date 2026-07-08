import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PressableCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  className?: string;
  /** Scale factor on press, 0.97 is subtle, 0.92 is pronounced */
  pressScale?: number;
  /** Light selection tick on press. Off for cards that aren't really tappable. */
  haptic?: boolean;
}

export default function PressableCard({
  children,
  className = '',
  pressScale = 0.97,
  haptic = true,
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
      className={`bg-surface-elevated rounded-card shadow-card border border-line ${className}`}
      activeOpacity={0.95}
      onPressIn={() => {
        scale.value = withSpring(pressScale, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      // Tick on the confirmed tap, not on press-in: touch-down also fires when a
      // scroll gesture starts on a card, which would buzz on every scroll.
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedTouchable>
  );
}
