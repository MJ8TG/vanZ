import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession, mode, setMode } = useAuthStore();
  const { t } = useI18n();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();
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
        try {
          const { data, error } = await datasql
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!error && data?.role) {
            setMode(data.role as 'client' | 'driver');
          }
        } catch (e) {
          console.error('Failed to fetch user role on launch:', e);
        }
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
        try {
          const { data, error } = await datasql
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!error && data?.role) {
            setMode(data.role as 'client' | 'driver');
          }
        } catch (e) {
          console.error('onAuthStateChange role fetch error:', e);
        }
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
    if (!navState?.key) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'welcome' || segments[0] === 'mode-selector';

    if (!session) {
      if (!inAuthGroup) {
        // Redirect to welcome if not logged in and not in auth screens
        router.replace('/welcome');
      }
    } else {
      if (!mode) {
        // Safety net: session exists but no role is known
        if (segments[0] !== 'mode-selector' && segments[0] !== 'auth') {
          router.replace('/mode-selector');
        }
      } else if (mode === 'driver') {
        if (segments[0] !== '(driver)') {
          router.replace('/(driver)');
        }
      } else if (mode === 'client') {
        if (segments[0] !== '(client)') {
          router.replace('/(client)');
        }
      }
    }
  }, [session, mode, segments, isReady, showSplash, navState?.key]);

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
            backgroundColor: '#0B1021',
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
              shadowColor: '#38B6FF',
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
    return <View style={{ flex: 1, backgroundColor: '#0B1021' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <StatusBar style="dark" />
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
    </GestureHandlerRootView>
  );
}

