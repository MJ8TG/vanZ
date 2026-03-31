"use client";

import { useEffect, useState } from "react";
import { datasql } from "@/lib/datasql";
import { MessageCircle, User, Clock } from "lucide-react";

interface Conversation {
  id: string;
  job_id: string;
  driver_id: string;
  client_id: string;
  other_party_name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export default function ConversationsList({ currentUserId, onSelect }: { currentUserId: string, onSelect: (id: string) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // 1. Fetch conversations
      const { data: convs, error } = await datasql
        .from('conversations')
        .select(`
          *,
          jobs (service_type),
          client:users!client_id (first_name, last_name),
          driver:users!driver_id (first_name, last_name)
        `)
        .or(`client_id.eq.${currentUserId},driver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Fetch last messages & unread counts for each
      const enriched = await Promise.all((convs || []).map(async (c: any) => {
        const isClient = c.client_id === currentUserId;
        const otherParty = isClient ? c.driver : c.client;
        
        const { data: lastMsg } = await datasql
          .from('messages')
          .select('content, created_at, read_at, sender_id')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { count } = await datasql
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .is('read_at', null)
          .neq('sender_id', currentUserId);

        return {
          id: c.id,
          job_id: c.job_id,
          driver_id: c.driver_id,
          client_id: c.client_id,
          other_party_name: otherParty ? `${otherParty.first_name} ${otherParty.last_name}` : "Utilisateur VanZ",
          last_message: lastMsg?.content || "Aucun message",
          last_message_time: lastMsg?.created_at,
          unread_count: count || 0
        };
      }));

      setConversations(enriched);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Realtime subscription for list updates (new messages)
    const channel = datasql
      .channel('conversations_list_updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchConversations(); // Re-fetch to update previews and unread badges
        }
      )
      .subscribe();

    return () => { datasql.removeChannel(channel); };
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl w-full" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
        <div className="w-16 h-16 bg-vanz-ice rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-vanz-teal opacity-50" />
        </div>
        <h3 className="text-vanz-navy font-bold text-lg">Aucune conversation</h3>
        <p className="text-gray-500 text-sm max-w-[240px]">Vos messages avec les clients ou chauffeurs apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map(conv => (
        <button 
          key={conv.id} 
          onClick={() => onSelect(conv.id)}
          className="w-full text-left p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:border-vanz-teal/30 transition-all group active:scale-[0.98]"
        >
          {/* Avatar / UI Initials */}
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-vanz-navy text-vanz-yellow flex items-center justify-center font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
              {conv.other_party_name.split(' ').map(n => n[0]).join('')}
            </div>
            {conv.unread_count > 0 && (
              <span className="absolute -top-1 -right-1 bg-vanz-yellow text-vanz-navy font-black text-[10px] min-w-[20px] h-5 flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm animate-bounce">
                {conv.unread_count}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-vanz-navy truncate">{conv.other_party_name}</h4>
              {conv.last_message_time && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <p className={`text-sm truncate pr-2 ${conv.unread_count > 0 ? 'font-bold text-vanz-navy' : 'text-gray-500'}`}>
              {conv.last_message}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
