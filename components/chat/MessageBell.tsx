'use client';

import { useState, useEffect } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function MessageBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const initFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch initial unread count
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null)
        .neq('sender_id', user.id);

      setUnreadCount(count || 0);

      // Realtime subscription for all messages involving this user
      // Note: We listen to ALL messages and filter in JS for simplicity on the global bell
      const channel = supabase.channel('msg_global_bell')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, async (payload) => {
           // We need to check if the message belongs to a conversation this user is in
           // but for the UI badge, we can just re-fetch the count for accuracy
           const { count: newCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .is('read_at', null)
            .neq('sender_id', user.id);
           
           setUnreadCount(newCount || 0);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    initFetch();
  }, []);

  if (!currentUserId) return null;

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
