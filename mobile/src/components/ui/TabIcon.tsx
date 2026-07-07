import { colors } from '@/theme/colors';
import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface TabIconProps {
  Icon: LucideIcon;
  label: string;
  focused: boolean;
  /** Active accent (client = teal, driver = yellow). */
  activeColor?: string;
  /** Inactive icon/label color. */
  inactiveColor?: string;
  /** Tailwind class for the active pill behind the icon. */
  pillClass?: string;
}

/**
 * Bottom-nav item — clean lucide icon that turns the brand accent when active,
 * with a subtle tinted pill behind the active icon. Matches the prototype's
 * BottomNav (no emoji, no chunky circle).
 */
export default function TabIcon({
  Icon,
  label,
  focused,
  activeColor = colors.teal,
  inactiveColor = colors.slate,
  pillClass = 'bg-vanz-teal/10',
}: TabIconProps) {
  const color = focused ? activeColor : inactiveColor;
  return (
    <View className="items-center justify-center" style={{ width: 66 }}>
      <View className={`px-3.5 py-1 rounded-full ${focused ? pillClass : ''}`}>
        <Icon size={22} color={color} strokeWidth={focused ? 2.6 : 2} />
      </View>
      <Text
        numberOfLines={1}
        style={{ color, fontSize: 10.5, fontWeight: focused ? '800' : '500', marginTop: 3 }}
      >
        {label}
      </Text>
    </View>
  );
}
