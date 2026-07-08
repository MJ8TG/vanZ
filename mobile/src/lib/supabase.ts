import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Hard ceiling on any REST/auth request.
 *
 * Without this a request on a flaky connection can hang indefinitely: it never
 * rejects, so react-query stays `isPending && isFetching` and the screen shows
 * its loading skeleton forever with no way out. Aborting turns that into a
 * normal error the UI can render (and retry).
 */
const REQUEST_TIMEOUT_MS = 15_000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input as RequestInfo, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

let client: SupabaseClient;
try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing from environment variables!');
  }
  // Provide valid placeholder structure if missing to prevent module-load crashes
  const url = supabaseUrl || 'https://placeholder-url.supabase.co';
  const key = supabaseAnonKey || 'placeholder-key';
  
  const isSSR = Platform.OS === 'web' && typeof window === 'undefined';
  const customStorage = {
    getItem: async (key: string) => {
      if (isSSR) return null;
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      if (isSSR) return;
      try {
        await AsyncStorage.setItem(key, value);
      } catch {}
    },
    removeItem: async (key: string) => {
      if (isSSR) return;
      try {
        await AsyncStorage.removeItem(key);
      } catch {}
    }
  };

  client = createClient(url, key, {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: { fetch: fetchWithTimeout },
  });
} catch (e) {
  console.error('Fatal: Failed to initialize Supabase client:', e);
  // Safe mock client fallback to prevent loading failures
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as SupabaseClient;
}

export const supabase = client;
export const datasql = supabase;

