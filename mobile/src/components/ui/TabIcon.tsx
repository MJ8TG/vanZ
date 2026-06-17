import React from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
  color: string;
}

/**
 * Tab icon with the Stitch bottom-nav active pill:
 * focused tab gets a tinted pill behind the icon.
 */
export default function TabIcon({ icon, label, focused, color }: TabIconProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.1 : 1, { damping: 12, stiffness: 150 }) }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(focused ? `${color}26` : 'transparent', { duration: 200 }), // ~15% alpha
  }));

  return (
    <Animated.View style={animatedStyle} className="items-center justify-center pt-1">
      <Animated.View style={pillStyle} className="px-4 py-1 rounded-full items-center justify-center mb-0.5">
        <Text style={{ color }} className="text-xl">{icon}</Text>
      </Animated.View>
      <Text
        style={{ color }}
        className={`text-2xs ${focused ? 'font-bold' : 'font-medium'}`}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
