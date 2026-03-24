"use client";

import { useEffect, useRef, useState } from "react";
import { datasql } from "@/lib/datasql";
import { PlayCircle, Image as ImageIcon, MapPin, Send, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  sender_type: "client" | "driver" | "system";
  sender_id: string;
  type: "text" | "voice" | "photo" | "location" | "system";
  content: string;
  media_url?: string;
  media_duration?: number;
  read_at?: string;
  created_at: string;
}

interface ChatScreenProps {
  conversationId: string;
  jobId: string;
  currentUserId: string;
  currentUserType: "client" | "driver";
  phase: "pre_bid" | "post_acceptance" | "archived";
  paymentMethod: string;
}

const getQuickReplies = (phase: string, senderType: string) => {
  if (phase === 'pre_bid' && senderType === 'driver')
    return ['Je suis disponible', 'Prix négociable', "J'ai une question"];
  if (phase === 'pre_bid' && senderType === 'client')
    return ["D'accord", 'À quelle heure ?', 'Négociable ?'];
  if (phase === 'post_acceptance')
    return ['Je suis en route', 'Je suis arrivé', 'Job terminé', 'Merci !'];
  return [];
};

export default function ChatScreen({ conversationId, jobId, currentUserId, currentUserType, phase, paymentMethod }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputStr, setInputStr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const scrollViewRef = useRef<HTMLDivElement>(null);

  const canSendMedia = phase === 'post_acceptance';
  const quickReplies = getQuickReplies(phase, currentUserType);

  useEffect(() => {
    // 1. Mark unread as read immediately
    const markAsRead = async () => {
      await datasql.from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .is('read_at', null)
        .neq('sender_id', currentUserId);
    };
    markAsRead();

    // 2. Fetch history
    const fetchHistory = async () => {
      const { data } = await datasql.from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }); // We map regular order, then CSS flex-col-reverse
      if (data) setMessages(data as Message[]);
    };
    fetchHistory();

    // 3. Realtime Hook Subscription
    const channel = datasql
      .channel(`public:messages:conversation_id=eq.${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          // Re-trigger read receipts on new incoming msg if it's open
          if (payload.new.sender_id !== currentUserId) {
            markAsRead();
          }
        }
      )
      .subscribe();

    return () => { datasql.removeChannel(channel); }; // Vital cleanup logic
  }, [conversationId, currentUserId]);

  // Handle auto-scrolling (Using inverted flex-col-reverse makes CSS handle bottom-sticking naturally)
  // but if we are manually appending we just ensure we scroll to bottom.

  const sendMessage = async (contentToSend: string, typeToSend: "text" | "voice" | "photo" | "location" = "text") => {
    if (!contentToSend.trim() && typeToSend === "text") return;
    setErrorMsg("");

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: currentUserId,
          sender_type: currentUserType,
          type: typeToSend,
          content: contentToSend
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      
      setInputStr("");
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const selectPaymentMethod = async (method: "Paymee" | "Cash") => {
    // 1. PATCH jobs
    await datasql.from('jobs').update({ payment_method: method }).eq('id', jobId);
    
    // 2. Inject system message
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        sender_id: null,
        sender_type: "system",
        type: "system",
        content: `Paiement ${method} sélectionné`
      })
    });
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-100 rounded-3xl bg-gray-50 overflow-hidden shadow-sm relative">
      
      {/* Messages View Port: Inverted Scroll View using flex-col-reverse */}
      <div 
        ref={scrollViewRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-3"
      >
        {/* Render payment UI card if payment is TBD, we are post acceptance, and no payment selected yet */}
        {phase === 'post_acceptance' && paymentMethod === 'tbd' && currentUserType === 'client' && (
          <div className="bg-white border-2 border-vanz-teal p-5 rounded-2xl shadow-sm my-4 mx-auto w-full max-w-sm text-center">
            <h4 className="font-bold text-vanz-navy mb-2">Choisissez votre mode de paiement</h4>
            <p className="text-sm text-gray-500 mb-4">Votre offre est acceptée ! Pour continuer, validez le paiement.</p>
            <div className="space-y-2">
              <button 
                onClick={() => selectPaymentMethod("Paymee")}
                className="w-full bg-vanz-teal text-white font-bold py-3 rounded-xl transition-all hover:bg-vanz-teal/90 active:scale-95"
              >
                Payer en ligne (Paymee)
              </button>
              <button 
                onClick={() => selectPaymentMethod("Cash")}
                className="w-full bg-vanz-ice text-vanz-navy font-bold py-3 rounded-xl transition-all border border-transparent hover:border-gray-200 active:scale-95"
              >
                Cash à la livraison
              </button>
            </div>
          </div>
        )}

        {messages.slice().reverse().map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const isSystem = msg.type === "system";

          if (isSystem) {
            return (
              <div key={msg.id} className="w-full flex justify-center my-2">
                <span className="bg-gray-200 text-gray-500 text-xs px-4 py-1.5 rounded-full font-medium text-center shadow-sm">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                isMe ? 'bg-vanz-teal text-white rounded-br-sm' : 'bg-white text-vanz-navy border border-gray-100 rounded-bl-sm'
              }`}>
                {msg.type === 'text' && (
                  <p className="text-[15px]">{msg.content}</p>
                )}
                
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-2">
                    <button 
                      className={`p-2 rounded-full ${isMe ? 'bg-white text-vanz-teal' : 'bg-gray-100 text-gray-500'}`}
                      aria-label="Lire le message vocal"
                      title="Lire"
                    >
                      <PlayCircle className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-medium font-mono">{msg.media_duration}s</span>
                  </div>
                )}

                {msg.type === 'photo' && (
                  <div className="relative group cursor-pointer overflow-hidden rounded-xl bg-gray-100 h-32 w-32 border border-black/5">
                    {/* Placeholder for actual image rendered via media_url */}
                    <ImageIcon className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300 group-hover:scale-110 transition-transform" />
                  </div>
                )}

                {msg.type === 'location' && (
                  <div className="flex items-center gap-3 bg-black/5 p-2 rounded-xl">
                    <div className="w-10 h-10 bg-vanz-yellow rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-vanz-navy" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Localisation</span>
                      <span className="text-[10px] opacity-70 truncate w-24">Accéder à la carte</span>
                    </div>
                  </div>
                )}
                
                <span className={`text-[10px] mt-1 block text-right w-full ${isMe ? 'text-teal-100' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-xs font-bold text-center border-t border-red-100">
          {errorMsg}
        </div>
      )}

      {/* Input Ribbon */}
      <div className="bg-white border-t border-gray-200">
        {/* Quick Replies */}
        {quickReplies.length > 0 && (
          <div className="flex overflow-x-auto gap-2 px-4 py-3 no-scrollbar border-b border-gray-50">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => sendMessage(qr, "text")}
                className="whitespace-nowrap px-4 py-1.5 bg-vanz-ice hover:bg-gray-200 text-vanz-navy rounded-full text-xs font-semibold transition-colors border border-gray-100/50 shadow-sm"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 flex items-center gap-3">
          {canSendMedia ? (
            <button 
              className="p-2 text-gray-400 hover:text-vanz-teal transition-colors rounded-full hover:bg-vanz-ice"
              aria-label="Joindre une photo"
              title="Joindre une photo"
            >
               <ImageIcon className="w-5 h-5" />
            </button>
          ) : (
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight w-12 text-center border-r border-gray-100 pr-3">
               Tchat Bridé
             </div>
          )}
          
          <input 
            type="text" 
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(inputStr); }}
            placeholder={canSendMedia ? "Écrivez un message..." : "Messages filtrés en phase d'offre..."}
            className="flex-1 bg-gray-50 border-transparent focus:bg-white focus:border-vanz-teal focus:ring-2 focus:ring-vanz-teal/20 rounded-xl px-4 py-3 outline-none text-sm transition-all"
            disabled={phase === 'archived'}
            aria-label="Zone de saisie du message"
          />
          
          <button 
            disabled={!inputStr.trim() || phase === 'archived'}
            onClick={() => sendMessage(inputStr)}
            className="p-3 bg-vanz-teal text-white rounded-xl shadow-sm hover:shadow hover:bg-vanz-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label="Envoyer le message"
            title="Envoyer"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
