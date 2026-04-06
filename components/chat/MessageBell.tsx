'use client';

import { useState, useEffect } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function MessageBell({ userId }: { userId?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeUserId, setActiveUserId] = useState<string | null>(userId || null);
  const locale = useLocale();

  useEffect(() => {
    const initFetch = async () => {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }
      if (!uid) return;
      setActiveUserId(uid);

      // Fetch initial unread count for conversations participant is in
      // 1. Get conversations user is in
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`user_id.eq.${uid},driver_id.eq.${uid}`);
      
      const convIds = convs?.map(c => c.id) || [];
      if (convIds.length === 0) {
        setUnreadCount(0);
        return;
      }

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .is('read_at', null)
        .neq('sender_id', uid);

      setUnreadCount(count || 0);

      // Realtime subscription for conversation updates
      const channel = supabase.channel(`msg_bell_${uid}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, async (payload) => {
           // Re-fetch count for accuracy if message is in one of our conversations
           if (convIds.includes(payload.new.conversation_id)) {
             const { count: newCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .in('conversation_id', convIds)
              .is('read_at', null)
              .neq('sender_id', uid);
             
             setUnreadCount(newCount || 0);
           }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    initFetch();
  }, [userId]);

  if (!activeUserId) return null;

  return (
    <Link 
      href={`/${locale}/messages`}
      className="relative p-2 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-all focus:outline-none"
      aria-label="Messages"
    >
      <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-vanz-yellow text-[10px] md:text-xs font-black text-vanz-navy border-2 border-vanz-teal animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
