import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function DriverWalletScreen() {
  const { session } = useAuthStore();
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*, jobs(status, service_type, created_at)')
        .eq('driver_id', session.user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const earnings = data || [];
      setCompletedJobs(earnings);
      setTotalEarnings(earnings.reduce((sum: number, bid: any) => sum + (bid.amount || 0), 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchEarnings(); }, []));

  return (
    <ScrollView className="flex-1 bg-vanz-iceblue">
      <View className="pt-16 pb-8 px-6 bg-vanz-navy">
        <Text className="text-white text-2xl font-bold mb-6">Portefeuille</Text>
        
        <View className="bg-vanz-teal p-6 rounded-2xl items-center shadow-lg">
          <Text className="text-white/80 text-lg mb-1">Solde disponible</Text>
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text className="text-white text-5xl font-extrabold">
              {totalEarnings.toFixed(2)} <Text className="text-2xl">TND</Text>
            </Text>
          )}
          
          <TouchableOpacity className="mt-6 bg-white/20 w-full p-4 rounded-xl items-center">
            <Text className="text-white font-bold text-lg">Retirer les fonds</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-6">
        <Text className="text-vanz-navy text-xl font-bold mb-4">Historique des gains</Text>
        
        {loading ? (
          <View className="bg-white p-6 rounded-2xl shadow-sm items-center">
            <ActivityIndicator color="#2BBFDF" />
          </View>
        ) : completedJobs.length > 0 ? (
          <View className="gap-3">
            {completedJobs.map((bid) => (
              <View key={bid.id} className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-vanz-navy font-bold">{bid.jobs?.service_type || 'Mission'}</Text>
                  <Text className="text-vanz-navy/50 text-xs">
                    {new Date(bid.created_at).toLocaleDateString('fr-TN')}
                  </Text>
                </View>
                <Text className="text-vanz-green font-extrabold text-lg">+{bid.amount} TND</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white p-6 rounded-2xl shadow-sm items-center justify-center">
            <Text className="text-vanz-navy/50 text-center">Aucune transaction pour le moment.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
