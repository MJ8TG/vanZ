import { colors } from '@/theme/colors';
import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { ThemedRoot } from '@/theme/ThemedRoot';
import { useTheme } from '@/theme/useTheme';
import * as Notifications from 'expo-notifications';
import { Platform, View, Image, Text } from 'react-native';
import { datasql } from '@/lib/supabase';
import { registerPushToken } from '@/lib/registerPushToken';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import QueryProvider from '@/components/providers/QueryProvider';
import OfflineBanner from '@/components/ui/OfflineBanner';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

/** Reads the user's role from the DB once, for the launch + auth-change handlers. */
async function fetchUserRole(userId: string): Promise<'client' | 'driver' | null> {
  try {
    const { data, error } = await datasql.from('users').select('role').eq('id', userId).single();
    if (!error && data?.role) return data.role as 'client' | 'driver';
  } catch (e) {
    console.error('Failed to fetch user role:', e);
  }
  return null;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession, mode, setMode } = useAuthStore();
  const { t } = useI18n();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Safety timeout: always set isReady to true after 2 seconds to prevent screen freeze
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout: forcing app ready state.');
      setIsReady(true);
      setTimeout(() => setShowSplash(false), 500);
    }, 2000);

    datasql.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(safetyTimeout);
      setSession(session);
      setIsReady(true);

      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        if (role) setMode(role);
      }
      setTimeout(() => setShowSplash(false), 500);
    }).catch((e) => {
      clearTimeout(safetyTimeout);
      console.error('Failed to get session on launch:', e);
      setIsReady(true);
      setTimeout(() => setShowSplash(false), 500);
    });

    const { data: { subscription } } = datasql.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        if (role) setMode(role);
        // Register this device for push notifications (fire-and-forget).
        registerPushToken(session.user.id);
      } else {
        setMode(null);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady || showSplash) return;

    const seg0 = segments[0] as string | undefined;
    const inPublic = seg0 === 'welcome' || seg0 === 'auth' || seg0 === 'mode-selector';

    if (!session) {
      if (!inPublic) router.replace('/welcome');
      return;
    }

    if (!mode) {
      if (seg0 !== 'mode-selector') router.replace('/mode-selector');
      return;
    }

    const targetGroup = mode === 'driver' ? '(driver)' : '(client)';
    if (inPublic || (seg0 !== '(client)' && seg0 !== '(driver)' && !seg0)) {
      router.replace(`/${targetGroup}` as any);
      return;
    }

    if (mode === 'client' && seg0 === '(driver)') router.replace('/(client)');
    if (mode === 'driver' && seg0 === '(client)') router.replace('/(driver)');
  }, [session, mode, segments, isReady, showSplash]);

  // Deep-link: route the user to the relevant screen when they tap a push.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as {
        job_id?: string;
        conversation_id?: string;
      };
      const group = useAuthStore.getState().mode === 'driver' ? 'driver' : 'client';
      try {
        if (data.conversation_id) {
          router.push(`/(${group})/chat/${data.conversation_id}` as Href);
        } else if (data.job_id && group === 'client') {
          router.push(`/(client)/job/${data.job_id}` as Href);
        } else {
          router.push(`/(${group})/notifications` as Href);
        }
      } catch (e) {
        console.error('Notification deep-link failed:', e);
      }
    });
    return () => sub.remove();
  }, [router]);

  return (
    <Animated.View entering={FadeIn.duration(400)} className="flex-1">
      {children}
      {showSplash && (
        <Animated.View
          pointerEvents="none"
          exiting={FadeOut.duration(400)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.navy,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
          <Animated.View entering={FadeIn.duration(600).springify()} layout={Layout.springify()}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: 24,
              borderRadius: 24,
              marginBottom: 24,
              alignItems: 'center',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1,
              shadowColor: colors.teal,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 8,
            }}>
              <Image
                source={require('../../assets/images/logo-mark.png')}
                accessibilityLabel="VanZ"
                style={{ width: 176, height: 80 }}
                resizeMode="contain"
              />
            </View>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              fontWeight: '800',
              letterSpacing: 2,
              fontSize: 14,
              textTransform: 'uppercase'
            }}>
              {t('common.loading')}
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Plus Jakarta Sans': PlusJakartaSans_400Regular,
    'Plus Jakarta Sans Medium': PlusJakartaSans_500Medium,
    'Plus Jakarta Sans SemiBold': PlusJakartaSans_600SemiBold,
    'Plus Jakarta Sans Bold': PlusJakartaSans_700Bold,
    'Plus Jakarta Sans ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  // Instantiate the theme store so its persisted preference rehydrates and is
  // applied to NativeWind's color scheme (see useTheme.onRehydrateStorage).
  // Must stay above the early font-loading return so hook order is stable.
  const themeMode = useTheme((s) => s.mode);
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      }
    }
    requestPermissions();
  }, []);

  // Hold on a navy screen (matching the splash) until fonts are ready, so text
  // doesn't flash in a fallback font. Don't block forever if loading errors.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.navy }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedRoot>
        <QueryProvider>
          <AuthProvider>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} key={`${themeMode}-${colorScheme}`} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="mode-selector" />
              {/* Client & Driver Mode Stacks */}
              <Stack.Screen name="(client)" />
              <Stack.Screen name="(driver)" />
              <Stack.Screen name="auth" />
            </Stack>
          </AuthProvider>
          <OfflineBanner />
        </QueryProvider>
      </ThemedRoot>
    </GestureHandlerRootView>
  );
}

