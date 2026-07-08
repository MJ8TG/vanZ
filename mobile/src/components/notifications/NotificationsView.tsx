import { colors } from '@/theme/colors';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useI18n, type Locale } from '@/i18n';
import { NotificationService, type AppNotification } from '@/modules/notifications/notificationService';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import PressableCard from '@/components/ui/PressableCard';
import EmptyState from '@/components/ui/EmptyState';
import Row from '@/components/ui/Row';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Inbox, Truck, Wallet, Star, Clock, Siren, Gift, MessageCircle, CheckCircle,
  AlertTriangle, ClipboardList, Bell, BellOff, type LucideIcon,
} from 'lucide-react-native';

/** Pick a lucide icon for a notification based on keywords in its type. */
function iconForType(type: string): LucideIcon {
  const t = type.toLowerCase();
  if (t.includes('bid') || t.includes('offre')) return Inbox;
  if (t.includes('job') || t.includes('mission') || t.includes('course')) return Truck;
  if (t.includes('pay') || t.includes('wallet') || t.includes('withdraw') || t.includes('retrait')) return Wallet;
  if (t.includes('review') || t.includes('rating') || t.includes('avis')) return Star;
  if (t.includes('remind') || t.includes('rappel') || t.includes('schedule')) return Clock;
  if (t.includes('sos') || t.includes('alert')) return Siren;
  if (t.includes('referral') || t.includes('parrain')) return Gift;
  if (t.includes('message') || t.includes('chat')) return MessageCircle;
  if (t.includes('approved') || t.includes('activ')) return CheckCircle;
  if (t.includes('rejected') || t.includes('rejet')) return AlertTriangle;
  if (t.includes('driver') || t.includes('chauffeur') || t.includes('document') || t.includes('verif')) return ClipboardList;
  return Bell;
}

/** Locale-aware "time ago" label. Module-scope (no hook context), so it reads
 *  the i18n store directly via getState() rather than the useI18n() hook. */
function timeAgo(iso: string, locale: Locale): string {
  const { t } = useI18n.getState();
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('notifications.justNow');
  if (m < 60) return t('notifications.minAgo', { m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('notifications.hoursAgo', { h });
  const d = Math.floor(h / 24);
  if (d < 7) return t('notifications.daysAgo', { d });
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short' });
}

interface Props {
  /** Resolves a route for a notification when tapped (mode-specific job/chat paths). */
  resolveHref?: (n: AppNotification) => string | null;
}

export default function NotificationsView({ resolveHref }: Props) {
  const { session } = useAuthStore();
  const { t, locale } = useI18n();
  const router = useRouter();
  const isRtl = locale === 'ar';

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = session?.user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setItems(await NotificationService.fetch(userId));
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
    return NotificationService.subscribeToInserts(userId, (n) => setItems((prev) => [n, ...prev]));
  }, [userId]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    try {
      await NotificationService.markAllRead(userId, now);
    } catch (e) {
      console.error('Failed to mark all read:', e);
      fetchNotifications(); // resync on failure
    }
  };

  const handlePress = async (n: AppNotification) => {
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: now } : x)));
      NotificationService.markRead(n.id, now).catch((e) => {
        if (e) console.error('Failed to mark read:', e);
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
        <Row className="px-5 pt-4 pb-1 items-center justify-between">
          <Text className="text-content-secondary font-bold text-xs uppercase tracking-wider">
            {unreadCount} {t(unreadCount > 1 ? 'notifications.unreadPlural' : 'notifications.unreadSingular')}
          </Text>
          <TouchableOpacity onPress={markAllRead} className="active:opacity-70">
            <Text className="text-vanz-teal font-extrabold text-sm">
              {t('notifications.markAllRead')}
            </Text>
          </TouchableOpacity>
        </Row>
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
            tintColor={colors.teal}
          />
        }
        renderItem={({ item, index }) => {
          const unread = !item.read_at;
          const NIcon = iconForType(item.type);
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).springify()}>
              <PressableCard
                onPress={() => handlePress(item)}
                className={`mb-3 overflow-hidden border ${unread ? 'bg-vanz-teal/5 border-vanz-teal/20' : 'bg-surface-elevated border-line'}`}
              >
                <Row className="p-4 items-start">
                  <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ml-3 ${unread ? 'bg-vanz-teal/15' : 'bg-surface-sunken'}`}>
                    <NIcon size={20} color={unread ? colors.teal : colors.muted} strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Row className="items-center justify-between mb-0.5">
                      <Text className={`font-extrabold text-base flex-1 ${unread ? 'text-content' : 'text-vanz-navy/80'} ${isRtl ? 'text-right' : ''}`} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {unread && <View className="w-2.5 h-2.5 rounded-full bg-vanz-teal ml-2 mr-2" />}
                    </Row>
                    <Text className={`text-content-secondary text-sm font-medium leading-snug mb-1.5 ${isRtl ? 'text-right' : ''}`} numberOfLines={3}>
                      {item.body}
                    </Text>
                    <Text className={`text-content-muted font-bold text-[11px] ${isRtl ? 'text-right' : ''}`}>
                      {timeAgo(item.created_at, locale)}
                    </Text>
                  </View>
                </Row>
              </PressableCard>
            </Animated.View>
          );
        }}
        ListEmptyComponent={() => <EmptyState Icon={BellOff} title={t('notifications.empty')} />}
      />
    </View>
  );
}
