"use client";

import { useEffect, useState } from "react";
import { datasql } from "@/lib/datasql";

interface Conversation {
  id: string;
  driver_id: string;
  client_id: string;
  // We'll calculate the unread count locally or via a joined view
}

interface Message {
  conversation_id: string;
  read_at: string | null;
  sender_id: string;
}

export default function ConversationsList({ currentUserId }: { currentUserId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Standard fetch logic to populate the arrays initially
  }, []);

  // Unread badge count per conversation
  const getUnreadCount = (convId: string) => {
    return messages.filter(m => 
      m.conversation_id === convId && 
      !m.read_at && 
      m.sender_id !== currentUserId
    ).length;
  };

  return (
    <div className="space-y-2">
      {conversations.map(conv => {
        const unreadCount = getUnreadCount(conv.id);
        
        return (
          <div key={conv.id} className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm cursor-pointer hover:border-vanz-teal transition-colors">
            <div>
              <p className="font-bold text-vanz-navy">Conversation avec le chauffeur</p>
              <p className="text-sm text-gray-500 truncate w-48">Cliquez pour ouvrir le tchat...</p>
            </div>
            {unreadCount > 0 && (
              <span className="bg-vanz-yellow text-vanz-navy font-black text-xs min-w-[24px] h-6 flex items-center justify-center rounded-full px-2 shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
