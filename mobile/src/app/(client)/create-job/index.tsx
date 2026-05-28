import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import { useJobStore, Location } from '@/store/useJobStore';

export default function CreateJobStep1() {
  const router = useRouter();
  const { draft, updateDraft } = useJobStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [focusedInput, setFocusedInput] = useState<'pickup' | 'dropoff'>('pickup');

  // Center on Tunis by default
  const [region, setRegion] = useState({
    latitude: 36.8065,
    longitude: 10.1815,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const searchAddress = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&countrycodes=tn&limit=5`);
      const data = await res.json();
      setResults(data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      })));
    } catch (e) {
      console.error(e);
    }
  };

  const selectLocation = (loc: Location) => {
    if (focusedInput === 'pickup') {
      updateDraft({ pickup: loc });
      setFocusedInput('dropoff');
      setQuery('');
    } else {
      updateDraft({ dropoff: loc });
      setQuery('');
    }
    setResults([]);
    setRegion({
      latitude: loc.lat,
      longitude: loc.lon,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-vanz-iceblue">
      {/* Map Background */}
      <View className="flex-1">
        <MapView
          className="flex-1"
          mapType="none"
          region={region}
        >
          <UrlTile 
            urlTemplate="https://a.tile.openstreetmap.de/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          {draft.pickup && <Marker coordinate={{ latitude: draft.pickup.lat, longitude: draft.pickup.lon }} pinColor="green" title="Départ" />}
          {draft.dropoff && <Marker coordinate={{ latitude: draft.dropoff.lat, longitude: draft.dropoff.lon }} pinColor="red" title="Arrivée" />}
        </MapView>
      </View>

      {/* Floating Search overlay */}
      <View className="absolute top-4 left-4 right-4 bg-white rounded-2xl shadow-lg p-4">
        <View className="mb-3 border-b border-gray-100 pb-2">
          <Text className="text-xs text-gray-500 mb-1 font-bold">Lieu de départ</Text>
          <TouchableOpacity onPress={() => setFocusedInput('pickup')}>
            <Text className={`text-base ${draft.pickup ? 'text-vanz-navy' : 'text-gray-400'}`} numberOfLines={1}>
              {focusedInput === 'pickup' && query ? query : draft.pickup ? draft.pickup.name : "Rechercher une adresse..."}
            </Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1 font-bold">Lieu d'arrivée</Text>
          <TouchableOpacity onPress={() => setFocusedInput('dropoff')}>
            <Text className={`text-base ${draft.dropoff ? 'text-vanz-navy' : 'text-gray-400'}`} numberOfLines={1}>
              {focusedInput === 'dropoff' && query ? query : draft.dropoff ? draft.dropoff.name : "Rechercher une adresse..."}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hidden input to capture typing */}
        <TextInput
          autoFocus
          className="absolute opacity-0 w-0 h-0"
          value={query}
          onChangeText={searchAddress}
        />

        {results.length > 0 && (
          <View className="mt-4 border-t border-gray-100 pt-2 max-h-48">
            <FlatList
              data={results}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => selectLocation(item)} className="py-3 border-b border-gray-50">
                  <Text className="text-vanz-navy text-sm" numberOfLines={2}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Footer Action */}
      <View className="p-6 bg-white pb-10">
        <TouchableOpacity 
          onPress={() => router.push('/(client)/create-job/step2')}
          disabled={!draft.pickup || !draft.dropoff}
          className={`w-full p-4 rounded-xl items-center ${!draft.pickup || !draft.dropoff ? 'bg-vanz-teal/50' : 'bg-vanz-teal'}`}
        >
          <Text className="text-white text-lg font-bold">Suivant</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
