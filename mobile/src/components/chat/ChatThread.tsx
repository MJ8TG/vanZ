import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ChatService,
  type ChatMessage,
  type ConversationDetails,
  type ConversationPhase,
} from '@/modules/chat/chatService';
import GradientHeader from '@/components/ui/GradientHeader';
import Animated, { FadeInUp } from 'react-native-reanimated';

type Props = {
  conversationId: string;
  userType: 'client' | 'driver';
};

export default function ChatThread({ conversationId, userType }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const isRtl = locale === 'ar';
  const phase: ConversationPhase = conversation?.phase || 'pre_bid';

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    if (!conversationId || !userId) return;
    let active = true;

    (async () => {
      try {
        const [conv, msgs] = await Promise.all([
          ChatService.fetchConversation(conversationId),
          ChatService.fetchMessages(conversationId),
        ]);
        if (!active) return;
        setConversation(conv);
        setMessages(msgs);
        ChatService.markRead(conversationId, userId);
      } catch (e) {
        console.error('Failed to load chat:', e);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsubMessages = ChatService.subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.sender_id !== userId) {
        ChatService.markRead(conversationId, userId);
      }
    });
    const unsubPhase = ChatService.subscribeToPhase(conversationId, (newPhase) => {
      setConversation((prev) => (prev ? { ...prev, phase: newPhase } : prev));
    });

    return () => {
      active = false;
      unsubMessages();
      unsubPhase();
    };
  }, [conversationId, userId]);

  useEffect(() => {
    if (messages.length > 0) scrollToEnd();
  }, [messages.length, scrollToEnd]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !userId || sending) return;

    setSending(true);
    setInput('');
    try {
      const sent = await ChatService.sendMessage({
        conversation_id: conversationId,
        sender_id: userId,
        sender_type: userType,
        content,
      });
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setInput(content); // restore so the user doesn't lose their text
      Alert.alert(t('common.error'), message);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'system' || item.sender_type === 'system') {
      return (
        <View className="items-center my-2 px-8">
          <View className="bg-vanz-navy/5 px-4 py-2 rounded-full">
            <Text className="text-vanz-navy/60 text-xs font-bold text-center">{item.content}</Text>
          </View>
        </View>
      );
    }

    const isMine = item.sender_id === userId;
    return (
      <Animated.View
        entering={FadeInUp.springify()}
        className={`px-5 my-1 ${isMine ? 'items-end' : 'items-start'}`}
      >
        <View
          className={`max-w-[80%] px-4 py-3 ${
            isMine
              ? 'bg-vanz-teal rounded-t-2xl rounded-bl-2xl rounded-br-md'
              : 'bg-white border border-gray-100 rounded-t-2xl rounded-br-2xl rounded-bl-md shadow-card'
          }`}
        >
          <Text className={`text-[15px] font-medium leading-snug ${isMine ? 'text-white' : 'text-vanz-navy'}`}>
            {item.content}
          </Text>
          <Text className={`text-[10px] mt-1 font-semibold ${isMine ? 'text-white/70' : 'text-gray-300'} ${isMine ? 'text-right' : ''}`}>
            {new Date(item.created_at).toLocaleTimeString(isRtl ? 'ar-TN' : 'fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-vanz-iceblue">
      <GradientHeader title={t('chat.title')} backButton={() => router.back()} />

      {/* Pre-acceptance safety banner — mirrors the web anti-abuse rule */}
      {phase === 'pre_bid' && (
        <View className="bg-vanz-yellow/15 border-b border-vanz-yellow/30 px-5 py-2.5">
          <Text className={`text-vanz-navy/70 text-xs font-bold ${isRtl ? 'text-right' : ''}`}>
            🔒 {t('chat.preBidNotice')}
          </Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#38B6FF" size="large" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={scrollToEnd}
          ListEmptyComponent={
            <View className="items-center justify-center pt-24 px-10">
              <Text className="text-3xl mb-3">👋</Text>
              <Text className="text-vanz-navy/40 font-semibold text-sm text-center">
                {t('chat.startConversation')}
              </Text>
            </View>
          }
        />
      )}

      {/* Composer */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <View
          className={`flex-row items-end px-4 pt-3 bg-white border-t border-gray-100 ${isRtl ? 'flex-row-reverse' : ''}`}
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            className={`flex-1 bg-vanz-iceblue rounded-2xl px-4 py-3 text-[15px] font-medium text-vanz-navy max-h-28 ${isRtl ? 'text-right' : ''}`}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            className={`w-12 h-12 rounded-full items-center justify-center ml-3 mr-3 ${
              input.trim() && !sending ? 'bg-vanz-teal shadow-glow-teal' : 'bg-gray-200'
            }`}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white text-lg font-black">{isRtl ? '←' : '→'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
