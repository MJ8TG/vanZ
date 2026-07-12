import { colors } from '@/theme/colors';
import { useThemeColors } from '@/theme/useThemeColors';
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
import Row from '@/components/ui/Row';
import { Lock, Send, MessageCircle } from 'lucide-react-native';
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
  const c = useThemeColors();
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
          <View className="bg-surface-sunken px-4 py-2 rounded-full">
            <Text className="text-content-secondary text-xs font-bold text-center">{item.content}</Text>
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
              : 'bg-surface-elevated border border-line rounded-t-2xl rounded-br-2xl rounded-bl-md shadow-card'
          }`}
        >
          <Text className={`text-[15px] font-medium leading-snug ${isMine ? 'text-white' : 'text-content'}`}>
            {item.content}
          </Text>
          <Text className={`text-[10px] mt-1 font-semibold ${isMine ? 'text-white/70' : 'text-content-muted'} ${isMine ? 'text-right' : ''}`}>
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
    <View className="flex-1 bg-surface">
      <GradientHeader title={t('chat.title')} backButton={() => router.back()} />

      {/* Pre-acceptance safety banner — mirrors the web anti-abuse rule */}
      {phase === 'pre_bid' && (
        <View className="bg-vanz-yellow/15 border-b border-vanz-yellow/30 px-5 py-2.5">
          <Row className="items-center gap-2">
            <Lock size={13} color={c.textPrimary} strokeWidth={2.4} />
            <Text className="text-content-secondary text-xs font-bold flex-1">
              {t('chat.preBidNotice')}
            </Text>
          </Row>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.teal} size="large" />
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
              <View className="mb-3">
                <MessageCircle size={40} color={colors.slate} strokeWidth={1.8} />
              </View>
              <Text className="text-content-muted font-semibold text-sm text-center">
                {t('chat.startConversation')}
              </Text>
            </View>
          }
        />
      )}

      {/* Composer */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <Row
          className="items-end px-4 pt-3 bg-surface-elevated border-t border-line"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            className={`flex-1 bg-surface rounded-2xl px-4 py-3 text-[15px] font-medium text-content max-h-28 ${isRtl ? 'text-right' : ''}`}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            className={`w-12 h-12 rounded-full items-center justify-center ml-3 mr-3 ${
              input.trim() && !sending ? 'bg-vanz-teal shadow-glow-teal' : 'bg-gray-200'
            }`}
          >
            {sending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Send size={18} color={colors.white} strokeWidth={2.4} />
            )}
          </TouchableOpacity>
        </Row>
      </KeyboardAvoidingView>
    </View>
  );
}
