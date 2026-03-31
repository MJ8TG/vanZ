"use client";

import { useEffect, useRef, useState } from "react";
import { datasql } from "@/lib/datasql";
import { uploadFile } from "@/lib/upload";
import { 
  PlayCircle, 
  Image as ImageIcon, 
  MapPin, 
  Send, 
  Mic, 
  StopCircle, 
  Trash2, 
  Check, 
  CheckCheck,
  Paperclip,
  Smile,
  X
} from "lucide-react";

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

const QUICK_REPLIES = {
  client: {
    pre_bid: [
      "Est-ce que le prix est négociable ? | هل السعر قابل للتفاوض؟",
      "Avez-vous des sangles ? | هل لديكم أحزمة تثبيت؟",
      "Pouvez-vous venir plus tôt ? | هل يمكنكم القدوم أبكر؟",
      "Le volume est-il suffisant ? | هل الحجم كافٍ؟"
    ],
    post_acceptance: [
      "Je suis à l'adresse indiquée. | أنا في العنوان المحدد.",
      "Voici la position exacte. | إليك الموقع الدقيق.",
      "Ok, j'attends. | حسناً، أنا في الانتظار.",
      "Je descends. | أنا نازل."
    ]
  },
  driver: {
    pre_bid: [
      "Il y a des escaliers au départ ? | هل يوجد سلالم في الانطلاق؟",
      "Je peux baisser le prix si on reporte. | يمكن تخفيض السعر للتأجيل.",
      "L'ascenseur est-il grand ? | هل المصعد كبير؟",
      "Besoin d'aide pour porter ? | هل تحتاج مساعدة في الحمل؟"
    ],
    post_acceptance: [
      "Je suis en route. | أنا في طريقي.",
      "Je suis arrivé. | لقد وصلت.",
      "Je suis garé en bas. | أنا متوقف في الأسفل.",
      "Êtes-vous prêt ? | هل أنت جاهز؟"
    ]
  }
};


