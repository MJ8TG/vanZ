import type { ReactNode } from 'react';
import { View } from 'react-native';
import { vars, useColorScheme } from 'nativewind';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { semantic } = require('./tokens.cjs') as {
  semantic: { light: Record<string, string>; dark: Record<string, string> };
};

/** Build a NativeWind vars() style object from a semantic token map. */
const toVars = (mode: 'light' | 'dark') =>
  vars(
    Object.fromEntries(Object.entries(semantic[mode]).map(([k, v]) => [`--${k}`, v]))
  );

const themeVars = { light: toVars('light'), dark: toVars('dark') };

/**
 * Wraps the app and injects the active theme's semantic CSS vars into the whole
 * React tree. Every `bg-surface`, `text-content`, `border-line`, … class reads
 * these, so a scheme change here recolors every screen with no per-screen work.
 */
export function ThemedRoot({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme();
  return (
    <View style={[{ flex: 1 }, colorScheme === 'dark' ? themeVars.dark : themeVars.light]}>
      {children}
    </View>
  );
}

/**
 * Pins its subtree to the LIGHT palette regardless of the app theme. Used for
 * the pre-login brand screens (welcome, auth, mode-selector) — fixed navy-hero
 * compositions with a frosted footer that are designed to read one way only.
 */
export function ForceLight({ children }: { children: ReactNode }) {
  return <View style={[{ flex: 1 }, themeVars.light]}>{children}</View>;
}
