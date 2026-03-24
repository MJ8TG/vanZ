'use client';

import { useState, useEffect } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Send, Users, Smartphone, BellRing, Target } from 'lucide-react';

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [estimateCount, setEstimateCount] = useState<number | null>(null);

  const [form, setForm] = useState({
     audience: 'all_users',
     channel: 'both',
     title: '',
     body: ''
  });

  useEffect(() => {
     estimateAudience(form.audience);
  }, [form.audience]);

  const estimateAudience = async (aud: string) => {
    let query = supabase.from('users').select('*', { count: 'exact', head: true });
    
    switch (aud) {
      case 'all_drivers': query = query.eq('role', 'driver').eq('account_status', 'active'); break;
      case 'all_clients': query = query.eq('role', 'client'); break;
      case 'city_tunis': query = query.ilike('city', '%tunis%'); break;
      case 'city_sfax': query = query.ilike('city', '%sfax%'); break;
      case 'city_sousse': query = query.ilike('city', '%sousse%'); break;
      case 'online_drivers': query = query.eq('role', 'driver').eq('is_online', true); break;
    }
    
    const { count } = await query;
    setEstimateCount(count || 0);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Envoyer à ~${estimateCount} utilisateurs via ${form.channel} ?`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Campagne envoyée avec succès à ${data.count} utilisateurs.`);
      setForm({ ...form, title: '', body: '' });
    } catch(err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
         <h2 className="text-2xl font-black text-[#051E3C] flex items-center gap-3">
            <Send className="w-7 h-7 text-vanz-teal" /> Campagne Marketing
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Estimator Card */}
         <div className="md:col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-[#051E3C] to-[#0A2E5C] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/5 w-32 h-32 rounded-full blur-2xl"></div>
               <p className="text-white/60 font-bold text-xs uppercase tracking-wider mb-2">Audience Estimée</p>
               <h3 className="text-5xl font-black text-vanz-teal tracking-tighter">
                 {estimateCount === null ? '-' : estimateCount}
               </h3>
               <p className="text-white/80 text-sm mt-4 leading-relaxed font-medium">
                 Cette estimation correspond au nombre d'utilisateurs qualifiés pour recevoir le message selon vos filtres.
               </p>
            </div>
         </div>

         {/* Form */}
         <div className="md:col-span-2">
           <form onSubmit={handleSend} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label htmlFor="audience-select" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Target className="w-3 h-3"/> Audience</label>
                   <select 
                     id="audience-select"
                     value={form.audience} onChange={e => setForm({...form, audience: e.target.value})}
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-vanz-teal font-medium text-gray-700"
                     title="Choisir l'audience de la campagne"
                   >
                     <option value="all_users">Tous les utilisateurs</option>
                     <option value="all_clients">Tous les clients (Appli Client)</option>
                     <option value="all_drivers">Tous les chauffeurs (Appli Chauffeur)</option>
                     <option value="online_drivers">Chauffeurs En Ligne (Immédiat)</option>
                     <option value="city_tunis">Ville: Tunis</option>
                     <option value="city_sousse">Ville: Sousse</option>
                     <option value="city_sfax">Ville: Sfax</option>
                   </select>
                 </div>

                 <div>
                   <label htmlFor="channel-select" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Smartphone className="w-3 h-3"/> Canal de diffusion</label>
                   <select 
                     id="channel-select"
                     value={form.channel} onChange={e => setForm({...form, channel: e.target.value})}
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-vanz-teal font-medium text-gray-700"
                     title="Choisir le canal de diffusion"
                   >
                     <option value="both">In-App Push + SMS (Max Reach)</option>
                     <option value="push">In-App Push Uniquement (Gratuit)</option>
                     <option value="sms">SMS Uniquement (Payant)</option>
                   </select>
                 </div>
              </div>

              {(form.channel === 'push' || form.channel === 'both') && (
                <div>
                  <label htmlFor="notification-title" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><BellRing className="w-3 h-3"/> Titre (Notification Push)</label>
                  <input 
                    id="notification-title"
                    type="text" required 
                    value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="Ex: -20% sur votre prochain trajet !"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-vanz-teal font-medium" 
                  />
                </div>
              )}

              <div>
                <label htmlFor="notification-body" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Contenu du message</label>
                <textarea 
                  id="notification-body"
                  required rows={4}
                  value={form.body} onChange={e => setForm({...form, body: e.target.value})}
                  placeholder="Tapez votre message ici..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-vanz-teal font-medium resize-none" 
                />
                <p className={`text-right text-xs mt-1 ${form.body.length > 160 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                  {form.body.length}/160 caractères (1 SMS)
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading || form.body.length === 0}
                  className="bg-vanz-teal text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#20A6C4] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Envoi en cours...' : 'Diffuser la campagne'} <Send className="w-4 h-4 ml-1" />
                </button>
              </div>
           </form>
         </div>
      </div>
    </div>
  );
}
