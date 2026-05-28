import { View, Text, Switch, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function DriverHomeScreen() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOnline) {
      fetchJobs();
    } else {
      setJobs([]);
    }
  }, [isOnline]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setJobs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderJob = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/(driver)/bid/${item.id}`)}
      className="bg-white p-4 rounded-xl shadow-sm mb-4 border-l-4 border-vanz-yellow"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-vanz-navy font-bold text-lg">{item.service_type || 'Mission'}</Text>
        <Text className="text-vanz-teal font-bold">{item.budget} TND</Text>
      </View>
      <Text className="text-vanz-navy/70 mb-1" numberOfLines={1}>📍 De: {item.pickup_address || 'Non spécifié'}</Text>
      <Text className="text-vanz-navy/70 mb-3" numberOfLines={1}>🏁 À: {item.dropoff_address || 'Non spécifié'}</Text>
      <View className="bg-vanz-iceblue p-2 rounded items-center">
        <Text className="text-vanz-navy font-semibold text-sm">Faire une offre</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-4 px-6 bg-vanz-navy flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold">Missions</Text>
        <View className="flex-row items-center">
          <Text className={`mr-2 font-bold ${isOnline ? 'text-vanz-green' : 'text-gray-400'}`}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
          <Switch 
            value={isOnline} 
            onValueChange={setIsOnline}
            trackColor={{ false: '#334155', true: '#22C55E' }}
            thumbColor={'#fff'}
          />
        </View>
      </View>

      {!isOnline ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 bg-gray-200 rounded-full mb-4 items-center justify-center">
            <Text className="text-3xl">💤</Text>
          </View>
          <Text className="text-vanz-navy text-xl font-bold mb-2">Vous êtes hors ligne</Text>
          <Text className="text-vanz-navy/60 text-center">
            Passez en ligne pour recevoir des missions autour de vous.
          </Text>
        </View>
      ) : (
        <View className="flex-1 p-4">
          <View className="flex-row justify-between mb-4">
            <TouchableOpacity className="bg-white px-4 py-2 rounded-full shadow-sm">
              <Text className="text-vanz-navy font-semibold">Trier par: Récents</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-white px-4 py-2 rounded-full shadow-sm">
              <Text className="text-vanz-navy font-semibold">Filtres</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#F5C800" />
            </View>
          ) : (
            <FlatList
              data={jobs}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={renderJob}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={() => (
                <View className="items-center justify-center py-10">
                  <Text className="text-vanz-navy/50 text-center">Aucune mission ouverte pour le moment.</Text>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
