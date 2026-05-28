import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const categories = [
  { name: 'Déménagement', icon: '🚚' },
  { name: 'Colis', icon: '📦' },
  { name: 'Meubles', icon: '🛋️' },
  { name: 'Électroménager', icon: '🧊' },
];

export default function ClientHomeScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentJobs = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      setRecentJobs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchRecentJobs(); }, []));

  const statusLabels: Record<string, string> = {
    open: 'Ouverte',
    matched: 'Attribuée',
    in_progress: 'En cours',
    completed: 'Terminée',
    expired: 'Expirée',
  };

  return (
    <ScrollView className="flex-1 bg-vanz-iceblue">
      <View className="p-6 pt-16 bg-vanz-navy rounded-b-[40px]">
        <Text className="text-vanz-iceblue text-3xl font-bold mb-1">Bonjour !</Text>
        <Text className="text-vanz-iceblue/70 text-lg mb-6">Que souhaitez-vous transporter ?</Text>
        
        <TouchableOpacity 
          onPress={() => router.push('/(client)/create-job/')}
          className="bg-vanz-teal w-full p-4 rounded-xl flex-row items-center justify-center shadow-lg active:opacity-90"
        >
          <Text className="text-white text-lg font-bold">+ Publier un Job</Text>
        </TouchableOpacity>
      </View>

      <View className="p-6">
        <Text className="text-vanz-navy text-xl font-bold mb-4">Catégories</Text>
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {categories.map((cat, i) => (
            <TouchableOpacity key={i} className="w-[48%] bg-white p-4 rounded-2xl shadow-sm items-center">
              <Text className="text-3xl mb-2">{cat.icon}</Text>
              <Text className="text-vanz-navy font-semibold">{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-vanz-navy text-xl font-bold mt-8 mb-4">Vos dernières missions</Text>
        
        {loading ? (
          <View className="bg-white p-6 rounded-2xl shadow-sm items-center justify-center">
            <ActivityIndicator color="#2BBFDF" />
          </View>
        ) : recentJobs.length > 0 ? (
          <View className="gap-3">
            {recentJobs.map(job => (
              <TouchableOpacity
                key={job.id}
                onPress={() => router.push(`/(client)/job/${job.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-vanz-navy font-bold" numberOfLines={1}>
                    {job.service_type || 'Mission'}
                  </Text>
                  <Text className="text-vanz-navy/60 text-sm" numberOfLines={1}>
                    {job.pickup_address || 'Départ'} → {job.dropoff_address || 'Arrivée'}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-vanz-teal font-bold">{job.budget} TND</Text>
                  <Text className="text-vanz-navy/50 text-xs">{statusLabels[job.status] || job.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="bg-white p-6 rounded-2xl shadow-sm items-center justify-center">
            <Text className="text-vanz-navy/50 text-center">Aucune mission pour le moment.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
