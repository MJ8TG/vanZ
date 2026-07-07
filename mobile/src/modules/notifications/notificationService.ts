import { datasql } from '@/lib/supabase';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: { job_id?: string; conversation_id?: string } | null;
  read_at: string | null;
  created_at: string;
};

export class NotificationService {
  static async fetch(userId: string): Promise<AppNotification[]> {
    const { data, error } = await datasql
      .from('notifications')
      .select('id, type, title, body, data, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data || []) as AppNotification[];
  }

  /** Subscribes to new notifications for this user; returns an unsubscribe fn. */
  static subscribeToInserts(userId: string, onInsert: (n: AppNotification) => void): () => void {
    const channel = datasql
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => onInsert(payload.new as AppNotification)
      )
      .subscribe();
    return () => {
      datasql.removeChannel(channel);
    };
  }

  static async markAllRead(userId: string, readAt: string): Promise<void> {
    const { error } = await datasql
      .from('notifications')
      .update({ read_at: readAt })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) throw error;
  }

  static async markRead(id: string, readAt: string): Promise<void> {
    const { error } = await datasql.from('notifications').update({ read_at: readAt }).eq('id', id);
    if (error) throw error;
  }
}
