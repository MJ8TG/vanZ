import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/store/useAuthStore';
import { ChatService, type ConversationPreview } from '@/modules/chat/chatService';
import PressableCard from '@/components/ui/PressableCard';
import { ShimmerCard } from '@/components/ui/ShimmerPlaceholder';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Props = {
  onSelect: (conversation: ConversationPreview) => void;
};

export default function ConversationsListView({ onSelect }: Props) {
  const { t, locale } = useI18n();
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isRtl = locale === 'ar';

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await ChatService.fetchConversations(userId);
      setConversations(data);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    // Refresh list previews/badges on any incoming message
    const unsubscribe = ChatService.subscribeToAllMessages(load);
    return unsubscribe;
  }, [load]);

  if (loading) {
    return (
      <View className="p-5 gap-4">
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-10 pb-24">
        <View className="w-20 h-20 bg-vanz-teal/10 rounded-full items-center justify-center mb-5">
          <Text className="text-3xl">💬</Text>
        </View>
        <Text className="text-vanz-navy font-black text-lg mb-2">{t('chat.emptyTitle')}</Text>
        <Text className="text-vanz-navy/50 font-medium text-sm text-center leading-relaxed">
          {t('chat.emptyDesc')}
        </Text>
      </View>
    );
  }

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    return sameDay
      ? date.toLocaleTimeString(isRtl ? 'ar-TN' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString(isRtl ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <FlatList
      data={conversations}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 12 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor="#38B6FF"
        />
      }
      renderItem={({ item, index }) => {
        const initial = item.other_party_name[0]?.toUpperCase() || 'V';
        return (
          <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
            <PressableCard
              onPress={() => onSelect(item)}
              className={`p-4 rounded-2xl flex-row items-center ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <View className="w-14 h-14 bg-vanz-teal/10 rounded-full items-center justify-center mr-3 ml-3 border-2 border-vanz-teal/20">
                <Text className="text-vanz-navy font-black text-xl">{initial}</Text>
              </View>

              {/* Body */}
              <View className={`flex-1 ${isRtl ? 'items-end' : ''}`}>
                <View className={`flex-row items-center justify-between w-full ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text className="text-vanz-navy font-extrabold text-base" numberOfLines={1}>
                    {item.other_party_name}
                  </Text>
                  <Text className="text-gray-400 font-semibold text-xs">{formatTime(item.last_message_time)}</Text>
                </View>
                <View className={`flex-row items-center justify-between w-full mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Text
                    className={`text-sm flex-1 ${item.unread_count > 0 ? 'text-vanz-navy font-bold' : 'text-gray-400 font-medium'} ${isRtl ? 'text-right' : ''}`}
                    numberOfLines={1}
                  >
                    {item.last_message || t('chat.noMessagesYet')}
                  </Text>
                  {item.unread_count > 0 && (
                    <View className="bg-vanz-teal min-w-[22px] h-[22px] px-1.5 rounded-full items-center justify-center ml-2 mr-2">
                      <Text className="text-white font-black text-[11px]">{item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </PressableCard>
          </Animated.View>
        );
      }}
    />
  );
}
