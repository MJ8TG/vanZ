import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  session: Session | null;
  mode: 'client' | 'driver' | null;
  setSession: (session: Session | null) => void;
  setMode: (mode: 'client' | 'driver') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      mode: null,
      setSession: (session) => set({ session }),
      setMode: (mode) => set({ mode }),
      logout: () => set({ session: null, mode: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }), // Only persist the mode, session is persisted by Supabase client
    }
  )
);
