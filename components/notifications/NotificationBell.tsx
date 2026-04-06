'use client';

import { useState, useEffect, useRef } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  user_id: string;
}

export default function NotificationBell({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // If no explicit userId, try to fetch current user
    const initFetch = async () => {
      let activeUserId = userId;
      if (!activeUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        activeUserId = user?.id;
      }

      if (!activeUserId) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', activeUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter(n => !n.read_at).length);
      }

      // Realtime subscription
      const channel = supabase.channel(`notifications:user-${activeUserId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${activeUserId}`
        }, (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // Keep last 20
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();
      
      channelRef.current = channel;
    };

    initFetch();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = async () => {
    setIsOpen(!isOpen);
    
    // Mark as read when opening
    if (!isOpen && unreadCount > 0) {
      const activeUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (activeUserId) {
        setUnreadCount(0); // Optimistic UI update
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);

        if (unreadIds.length > 0) {
           await supabase.from('notifications')
             .update({ read_at: new Date().toISOString() })
             .in('id', unreadIds);
           
           setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        }
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative p-2 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-all focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 md:w-6 md:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] md:text-xs font-bold text-white border-2 border-vanz-teal animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-[fade-in-up_200ms_ease-out]">
          <div className="p-3 md:p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-[#051E3C] text-sm md:text-base">Notifications</h3>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto w-full">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y divide-gray-50 flex flex-col w-full">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 md:p-4 hover:bg-gray-50 transition w-full ${!n.read_at ? 'bg-blue-50/50' : ''}`}>
                    <p className="text-xs md:text-sm font-bold text-[#051E3C]">{n.title}</p>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5 break-words w-full overflow-hidden text-ellipsis leading-snug max-w-full">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                       {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
