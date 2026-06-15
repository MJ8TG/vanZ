import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Platform, View, Image, Text } from 'react-native';
import { datasql } from '@/lib/supabase';
import { registerPushToken } from '@/lib/registerPushToken';
import { useAuthStore } from '@/store/useAuthStore';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import QueryProvider from '@/components/providers/QueryProvider';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession, mode, setMode } = useAuthStore();
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
    // Don't dispatch navigation until the root navigator is actually mounted,
    // otherwise expo-router throws "Couldn't find a navigation context".
    if (!navState?.key) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'welcome';

    if (!session) {
      if (!inAuthGroup) {
        // Redirect to welcome if not logged in and not in auth screens
        router.replace('/welcome');
      }
    } else {
      if (inAuthGroup || segments[0] === '(client)' || segments[0] === '(driver)' || !segments[0]) {
        // If logged in but trying to access auth screens or app root
        if (!mode && (segments[0] as string) !== 'mode-selector') {
          router.replace('/mode-selector');
        } else if (mode === 'client' && segments[0] !== '(client)') {
          router.replace('/(client)');
        } else if (mode === 'driver' && segments[0] !== '(driver)') {
          router.replace('/(driver)');
        }
      }
    }
  }, [session, mode, segments, isReady, showSplash, navState?.key]);

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
              Loading
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      }
    }
    requestPermissions();
  }, []);

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
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

