import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabIcon from '@/components/ui/TabIcon';
import { useI18n } from '@/i18n';

export default function DriverTabLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F5C800', // vanz-yellow for driver mode
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B1021', // Dark navy for driver
          position: 'absolute',
          elevation: 0,
          borderTopWidth: 0,
          height: 60 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView 
            tint="dark" 
            intensity={90} 
            style={StyleSheet.absoluteFill} 
            className="border-t border-white/10"
          />
        ),
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="🗺️" label={t('driver.missions')} focused={focused} color={color as string} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="trips" 
        options={{ 
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="🛣️" label={t('driver.trips')} focused={focused} color={color as string} />
          ),
        }} 
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="💬" label={t('chat.messages')} focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ 
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="💰" label={t('driver.wallet')} focused={focused} color={color as string} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="👤" label={t('driver.profile')} focused={focused} color={color as string} />
          ),
        }} 
      />
      <Tabs.Screen name="verify" options={{ href: null }} />
      <Tabs.Screen name="bid/[id]" options={{ href: null }} />
      <Tabs.Screen name="chat/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="referral" options={{ href: null }} />
      <Tabs.Screen name="vehicle" options={{ href: null }} />
      <Tabs.Screen name="earnings" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
    </Tabs>
  );
}
