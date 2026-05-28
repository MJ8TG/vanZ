import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import fr from './fr.json';
import ar from './ar.json';

type Locale = 'fr' | 'ar';

const translations: Record<Locale, typeof fr> = { fr, ar };

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'fr',
      setLocale: (locale: Locale) => {
        const isRTL = locale === 'ar';
        I18nManager.forceRTL(isRTL);
        I18nManager.allowRTL(isRTL);
        set({ locale });
      },
      t: (key: string) => {
        const locale = get().locale;
        const keys = key.split('.');
        let value: any = translations[locale];
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }
        if (typeof value === 'string') return value;
        // Fallback to French
        let fallback: any = translations['fr'];
        for (const k of keys) {
          fallback = fallback?.[k];
          if (fallback === undefined) break;
        }
        return typeof fallback === 'string' ? fallback : key;
      },
    }),
    {
      name: 'i18n-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
