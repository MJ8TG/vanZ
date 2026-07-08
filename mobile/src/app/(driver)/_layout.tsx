import { colors } from '@/theme/colors';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabIcon from '@/components/ui/TabIcon';
import { Radio, Truck, MessageCircle, Wallet, User } from 'lucide-react-native';
import { useI18n } from '@/i18n';
import * as Haptics from 'expo-haptics';

const driverTab = { activeColor: colors.yellow, inactiveColor: '#9AAEC4', pillClass: 'bg-vanz-yellow/15' };

export default function DriverTabLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.yellow, // vanz-yellow for driver mode
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.navy, // Dark navy for driver
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
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Radio} label={t('nav.dispatch')} focused={focused} {...driverTab} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Truck} label={t('nav.trips')} focused={focused} {...driverTab} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={MessageCircle} label={t('nav.messages')} focused={focused} {...driverTab} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Wallet} label={t('nav.wallet')} focused={focused} {...driverTab} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} label={t('nav.profile')} focused={focused} {...driverTab} />
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
