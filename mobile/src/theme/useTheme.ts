import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  /** User's chosen preference. 'system' follows the phone's light/dark setting. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Persisted theme preference, mirroring the i18n store. Setting the mode drives
 * NativeWind's global color scheme (`colorScheme.set`), which the app root reads
 * via useColorScheme() to swap the semantic CSS vars (see ThemedRoot).
 *
 * Default is 'system' so a fresh install matches the phone. On rehydrate we
 * re-apply the saved preference (AsyncStorage is async, so this runs after the
 * first paint — ThemedRoot re-renders when the scheme lands).
 */
export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode: ThemeMode) => {
        colorScheme.set(mode);
        set({ mode });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) colorScheme.set(state.mode);
      },
    }
  )
);
