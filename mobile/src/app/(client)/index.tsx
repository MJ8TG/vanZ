import { View, Modal, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import BookingSheet from '@/components/booking/BookingSheet';
import { useI18n } from '@/i18n';
import type { PlaceSelection } from '@/types/domain';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function ClientHomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { t, locale } = useI18n();
  
  const [pickup, setPickup] = useState<PlaceSelection | null>(null);
  const [dropoff, setDropoff] = useState<PlaceSelection | null>(null);
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | null>(null);

  const isRtl = locale === 'ar';

  // Default region (Tunisia)
  const initialRegion = {
    latitude: 36.8065,
    longitude: 10.1815,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const handlePlaceSelect = (
    data: { description: string },
    details: { geometry: { location: { lat: number; lng: number } } } | null
  ) => {
    if (!details) return;
    const location = {
      description: data.description,
      lat: details.geometry.location.lat,
      lng: details.geometry.location.lng,
    };
    
    if (activeInput === 'pickup') setPickup(location);
    if (activeInput === 'dropoff') setDropoff(location);
    
    setActiveInput(null);

    // Animate map to location
    mapRef.current?.animateToRegion({
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <MapView
        ref={mapRef}
        className="w-full h-full"
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {pickup && (
          <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}>
            <View className="w-10 h-10 items-center justify-center bg-vanz-teal rounded-full border-4 border-white shadow-glow-teal">
              <View className="w-2.5 h-2.5 bg-white rounded-full" />
            </View>
          </Marker>
        )}
        {dropoff && (
          <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}>
            <View className="w-10 h-10 items-center justify-center bg-vanz-yellow rounded-xl border-4 border-white shadow-glow-yellow">
              <View className="w-2.5 h-2.5 bg-vanz-navy rounded-sm" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Floating Menu Button with Glass Effect */}
      <Animated.View entering={FadeIn.delay(300)} className={`absolute top-14 ${isRtl ? 'right-5' : 'left-5'} z-10`}>
        <TouchableOpacity 
          className="w-12 h-12 bg-card-glass rounded-full justify-center items-center shadow-elevated border border-white/50 active:opacity-90"
          onPress={() => router.push('/(client)/profile')}
        >
          <Text className="text-xl text-vanz-navy font-bold">☰</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* The Bottom Sheet replaces the wizard */}
      <BookingSheet 
        pickup={pickup} 
        dropoff={dropoff} 
        onFocusInput={(type) => setActiveInput(type)} 
      />

      {/* Full Screen Autocomplete Modal */}
      <Modal visible={activeInput !== null} animationType="slide">
        <View className="flex-1 bg-vanz-iceblue">
          <LinearGradient
            colors={['#0B1021', '#131B36']}
            className={`pt-14 pb-6 px-6 flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <TouchableOpacity 
              onPress={() => setActiveInput(null)}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center active:bg-white/20"
            >
              <Text className="text-white font-bold">{isRtl ? '→' : '←'}</Text>
            </TouchableOpacity>
            <Text className={`text-xl font-extrabold text-white flex-1 ml-4 mr-4 ${isRtl ? 'text-right' : ''}`}>
              {activeInput === 'pickup' ? t('createJob.pickupLabel') : t('createJob.dropoffLabel')}
            </Text>
          </LinearGradient>
          
          <GooglePlacesAutocomplete
            placeholder={t('createJob.searchPlaceholder')}
            fetchDetails
            onPress={handlePlaceSelect}
            query={{
              key: GOOGLE_MAPS_API_KEY,
              language: locale,
              components: 'country:tn', // Restrict to Tunisia
            }}
            styles={{
              container: { flex: 1, backgroundColor: '#F0F6FA' },
              textInputContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
              textInput: {
                backgroundColor: '#ffffff',
                borderRadius: 16,
                height: 56,
                fontSize: 16,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                color: '#0B1021',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              },
              listView: { paddingHorizontal: 20, backgroundColor: 'transparent' },
              row: {
                backgroundColor: '#ffffff',
                padding: 16,
                minHeight: 64,
                borderRadius: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#f3f4f6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              },
              description: {
                fontSize: 15,
                color: '#0B1021',
                fontWeight: '600',
              },
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
