import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Alert } from 'react-native';

import fr from './fr.json';
import ar from './ar.json';

export type Locale = 'fr' | 'ar';

const translations: Record<Locale, typeof fr> = { fr, ar };

/** Values for `{{placeholder}}` interpolation in a translation string. */
export type TVars = Record<string, string | number>;

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: TVars) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'fr',
      setLocale: (locale: Locale) => {
        const isRTL = locale === 'ar';
        // forceRTL only fully applies on the NEXT app launch. Detect a real
        // direction flip and prompt the user to restart so they don't end up
        // with a half-mirrored layout mid-session.
        const directionChanged = I18nManager.isRTL !== isRTL;
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        set({ locale });
        if (directionChanged) {
          Alert.alert(
            isRTL ? 'إعادة التشغيل مطلوبة' : 'Redémarrage requis',
            isRTL
              ? 'يرجى إغلاق التطبيق وإعادة فتحه لتطبيق اتجاه اللغة بالكامل.'
              : "Veuillez fermer et rouvrir l'application pour appliquer pleinement la nouvelle langue."
          );
        }
      },
      t: (key: string, vars?: TVars) => {
        const keys = key.split('.');
        const resolve = (loc: Locale): string | undefined => {
          let value: any = translations[loc];
          for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
          }
          return typeof value === 'string' ? value : undefined;
        };
        // Current locale, then French fallback, then the key itself.
        let str = resolve(get().locale) ?? resolve('fr') ?? key;
        if (vars) {
          str = str.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
            vars[name] != null ? String(vars[name]) : `{{${name}}}`
          );
        }
        return str;
      },
    }),
    {
      name: 'i18n-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
