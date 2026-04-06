"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { datasql } from "@/lib/datasql";
import ConversationsList from "@/components/chat/ConversationsList";
import ChatScreen from "@/components/chat/ChatScreen";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<"client" | "driver">("client");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConvDetails, setSelectedConvDetails] = useState<{
    job_id: string;
    phase: "pre_bid" | "post_acceptance" | "archived";
    jobs?: {
      payment_method: string;
    } | null;
    [key: string]: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await datasql.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Check if user is a driver
        const { data: driver } = await datasql
          .from('drivers')
          .select('id')
          .eq('id', user.id)
          .single();
        
        setCurrentUserType(driver ? "driver" : "client");

        // Auto-select conversation from URL query (after bid acceptance redirect)
        const convParam = searchParams.get('conv');
        if (convParam) {
          handleSelectConversation(convParam);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, [searchParams]);

  // Realtime: update phase when conversation changes (e.g., bid accepted → post_acceptance)
  useEffect(() => {
    if (!selectedConversationId) return;

    const channel = datasql
      .channel(`conv_phase_${selectedConversationId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${selectedConversationId}` },
        (payload) => {
          setSelectedConvDetails((prev: any) => ({
            ...prev,
            phase: payload.new.phase
          }));
        }
      )
      .subscribe();

    return () => { datasql.removeChannel(channel); };
  }, [selectedConversationId]);

  const handleSelectConversation = async (id: string) => {
    setSelectedConversationId(id);
    const { data } = await datasql
      .from('conversations')
      .select('*, jobs(id, payment_method)')
      .eq('id', id)
      .single();
    setSelectedConvDetails(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-vanz-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-2xl font-black text-vanz-navy mb-4">Veuillez vous connecter</h1>
        <p className="text-gray-500 mb-8">Vous devez être connecté pour accéder à vos messages.</p>
        <button className="bg-vanz-teal text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-vanz-teal/30">
          Connexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <main className="flex-1 flex overflow-hidden p-4 md:p-8 w-full">
        <div className="flex flex-col md:flex-row gap-6 w-full h-full">
          
          {/* List Section */}
          <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden`}>
            <div className="p-6 border-b border-gray-50">
              <h1 className="text-2xl font-black text-vanz-navy flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-vanz-teal" />
                Messages
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <ConversationsList 
                currentUserId={currentUserId} 
                onSelect={handleSelectConversation}
              />
            </div>
          </div>

          {/* Chat Section */}
          <div className={`${!selectedConversationId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative`}>
            {selectedConversationId && selectedConvDetails ? (
              <>
                {/* Mobile Back Button */}
                <button 
                  onClick={() => setSelectedConversationId(null)}
                  className="md:hidden absolute top-6 left-6 z-10 p-2 bg-vanz-navy text-white rounded-full shadow-lg"
                  title="Retour à la liste"
                  aria-label="Retour à la liste"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <ChatScreen 
                  conversationId={selectedConversationId}
                  jobId={selectedConvDetails.job_id}
                  currentUserId={currentUserId}
                  currentUserType={currentUserType}
                  phase={selectedConvDetails.phase}
                  paymentMethod={selectedConvDetails.jobs?.payment_method || 'tbd'}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
                <div className="w-24 h-24 bg-vanz-ice rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-12 h-12 text-vanz-navy" />
                </div>
                <h2 className="text-xl font-bold text-vanz-navy">Sélectionnez une conversation</h2>
                <p className="text-sm">Choisissez un contact pour commencer à discuter.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
