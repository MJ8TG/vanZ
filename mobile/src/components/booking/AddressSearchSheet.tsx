import { colors } from '@/theme/colors';
import { type RefObject } from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { useDirection } from '@/hooks/useDirection';
import Row from '@/components/ui/Row';
import { ArrowLeft, ArrowRight, Search, MapPin, Star } from 'lucide-react-native';
import type { PlaceSelection } from '@/types/domain';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
// The autocomplete lib wraps each row in a horizontal ScrollView, so percentage
// widths collapse to content. Give rows an explicit width so they span fully.
const ROW_WIDTH = Dimensions.get('window').width - 40;

export type AddressInputTarget = 'pickup' | 'dropoff' | 'mapPreview' | null;

interface Props {
  activeInput: AddressInputTarget;
  onClose: () => void;
  pickup: PlaceSelection | null;
  dropoff: PlaceSelection | null;
  /** Saved addresses as predefined rows (instant, no Places API call). */
  savedPredefined: unknown[];
  onPlaceSelect: (
    data: { description: string },
    details: { geometry: { location: { lat: number; lng: number } } } | null
  ) => void;
  mapRef: RefObject<MapView | null>;
}

/**
 * Full-screen address picker: Google Places autocomplete (with saved-address
 * quick-picks) for pickup/dropoff, then a map confirm sheet. Extracted from the
 * client home screen.
 */
export default function AddressSearchSheet({
  activeInput, onClose, pickup, dropoff, savedPredefined, onPlaceSelect, mapRef,
}: Props) {
  const { t, locale } = useI18n();
  const { isRtl } = useDirection();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={activeInput !== null} animationType="slide">
      <View className="flex-1 bg-surface">
        <LinearGradient
          colors={[colors.navy, colors.navyLight]}
          className="pb-6 px-6"
          style={{ paddingTop: Math.max(insets.top, 16) + 8 }}
        >
          <Row className="items-center">
            <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center active:bg-white/20">
              {isRtl
                ? <ArrowRight size={20} color={colors.white} strokeWidth={2.4} />
                : <ArrowLeft size={20} color={colors.white} strokeWidth={2.4} />}
            </TouchableOpacity>
            <Text className={`text-xl font-extrabold text-white flex-1 ml-4 mr-4 ${isRtl ? 'text-right' : ''}`}>
              {activeInput === 'pickup' ? t('createJob.pickupLabel') : activeInput === 'dropoff' ? t('createJob.dropoffLabel') : t('addressSheet.mapTitle')}
            </Text>
          </Row>
        </LinearGradient>

        {(activeInput === 'pickup' || activeInput === 'dropoff') && (
          <GooglePlacesAutocomplete
            placeholder={t('createJob.searchPlaceholder')}
            fetchDetails
            onPress={onPlaceSelect}
            minLength={2}
            debounce={250}
            enablePoweredByContainer={false}
            isRowScrollable={false}
            keyboardShouldPersistTaps="handled"
            predefinedPlaces={savedPredefined as any}
            textInputProps={{ placeholderTextColor: colors.mist }}
            query={{ key: GOOGLE_MAPS_API_KEY, language: locale, components: 'country:tn' }}
            renderRow={(row: any) => {
              const predefined = row.isPredefinedPlace === true;
              const main = predefined ? row.label || row.description : row.structured_formatting?.main_text ?? row.description;
              const sub = predefined ? row.description : row.structured_formatting?.secondary_text;
              return (
                <Row className="flex-1 items-center gap-3">
                  <View className={`w-9 h-9 rounded-full items-center justify-center ${predefined ? 'bg-vanz-teal/10' : 'bg-surface-sunken'}`}>
                    {predefined
                      ? <Star size={15} color={colors.teal} strokeWidth={2.4} />
                      : <MapPin size={15} color={colors.muted} strokeWidth={2.4} />}
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className={`text-content font-bold text-[15px] ${isRtl ? 'text-right' : ''}`}>{main}</Text>
                    {sub ? <Text numberOfLines={1} className={`text-content-muted text-xs mt-0.5 ${isRtl ? 'text-right' : ''}`}>{sub}</Text> : null}
                  </View>
                </Row>
              );
            }}
            listEmptyComponent={() => (
              <View className="items-center pt-20 px-12">
                <View className="w-16 h-16 rounded-full bg-surface items-center justify-center mb-4">
                  <Search size={26} color={colors.mist} strokeWidth={2.2} />
                </View>
                <Text className="text-content font-bold text-base text-center">{t('addressSheet.noResults')}</Text>
                <Text className="text-content-muted text-sm text-center mt-1">{t('addressSheet.tryStreet')}</Text>
              </View>
            )}
            styles={{
              container: { flex: 1, backgroundColor: colors.iceblue },
              textInputContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
              textInput: {
                backgroundColor: '#ffffff', borderRadius: 16, height: 56, fontSize: 16, paddingHorizontal: 16,
                borderWidth: 1, borderColor: '#e5e7eb', color: colors.navy, textAlign: isRtl ? 'right' : 'left',
              },
              listView: { paddingHorizontal: 20, backgroundColor: 'transparent' },
              row: { width: ROW_WIDTH, backgroundColor: '#ffffff', padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#eef2f6' },
              separator: { height: 0 },
              description: { fontSize: 15, color: colors.navy, fontWeight: '600' },
            }}
          />
        )}

        {activeInput === 'mapPreview' && (
          <View className="flex-1 relative bg-surface">
            <MapView ref={mapRef} className="w-full h-full" provider={PROVIDER_GOOGLE} showsUserLocation>
              {pickup && (
                <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}>
                  <View className="w-10 h-10 items-center justify-center bg-vanz-green rounded-full border-4 border-white shadow-glow-green">
                    <View className="w-2.5 h-2.5 bg-surface-elevated rounded-full" />
                  </View>
                </Marker>
              )}
              {dropoff && (
                <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}>
                  <View className="w-10 h-10 items-center justify-center bg-vanz-yellow rounded-xl border-4 border-white shadow-glow-yellow">
                    <View className="w-2.5 h-2.5 bg-inverted rounded-sm" />
                  </View>
                </Marker>
              )}
            </MapView>
            <View
              className="absolute bottom-0 left-0 right-0 bg-surface-elevated rounded-t-3xl px-6 pt-4 shadow-elevated"
              style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
            >
              <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-4" />
              {pickup && (
                <Row className="items-center gap-3 mb-2.5">
                  <View className="w-3 h-3 rounded-full bg-vanz-green" />
                  <Text numberOfLines={1} className={`flex-1 text-content font-semibold text-sm ${isRtl ? 'text-right' : ''}`}>{pickup.description}</Text>
                </Row>
              )}
              {dropoff && (
                <Row className="items-center gap-3 mb-4">
                  <View className="w-3 h-3 rounded-sm bg-vanz-yellow" />
                  <Text numberOfLines={1} className={`flex-1 text-content font-semibold text-sm ${isRtl ? 'text-right' : ''}`}>{dropoff.description}</Text>
                </Row>
              )}
              <TouchableOpacity onPress={onClose} className="w-full h-14 bg-inverted rounded-2xl items-center justify-center shadow-elevated active:opacity-90">
                <Text className="text-white font-black text-lg">{t('addressSheet.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
