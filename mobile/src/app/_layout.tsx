import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Platform, View, Image, Text } from 'react-native';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

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
  }, [session, mode, segments, isReady, showSplash]);

  if (showSplash) {
    return (
      <Animated.View 
        exiting={FadeOut.duration(400)}
        className="flex-1 items-center justify-center bg-vanz-navy"
      >
        <Animated.View entering={FadeIn.duration(600).springify()} layout={Layout.springify()}>
          <View className="bg-white/10 p-6 rounded-3xl mb-6 items-center shadow-glow-teal border border-white/20">
            <Image 
              source={require('../../assets/images/logo.png')} 
              className="w-48 h-16" 
              resizeMode="contain" 
              style={{ tintColor: '#ffffff' }}
            />
          </View>
          <Text className="text-white/60 text-center font-extrabold tracking-widest text-sm uppercase">Loading</Text>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} className="flex-1">
      {children}
    </Animated.View>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import QueryProvider from '@/components/providers/QueryProvider';

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

