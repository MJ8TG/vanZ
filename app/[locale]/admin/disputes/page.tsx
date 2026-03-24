'use client';

import { useEffect, useState } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { ShieldAlert, AlertCircle, MessageSquare, Image as ImageIcon, MapPin, CheckCircle } from 'lucide-react';

const ADMIN_ACTIONS = [
  { action: 'refund_client', label: 'Rembourser client', requiresAmount: true },
  { action: 'deduct_driver', label: 'Déduire du chauffeur', requiresAmount: true },
  { action: 'warn_user', label: 'Avertissement', requiresTarget: true },
  { action: 'suspend', label: 'Suspendre le compte', requiresTarget: true },
  { action: 'dismiss', label: 'Rejeter le litige', requiresAmount: false, requiresTarget: false }
];

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [actionAmount, setActionAmount] = useState<number>(0);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('disputes')
      .select(`
        *,
        jobs(
           id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, 
           delivery_photo_url, receipt_url, client_id, accepted_bid_id, 
           users!jobs_client_id_fkey(first_name, last_name, phone)
        ),
        opener:users!disputes_opener_id_fkey(first_name, last_name, role)
      `)
      .order('created_at', { ascending: true }); // Oldest first as requested

    if (data) setDisputes(data);
    setLoading(false);
  };

  const openDisputeDetail = async (dispute: any) => {
    setSelectedDispute(dispute);
    setActionAmount(0);
    
    // Fetch Chat Transcripts
    const { data: conv } = await supabase.from('conversations').select('id').eq('job_id', dispute.job_id).single();
    if (conv) {
      const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true });
      if (msgs) setMessages(msgs);
    } else {
      setMessages([]);
    }
  };

  const executeAdminAction = async (actionDef: any, targetId?: string) => {
    if (!selectedDispute) return;
    
    try {
      const isFin = actionDef.requiresAmount;
      if (isFin && actionAmount <= 0) return alert("Montant invalide.");

      const clientId = selectedDispute.jobs.client_id;
      const driverId = selectedDispute.jobs.accepted_bid_id;

      let resolutionDesc = actionDef.action;

      if (actionDef.action === 'refund_client') {
         await supabase.rpc('increment_credit_balance', { user_id: clientId, amount: actionAmount });
         await supabase.from('wallet_transactions').insert({ user_id: clientId, amount: actionAmount, type: 'refund', job_id: selectedDispute.job_id });
         resolutionDesc = `Remboursement de ${actionAmount} TND au client.`;
         
         // SMS (Stubs)
         console.log(`[SMS] To Client: Remboursement de ${actionAmount} TND ajouté à votre compte vanZ`);
         console.log(`[SMS] To Driver: Un remboursement de ${actionAmount} TND a été accordé au client suite au litige job #${selectedDispute.job_id}`);

      } else if (actionDef.action === 'deduct_driver') {
         // Driver deducting translates to raw negative increment balance logically mapped
         await supabase.rpc('increment_credit_balance', { user_id: driverId, amount: -Math.abs(actionAmount) });
         await supabase.from('wallet_transactions').insert({ user_id: driverId, amount: -Math.abs(actionAmount), type: 'penalty', job_id: selectedDispute.job_id });
         resolutionDesc = `Pénalité de ${actionAmount} TND appliquée au chauffeur.`;
         
         console.log(`[SMS] To Driver: Pénalité appliquée: ${actionAmount} TND (Litige #${selectedDispute.job_id})`);
         console.log(`[SMS] To Client: Votre litige a été résolu en votre faveur.`);
      }

      if (actionDef.action === 'warn_user' && targetId) {
         console.log(`[WARNING] Sent to User ${targetId}`);
         resolutionDesc = `Avertissement formel envoyé.`;
      }

      if (actionDef.action === 'suspend' && targetId) {
         await supabase.from('users').update({ account_status: 'suspended' }).eq('id', targetId);
         resolutionDesc = `Compte suspendu.`;
      }

      // Log the admin matrix action natively
      await supabase.from('admin_actions').insert({
        admin_id: 'SYSTEM_FRONTEND', // Mock session
        action: actionDef.action,
        target_id: selectedDispute.job_id,
        amount: isFin ? actionAmount : null
      });

      // Update resolution logically terminating case globally
      await supabase.from('disputes').update({
        status: 'resolved',
        resolution_notes: resolutionDesc
      }).eq('id', selectedDispute.id);

      alert(`Action ${actionDef.label} exécutée avec succès !`);
      setSelectedDispute(null);
      fetchDisputes();

    } catch (e: any) {
      console.error(e);
      alert("Erreur lors de l'exécution.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-heading text-[#051E3C] flex items-center gap-3">
           <ShieldAlert className="w-8 h-8 text-red-500" /> Gestion des Litiges
        </h1>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Left List Pane */}
        <div className="w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
           <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-[#051E3C]">Tickets (Plus anciens en premier)</div>
           <div className="overflow-y-auto flex-1 p-2">
              {loading ? <p className="p-4 text-center text-gray-400">Chargement...</p> : null}
              {disputes.map(dispute => {
                 const hours = Math.floor((Date.now() - new Date(dispute.created_at).getTime()) / 3600000);
                 const isOpen = dispute.status === 'open';
                 return (
                    <div 
                      key={dispute.id} 
                      onClick={() => openDisputeDetail(dispute)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition border-l-4 ${selectedDispute?.id === dispute.id ? 'bg-[#F0FBFC] border-[#2BBFDF]' : isOpen ? 'border-red-500' : 'border-green-500'}`}
                    >
                       <div className="flex justify-between items-start mb-2">
                         <span className="font-bold text-[#051E3C] text-sm">Job {dispute.job_id.substring(0,8)}</span>
                         {isOpen ? 
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold">{hours}h</span> 
                            : <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-bold"><CheckCircle className="w-3 h-3"/></span>
                         }
                       </div>
                       <p className="text-sm font-semibold text-gray-600">{dispute.opener?.first_name} {dispute.opener?.last_name} ({dispute.opener?.role})</p>
                       <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{dispute.reason}</p>
                    </div>
                 );
              })}
           </div>
        </div>

        {/* Right Detail Pane */}
        <div className="w-2/3 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
           {!selectedDispute ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                 <AlertCircle className="w-12 h-12 mb-4 opacity-50"/>
                 <p className="font-semibold">Sélectionnez un litige pour commencer l'examen.</p>
              </div>
           ) : (
              <>
                 <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-start">
                    <div>
                       <h2 className="text-xl font-bold text-[#051E3C] mb-1">Litige {selectedDispute.id}</h2>
                       <p className="text-sm text-gray-500">Job: <span className="font-mono">{selectedDispute.job_id}</span></p>
                    </div>
                    {selectedDispute.jobs.receipt_url && (
                       <a href={selectedDispute.jobs.receipt_url} target="_blank" className="text-sm font-bold text-[#2BBFDF] hover:underline bg-white px-3 py-1.5 border border-[#2BBFDF] rounded-lg">
                          Télécharger Reçu (PDF)
                       </a>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {/* Descriptions */}
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                       <h3 className="text-sm font-bold text-red-600 uppercase mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Déclaration ({selectedDispute.opener?.role})</h3>
                       <p className="text-[#051E3C] font-medium">{selectedDispute.description}</p>
                    </div>

                    {/* Preuves Photos */}
                    {selectedDispute.photo_urls && selectedDispute.photo_urls.length > 0 && (
                       <div>
                          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Preuves du Litige</h3>
                          <div className="flex gap-4">
                             {selectedDispute.photo_urls.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" className="w-32 h-32 rounded-xl overflow-hidden border border-gray-200 hover:opacity-80 transition">
                                   <img src={url} className="w-full h-full object-cover" alt="preuve litige" />
                                </a>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Delivery Dropoff Context */}
                    {selectedDispute.jobs.delivery_photo_url && (
                       <div>
                          <h3 className="text-sm font-bold text-[#2BBFDF] uppercase mb-3 flex items-center gap-2"><MapPin className="w-4 h-4"/> Preuve de Livraison (Chauffeur)</h3>
                          <a href={selectedDispute.jobs.delivery_photo_url} target="_blank" className="w-48 h-48 block rounded-xl overflow-hidden border border-blue-200 hover:opacity-80 transition">
                             <img src={selectedDispute.jobs.delivery_photo_url} className="w-full h-full object-cover" alt="livraison" />
                          </a>
                       </div>
                    )}

                    {/* Chat Logs */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Transcription du Chat</h3>
                        <div className="bg-gray-100 p-4 rounded-xl max-h-64 overflow-y-auto flex flex-col gap-2 border border-gray-200">
                           {messages.length === 0 ? <p className="text-xs text-center text-gray-400">Aucun message</p> : null}
                           {messages.map(m => (
                              <div key={m.id} className="text-sm bg-white p-2 rounded shadow-sm border border-gray-200">
                                 <span className="font-bold text-[#051E3C] text-xs opacity-70 uppercase tracking-widest mr-2">{m.sender_type}</span>
                                 <span className="text-gray-800">{m.content}</span>
                                 <span className="text-[10px] text-gray-400 float-right pt-1">{new Date(m.created_at).toLocaleTimeString()}</span>
                              </div>
                           ))}
                        </div>
                    </div>
                 </div>

                 {/* Resolution Action Matrix */}
                 {selectedDispute.status === 'open' && (
                    <div className="p-4 bg-white border-t border-gray-200">
                       <h3 className="font-bold text-[#051E3C] mb-4">Résolution Nette</h3>
                       
                       <div className="flex gap-4 items-center mb-4">
                          <input 
                             type="number" 
                             className="border border-gray-300 rounded px-3 py-2 w-32 focus:ring-2 focus:ring-[#2BBFDF] focus:outline-none" 
                             placeholder="Montant TND"
                             value={actionAmount || ''}
                             onChange={e => setActionAmount(Number(e.target.value))}
                          />
                          <p className="text-xs text-gray-500 font-medium">Requis uniquement pour les remboursements/déductions financières.</p>
                       </div>

                       <div className="flex flex-wrap gap-2">
                          {ADMIN_ACTIONS.map(action => (
                             <button
                                key={action.action}
                                onClick={() => {
                                   const tgt = action.action.includes('client') ? selectedDispute.jobs.client_id : selectedDispute.jobs.accepted_bid_id;
                                   executeAdminAction(action, tgt);
                                }}
                                className="px-4 py-2 bg-[#051E3C] text-white rounded font-bold text-sm hover:bg-[#1A99B4] transition"
                             >
                                {action.label}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </>
           )}
        </div>
      </div>
    </div>
  );
}
