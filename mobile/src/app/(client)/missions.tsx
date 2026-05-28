import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function ClientMissionsScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeStatuses = ['open', 'payment_pending', 'matched', 'in_progress'];
  const historyStatuses = ['completed', 'cancelled', 'expired'];

  const fetchJobs = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const statuses = tab === 'active' ? activeStatuses : historyStatuses;
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', statuses)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setJobs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when the tab changes
  useEffect(() => { fetchJobs(); }, [tab]);

  // Refetch when the screen comes back into focus
  useFocusEffect(useCallback(() => { fetchJobs(); }, [tab]));

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      open: { bg: 'bg-vanz-teal/20', text: 'text-vanz-teal', label: 'Ouverte' },
      payment_pending: { bg: 'bg-vanz-yellow/20', text: 'text-vanz-yellow', label: 'Paiement' },
      matched: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Attribuée' },
      in_progress: { bg: 'bg-vanz-green/20', text: 'text-vanz-green', label: 'En cours' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Terminée' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Annulée' },
      expired: { bg: 'bg-red-100', text: 'text-red-600', label: 'Expirée' },
    };
    return badges[status] || badges.open;
  };

  const renderJob = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);
    return (
      <TouchableOpacity 
        onPress={() => router.push(`/(client)/job/${item.id}`)}
        className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-vanz-teal mb-4"
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-vanz-navy font-bold text-lg flex-1" numberOfLines={1}>
            {item.service_type || 'Mission'}
          </Text>
          <View className={`${badge.bg} px-3 py-1 rounded-full ml-2`}>
            <Text className={`${badge.text} font-bold text-xs`}>{badge.label}</Text>
          </View>
        </View>
        <Text className="text-vanz-navy/70 text-sm mb-1" numberOfLines={1}>
          📍 {item.pickup_address || 'Départ non spécifié'}
        </Text>
        <Text className="text-vanz-navy/70 text-sm mb-2" numberOfLines={1}>
          🏁 {item.dropoff_address || 'Arrivée non spécifiée'}
        </Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-vanz-teal font-bold">{item.budget} TND</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-4 px-6 bg-white border-b border-gray-200">
        <Text className="text-vanz-navy text-2xl font-bold mb-4">Mes Missions</Text>
        
        {/* Segmented Control */}
        <View className="flex-row bg-gray-100 p-1 rounded-xl">
          <TouchableOpacity 
            onPress={() => setTab('active')}
            className={`flex-1 py-2 items-center rounded-lg ${tab === 'active' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-semibold ${tab === 'active' ? 'text-vanz-navy' : 'text-gray-500'}`}>En cours</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTab('history')}
            className={`flex-1 py-2 items-center rounded-lg ${tab === 'history' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-semibold ${tab === 'history' ? 'text-vanz-navy' : 'text-gray-500'}`}>Historique</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 p-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2BBFDF" />
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderJob}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-vanz-navy/50 text-center text-lg">
                  {tab === 'active' 
                    ? "Vous n'avez aucune mission en cours." 
                    : "Votre historique est vide."}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
