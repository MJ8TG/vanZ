import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
  color: string;
}

export default function TabIcon({ icon, label, focused, color }: TabIconProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 150 }) }],
  }));

  return (
    <Animated.View style={animatedStyle} className="items-center justify-center pt-1">
      <Text style={{ color }} className="text-xl mb-0.5">{icon}</Text>
      <Text 
        style={{ color }} 
        className={`text-2xs ${focused ? 'font-bold' : 'font-medium'}`}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
