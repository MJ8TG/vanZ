import { useEffect, useState } from 'react';
import { View, Text, Platform, StatusBar } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useI18n } from '@/i18n';

/** Top banner shown whenever the device loses connectivity. */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const { locale } = useI18n();

  useEffect(() => {
    // Guard the native call so the app still boots on a JS-only reload before
    // the native module is linked (i.e. before the next rebuild).
    try {
      const unsubscribe = NetInfo.addEventListener((state) => {
        setOffline(state.isConnected === false || state.isInternetReachable === false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('NetInfo unavailable (needs a native rebuild):', e);
    }
  }, []);

  if (!offline) return null;

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 47;

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, paddingTop: topPad, backgroundColor: '#EF4444' }}
    >
      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', paddingVertical: 6, fontSize: 13 }}>
        {locale === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'Pas de connexion internet'}
      </Text>
    </View>
  );
}
