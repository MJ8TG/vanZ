import { datasql } from '@/lib/supabase';
import { authApiFetch } from '@/lib/api';

export type ConversationPhase = 'pre_bid' | 'post_acceptance' | 'archived';

export type ConversationPreview = {
  id: string;
  job_id: string;
  client_id: string;
  driver_id: string;
  phase: ConversationPhase;
  service_type?: string | null;
  other_party_name: string;
  last_message: string;
  last_message_time?: string;
  unread_count: number;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'client' | 'driver' | 'system';
  type: 'text' | 'system' | 'image' | 'audio' | 'location';
  content: string;
  media_url?: string | null;
  read_at?: string | null;
  created_at: string;
};

export type ConversationDetails = {
  id: string;
  job_id: string;
  client_id: string;
  driver_id: string;
  phase: ConversationPhase;
  jobs?: { id: string; payment_method?: string | null } | null;
};

export class ChatService {
  /** Conversations for current user (client or driver), enriched like the web app. */
  static async fetchConversations(userId: string): Promise<ConversationPreview[]> {
    const { data: convs, error } = await datasql
      .from('conversations')
      .select('*, jobs (service_type)')
      .or(`client_id.eq.${userId},driver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await Promise.all(
      (convs || []).map(async (c: any) => {
        const isClient = c.client_id === userId;
        const otherPartyId = isClient ? c.driver_id : c.client_id;

        const [{ data: otherUser }, { data: lastMsg }, { count }] = await Promise.all([
          datasql
            .from('users_public')
            .select('first_name, last_name')
            .eq('id', otherPartyId)
            .single(),
          datasql
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          datasql
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .is('read_at', null)
            .neq('sender_id', userId),
        ]);

        return {
          id: c.id,
          job_id: c.job_id,
          client_id: c.client_id,
          driver_id: c.driver_id,
          phase: (c.phase || 'pre_bid') as ConversationPhase,
          service_type: c.jobs?.service_type ?? null,
          other_party_name: otherUser
            ? `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim() || 'Utilisateur VanZ'
            : 'Utilisateur VanZ',
          last_message: lastMsg?.content || '',
          last_message_time: lastMsg?.created_at,
          unread_count: count || 0,
        } as ConversationPreview;
      })
    );

    return enriched;
  }

  static async fetchConversation(conversationId: string): Promise<ConversationDetails> {
    const { data, error } = await datasql
      .from('conversations')
      .select('*, jobs(id, payment_method)')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data as ConversationDetails;
  }

  static async fetchMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await datasql
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as ChatMessage[];
  }

  /** Mark all messages from the other party as read. */
  static async markRead(conversationId: string, userId: string) {
    await datasql
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('read_at', null)
      .neq('sender_id', userId);
  }

  /**
   * Send via the web API so the anti-abuse filter (no phone numbers / links
   * before bid acceptance) is enforced server-side, exactly like the web app.
   */
  static async sendMessage(params: {
    conversation_id: string;
    sender_id: string;
    sender_type: 'client' | 'driver';
    content: string;
  }) {
    const res = await authApiFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ ...params, type: 'text' }),
    });

    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload?.error || "Impossible d'envoyer le message.");
    }
    return payload.message as ChatMessage;
  }

  /** Realtime: new messages in a conversation. Returns an unsubscribe fn. */
  static subscribeToMessages(conversationId: string, onMessage: (msg: ChatMessage) => void) {
    const channel = datasql
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => onMessage(payload.new as ChatMessage)
      )
      .subscribe();

    return () => {
      datasql.removeChannel(channel);
    };
  }

  /** Realtime: phase change (pre_bid → post_acceptance). Returns an unsubscribe fn. */
  static subscribeToPhase(conversationId: string, onPhase: (phase: ConversationPhase) => void) {
    const channel = datasql
      .channel(`conv_phase_${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conversationId}` },
        (payload: any) => onPhase(payload.new.phase as ConversationPhase)
      )
      .subscribe();

    return () => {
      datasql.removeChannel(channel);
    };
  }

  /** Realtime: any new message anywhere (to refresh the list). Returns an unsubscribe fn. */
  static subscribeToAllMessages(onAny: () => void) {
    const channel = datasql
      .channel('conversations_list_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, onAny)
      .subscribe();

    return () => {
      datasql.removeChannel(channel);
    };
  }
}