export default function ChatScreen({ conversationId, jobId, currentUserId, currentUserType, phase, paymentMethod }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputStr, setInputStr] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const canSendMedia = phase === 'post_acceptance';

  // Mark messages as read
  const markAsRead = async () => {
    await datasql.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('read_at', null)
      .neq('sender_id', currentUserId);
  };

  useEffect(() => {
    markAsRead();

    // Fetch history
    const fetchHistory = async () => {
      const { data } = await datasql.from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    fetchHistory();

    // Realtime Hook
    const channel = datasql
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          if (payload.new.sender_id !== currentUserId) markAsRead();
        }
      )
      .subscribe();

    return () => { datasql.removeChannel(channel); };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string, type: Message['type'] = "text", mediaProps = {}) => {
    if (!content.trim() && type === "text") return;
    setErrorMsg("");

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: currentUserId,
          sender_type: currentUserType,
          type,
          content,
          ...mediaProps
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      
      setInputStr("");
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // --- Photo Upload ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");
    try {
      const path = `${currentUserId}/chat_${Date.now()}_${file.name}`;
      const url = await uploadFile('chat-media', path, file);
      await sendMessage("Photo partagée", "photo", { media_url: url });
    } catch (err: any) {
      setErrorMsg("Erreur d'upload: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- Voice Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setIsUploading(true);
        try {
          const path = `${currentUserId}/voice_${Date.now()}.webm`;
          const url = await uploadFile('chat-media', path, audioBlob);
          await sendMessage("Message vocal", "voice", { 
            media_url: url, 
            media_duration: recordingDuration 
          });
        } catch (err: any) {
          setErrorMsg("Erreur vocal: " + err.message);
        } finally {
          setIsUploading(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMsg("Accès micro refusé");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  // --- Helpers ---
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    msgs.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[700px] border border-gray-100 rounded-[2.5rem] bg-[#F7F9FB] overflow-hidden shadow-2xl relative">
      
      {/* Messages Window */}
      <div 
        ref={scrollViewRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth"
      >
        {Object.entries(messageGroups).map(([date, group]) => (
          <div key={date} className="space-y-4">
            <div className="flex justify-center">
              <span className="bg-white/80 backdrop-blur-sm text-gray-400 text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full font-black shadow-sm border border-gray-50">
                {date}
              </span>
            </div>
            
            {group.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId;
              const isSystem = msg.type === "system";
              
              if (isSystem) return (
                <div key={msg.id} className="w-full flex justify-center py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <span className="bg-vanz-ice/50 text-vanz-navy text-[11px] px-5 py-2 rounded-2xl font-bold border border-vanz-teal/10">
                    {msg.content}
                  </span>
                </div>
              );

              return (
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-300`}>
                  <div className={`relative max-w-[85%] px-4 py-3 shadow-xl ${
                    isMe 
                      ? 'bg-vanz-teal text-white rounded-3xl rounded-tr-none border-b-2 border-teal-600/20' 
                      : 'bg-white text-vanz-navy rounded-3xl rounded-tl-none border border-gray-100'
                  }`}>
                    {/* Message Content */}
                    {msg.type === 'text' && <p className="text-[15px] leading-relaxed font-medium">{msg.content}</p>}
                    
                    {msg.type === 'photo' && msg.media_url && (
                      <div className="rounded-2xl overflow-hidden mb-1 border border-black/5 bg-gray-50">
                        <img src={msg.media_url} alt="Shared" className="max-w-full h-auto max-h-60 object-cover" />
                      </div>
                    )}

                    {msg.type === 'voice' && (
                      <div className="flex items-center gap-3 py-1">
                        <button 
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${isMe ? 'bg-white text-vanz-teal' : 'bg-vanz-ice text-vanz-navy'}`}
                          title="Lire le message vocal"
                          aria-label="Lire le message vocal"
                        >
                          <PlayCircle className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col">
                          <div className={`h-1 w-24 rounded-full ${isMe ? 'bg-white/30' : 'bg-gray-100'}`}>
                            <div className={`h-full w-full rounded-full ${isMe ? 'bg-white' : 'bg-vanz-teal'}`} />
                          </div>
                          <span className="text-[10px] mt-1 font-mono">{msg.media_duration}s</span>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-60">
                      <span className="text-[9px] font-bold">
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      {isMe && (
                        msg.read_at ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-center border-t border-red-100/50 flex items-center justify-center gap-2">
          <X className="w-4 h-4" onClick={() => setErrorMsg("")} />
          {errorMsg}
        </div>
      )}

      {/* Input Section */}
      <div className="p-4 bg-white border-t border-gray-100/80">
        
        {/* Quick Replies */}
        {phase !== 'archived' && (
          <div className="flex w-full overflow-x-auto pb-3 gap-2 hide-scrollbar snap-x">
            {QUICK_REPLIES[currentUserType]?.[phase]?.map((reply, idx) => {
              const [fr, ar] = reply.split(" | ");
              return (
                <button
                  key={idx}
                  onClick={() => sendMessage(reply)}
                  disabled={isUploading}
                  className="whitespace-nowrap flex flex-col items-center justify-center bg-gray-50 border border-gray-200 text-vanz-navy hover:bg-vanz-teal hover:text-white hover:border-vanz-teal px-4 py-1.5 rounded-full transition-all text-xs font-semibold snap-start shrink-0 active:scale-95"
                  title="Envoyer ce message rapide"
                >
                  <span>{fr}</span>
                  {ar && <span className="opacity-70 text-[10px] font-normal font-sans" dir="rtl">{ar}</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="relative flex items-end gap-3 bg-gray-50 p-2 rounded-[1.8rem] border border-gray-100 focus-within:bg-white focus-within:border-vanz-teal focus-within:shadow-lg transition-all">
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            className="hidden" 
            accept="image/*" 
            title="Choisir une photo à envoyer"
            aria-label="Choisir une photo à envoyer"
          />
          
          <button 
            disabled={!canSendMedia || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-vanz-teal hover:bg-vanz-ice rounded-full transition-all disabled:opacity-30"
            title="Joindre un fichier"
            aria-label="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 min-h-[44px] py-2">
            {isRecording ? (
              <div className="flex items-center gap-3 px-2 h-full">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono font-bold text-vanz-navy">
                  Recording: {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                </span>
                <button 
                  onClick={stopRecording} 
                  className="ml-auto p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  title="Arrêter l'enregistrement"
                  aria-label="Arrêter l'enregistrement"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <textarea 
                rows={1}
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputStr); } }}
                placeholder={canSendMedia ? "Votre message..." : "Messages limités (Phase Offre)"}
                className="w-full bg-transparent border-none outline-none text-[15px] font-medium resize-none placeholder:text-gray-300 px-2"
                disabled={phase === 'archived'}
                title="Saisir un message"
                aria-label="Saisir un message"
              />
            )}
          </div>

          {!inputStr.trim() && !isRecording && (
            <button 
              onClick={startRecording}
              disabled={!canSendMedia || isUploading}
              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all disabled:opacity-30"
              title="Enregistrer un message vocal"
              aria-label="Enregistrer un message vocal"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <button 
            disabled={(!inputStr.trim() && !isRecording) || isUploading || phase === 'archived'}
            onClick={() => sendMessage(inputStr)}
            className="p-4 bg-vanz-teal text-white rounded-[1.2rem] shadow-lg shadow-vanz-teal/20 hover:shadow-vanz-teal/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 flex items-center justify-center overflow-hidden relative"
            title="Envoyer le message"
            aria-label="Envoyer le message"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
