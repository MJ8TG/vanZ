import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function DriverTripsScreen() {
  const { session } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('driver_id', session.user.id)
        .in('status', ['matched', 'in_progress'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTrips(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTrips(); }, []));

  const statusLabels: Record<string, { label: string; color: string }> = {
    matched: { label: 'Attribuée', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'En cours', color: 'bg-vanz-green/20 text-vanz-green' },
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-4 px-6 bg-white border-b border-gray-200">
        <Text className="text-vanz-navy text-2xl font-bold">Mes Trajets</Text>
      </View>

      <View className="flex-1 p-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F5C800" />
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={({ item }) => {
              const badge = statusLabels[item.status] || statusLabels.matched;
              return (
                <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border-l-4 border-vanz-yellow">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-vanz-navy font-bold text-lg flex-1">{item.service_type || 'Mission'}</Text>
                    <View className={`px-3 py-1 rounded-full ${badge.color.split(' ')[0]}`}>
                      <Text className={`font-bold text-xs ${badge.color.split(' ')[1]}`}>{badge.label}</Text>
                    </View>
                  </View>
                  <Text className="text-vanz-navy/70 text-sm mb-1">📍 {item.pickup_address}</Text>
                  <Text className="text-vanz-navy/70 text-sm mb-2">🏁 {item.dropoff_address}</Text>
                  <Text className="text-vanz-teal font-bold">{item.budget} TND</Text>
                </View>
              );
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-3xl mb-4">🛣️</Text>
                <Text className="text-vanz-navy/50 text-center text-lg">
                  Vous n'avez aucun trajet en cours.
                </Text>
                <Text className="text-vanz-navy/40 text-center text-sm mt-2">
                  Faites des offres sur des missions pour commencer.
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
