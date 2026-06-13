import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { datasql } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n } from '@/i18n';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import PressableCard from '@/components/ui/PressableCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: { job_id?: string; conversation_id?: string } | null;
  read_at: string | null;
  created_at: string;
};

/** Pick an emoji for a notification based on keywords in its type. */
function iconForType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('bid') || t.includes('offre')) return '📨';
  if (t.includes('job') || t.includes('mission') || t.includes('course')) return '🚚';
  if (t.includes('pay') || t.includes('wallet') || t.includes('withdraw') || t.includes('retrait')) return '💰';
  if (t.includes('review') || t.includes('rating') || t.includes('avis')) return '⭐';
  if (t.includes('remind') || t.includes('rappel') || t.includes('schedule')) return '⏰';
  if (t.includes('sos') || t.includes('alert')) return '🚨';
  if (t.includes('referral') || t.includes('parrain')) return '🎁';
  if (t.includes('message') || t.includes('chat')) return '💬';
  return '🔔';
}

/** Locale-aware "time ago" label. */
function timeAgo(iso: string, ar: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return ar ? 'الآن' : "À l'instant";
  if (m < 60) return ar ? `منذ ${m} د` : `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return ar ? `منذ ${h} س` : `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return ar ? `منذ ${d} ي` : `Il y a ${d} j`;
  return new Date(iso).toLocaleDateString(ar ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short' });
}

interface Props {
  /** Resolves a route for a notification when tapped (mode-specific job/chat paths). */
  resolveHref?: (n: AppNotification) => string | null;
}

export default function NotificationsView({ resolveHref }: Props) {
  const { session } = useAuthStore();
  const { locale } = useI18n();
  const router = useRouter();
  const ar = locale === 'ar';
  const isRtl = ar;

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = session?.user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await datasql
        .from('notifications')
        .select('id, type, title, body, data, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setItems((data || []) as AppNotification[]);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime: prepend newly inserted notifications for this user.
  useEffect(() => {
    if (!userId) return;
    const channel = datasql
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => setItems((prev) => [payload.new as AppNotification, ...prev])
      )
      .subscribe();
    return () => {
      datasql.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    const { error } = await datasql
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) {
      console.error('Failed to mark all read:', error);
      fetchNotifications(); // resync on failure
    }
  };

  const handlePress = async (n: AppNotification) => {
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: now } : x)));
      datasql.from('notifications').update({ read_at: now }).eq('id', n.id).then(({ error }) => {
        if (error) console.error('Failed to mark read:', error);
      });
    }
    const href = resolveHref?.(n);
    if (href) router.push(href as never);
  };

  if (loading) {
    return (
      <View className="flex-1 px-5 pt-5">
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {unreadCount > 0 && (
        <View className={`px-5 pt-4 pb-1 flex-row items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <Text className="text-vanz-navy/50 font-bold text-xs uppercase tracking-wider">
            {unreadCount} {ar ? 'غير مقروءة' : unreadCount > 1 ? 'non lues' : 'non lue'}
          </Text>
          <TouchableOpacity onPress={markAllRead} className="active:opacity-70">
            <Text className="text-vanz-teal font-extrabold text-sm">
              {ar ? 'تحديد الكل كمقروء' : 'Tout marquer comme lu'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications();
            }}
            tintColor="#38B6FF"
          />
        }
        renderItem={({ item, index }) => {
          const unread = !item.read_at;
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify()}>
              <PressableCard
                onPress={() => handlePress(item)}
                className={`mb-3 overflow-hidden border ${unread ? 'bg-vanz-teal/5 border-vanz-teal/20' : 'bg-white border-gray-100'}`}
              >
                <View className={`p-4 flex-row items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ml-3 ${unread ? 'bg-vanz-teal/15' : 'bg-gray-50'}`}>
                    <Text className="text-xl">{iconForType(item.type)}</Text>
                  </View>
                  <View className="flex-1">
                    <View className={`flex-row items-center justify-between mb-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <Text className={`font-extrabold text-base flex-1 ${unread ? 'text-vanz-navy' : 'text-vanz-navy/80'} ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {unread && <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal ml-2 mr-2" />}
                    </View>
                    <Text className={`text-vanz-navy/60 text-sm font-medium leading-snug mb-1.5 ${isRtl ? 'text-right' : ''}`} numberOfLines={3}>
                      {item.body}
                    </Text>
                    <Text className={`text-gray-400 font-bold text-[11px] ${isRtl ? 'text-right' : ''}`}>
                      {timeAgo(item.created_at, ar)}
                    </Text>
                  </View>
                </View>
              </PressableCard>
            </Animated.View>
          );
        }}
        ListEmptyComponent={() => (
          <Animated.View entering={FadeInDown} className="items-center justify-center py-24">
            <View className="w-28 h-28 bg-white rounded-full items-center justify-center shadow-card mb-6">
              <Text className="text-5xl">🔕</Text>
            </View>
            <Text className="text-vanz-navy/40 text-center text-sm font-semibold px-10">
              {ar ? 'لا توجد إشعارات بعد.' : 'Aucune notification pour le moment.'}
            </Text>
          </Animated.View>
        )}
      />
    </View>
  );
}
