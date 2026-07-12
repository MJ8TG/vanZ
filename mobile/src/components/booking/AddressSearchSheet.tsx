import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
import { type RefObject, useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { useDirection } from '@/hooks/useDirection';
import Row from '@/components/ui/Row';
import { ArrowLeft, ArrowRight, Search, MapPin, Star, ChevronLeft, ChevronRight, Crosshair, WifiOff } from 'lucide-react-native';
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
  const c = useThemeColors();
  // Places API failures (quota, billing, network) were swallowed silently and
  // the search just showed nothing — surface them so the user knows to use
  // the saved-address quick-picks instead.
  const [searchFailed, setSearchFailed] = useState(false);

  useEffect(() => {
    setSearchFailed(false);
  }, [activeInput]);

  return (
    // onRequestClose: without it the Android hardware back button is a no-op
    // inside a RN Modal and users are stuck on this sheet.
    <Modal visible={activeInput !== null} animationType="slide" onRequestClose={onClose}>
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

        {(activeInput === 'pickup' || activeInput === 'dropoff') && searchFailed && (
          <View className={`mx-5 mt-4 px-4 py-3 rounded-2xl bg-warning/10 border border-warning/30 flex-row items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <WifiOff size={16} color={c.warning} strokeWidth={2.2} />
            <Text className={`flex-1 text-warning font-bold text-xs leading-relaxed ${isRtl ? 'text-right' : ''}`}>
              {t('addressSheet.searchUnavailable')}
            </Text>
          </View>
        )}

        {(activeInput === 'pickup' || activeInput === 'dropoff') && (
          <GooglePlacesAutocomplete
            placeholder={t('createJob.searchPlaceholder')}
            fetchDetails
            onPress={onPlaceSelect}
            onFail={(e) => {
              console.warn('Places autocomplete failed:', e);
              setSearchFailed(true);
            }}
            onTimeout={() => setSearchFailed(true)}
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
            // These are inline styles (not className) so they can't flip via the
            // theme vars — feed them the mode-aware hexes. Previously hardcoded
            // white, which made row labels (text-content, white in dark) invisible.
            styles={{
              container: { flex: 1, backgroundColor: c.surface },
              textInputContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
              textInput: {
                backgroundColor: c.surfaceElevated, borderRadius: 16, height: 56, fontSize: 16, paddingHorizontal: 16,
                borderWidth: 1, borderColor: c.border, color: c.textPrimary, textAlign: isRtl ? 'right' : 'left',
              },
              listView: { paddingHorizontal: 20, backgroundColor: 'transparent' },
              // Spacing must live in `separator`, not a row margin: the lib's
              // touch regions don't account for row margins, so every row after
              // the first became untappable (visuals drifted below hit areas).
              row: { width: ROW_WIDTH, backgroundColor: c.surfaceElevated, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border },
              separator: { height: 8, backgroundColor: 'transparent' },
              description: { fontSize: 15, color: c.textPrimary, fontWeight: '600' },
            }}
          />
        )}

        {activeInput === 'mapPreview' && (
          <View className="flex-1 relative bg-surface-sunken">
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

            {/* Recenter on the selected points */}
            <TouchableOpacity
              onPress={() => {
                const coords = [pickup, dropoff]
                  .filter((p): p is PlaceSelection => !!p)
                  .map((p) => ({ latitude: p.lat, longitude: p.lng }));
                if (coords.length === 1) {
                  mapRef.current?.animateToRegion({ ...coords[0], latitudeDelta: 0.03, longitudeDelta: 0.03 });
                } else if (coords.length > 1) {
                  mapRef.current?.fitToCoordinates(coords, {
                    edgePadding: { top: 100, right: 80, bottom: 280, left: 80 },
                    animated: true,
                  });
                }
              }}
              className="absolute w-11 h-11 rounded-full bg-surface-elevated border border-line items-center justify-center shadow-card active:bg-surface-sunken"
              style={{ top: 16, ...(isRtl ? { left: 16 } : { right: 16 }) }}
              accessibilityLabel={t('addressSheet.mapTitle')}
            >
              <Crosshair size={20} color={c.textPrimary} strokeWidth={2.2} />
            </TouchableOpacity>

            <View
              className="absolute bottom-0 left-0 right-0 bg-surface-elevated rounded-t-[28px] px-5 pt-4 shadow-elevated border-t border-line"
              // Inside an Android Modal (edge-to-edge) the safe-area inset can
              // report 0, which used to leave the confirm button clipped under
              // the gesture bar — guarantee real clearance instead.
              style={{ paddingBottom: Math.max(insets.bottom, 28) + 20 }}
            >
              <View className="w-12 h-1.5 bg-line-strong rounded-full self-center mb-5" />

              {/* Route card: timeline rail + labeled stops */}
              <View className="bg-surface rounded-2xl border border-line px-4 py-4 mb-4">
                <Row className={`items-stretch ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className="items-center w-5">
                    {pickup && (
                      <View className="w-3.5 h-3.5 rounded-full bg-vanz-green border-2 border-vanz-green/30 mt-1" />
                    )}
                    {pickup && dropoff && <View className="flex-1 w-0.5 bg-line-strong my-1 rounded-full" />}
                    {dropoff && (
                      <View className="w-3.5 h-3.5 rounded-[4px] bg-vanz-yellow border-2 border-vanz-yellow/30 mb-1" />
                    )}
                  </View>
                  <View className={`flex-1 ${isRtl ? 'mr-3' : 'ml-3'}`}>
                    {pickup && (
                      <View className={dropoff ? 'mb-4' : ''}>
                        <Text className={`text-content-muted font-bold text-[10px] uppercase tracking-[0.08em] ${isRtl ? 'text-right' : ''}`}>
                          {t('home.departure')}
                        </Text>
                        <Text numberOfLines={1} className={`text-content font-extrabold text-[15px] mt-0.5 ${isRtl ? 'text-right' : ''}`}>
                          {pickup.description}
                        </Text>
                      </View>
                    )}
                    {dropoff && (
                      <View>
                        <Text className={`text-content-muted font-bold text-[10px] uppercase tracking-[0.08em] ${isRtl ? 'text-right' : ''}`}>
                          {t('home.arrival')}
                        </Text>
                        <Text numberOfLines={1} className={`text-content font-extrabold text-[15px] mt-0.5 ${isRtl ? 'text-right' : ''}`}>
                          {dropoff.description}
                        </Text>
                      </View>
                    )}
                  </View>
                </Row>
              </View>

              <TouchableOpacity onPress={onClose} className="w-full h-14 rounded-2xl overflow-hidden shadow-glow-teal active:opacity-90">
                <LinearGradient
                  colors={[colors.teal, colors.tealDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  // Explicit style: className flex props don't reliably reach
                  // expo-linear-gradient, which left the label pinned to a side.
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Row className="items-center gap-2">
                    <Text className="text-white font-black text-lg">{t('addressSheet.confirm')}</Text>
                    {isRtl
                      ? <ChevronLeft size={20} color={colors.white} strokeWidth={2.6} />
                      : <ChevronRight size={20} color={colors.white} strokeWidth={2.6} />}
                  </Row>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
