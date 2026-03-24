'use client';

import { useState, useEffect } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Plus, ToggleLeft, ToggleRight, Ticket, BarChart3, RefreshCcw, X } from 'lucide-react';

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
     code: '',
     discount_type: 'fixed',
     discount_value: '',
     max_uses: '',
     uses_per_user: '1',
     min_job_amount: '0',
     valid_from: '',
     valid_until: '',
     is_active: true
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setPromos(data || []);
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('promo_codes').update({ is_active: !currentStatus }).eq('id', id);
    fetchPromos();
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       await supabase.from('promo_codes').insert({
          code: form.code.toUpperCase(),
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          uses_per_user: parseInt(form.uses_per_user),
          min_job_amount: parseFloat(form.min_job_amount),
          valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : new Date().toISOString(),
          valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
          current_uses: 0,
          is_active: form.is_active
       });
       
       setShowForm(false);
       setForm({ code: '', discount_type: 'fixed', discount_value: '', max_uses: '', uses_per_user: '1', min_job_amount: '0', valid_from: '', valid_until: '', is_active: true });
       fetchPromos();
    } catch(err) {
       alert("Erreur lors de la création.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
         <h2 className="text-xl font-bold text-[#051E3C] flex items-center gap-2">
            <Ticket className="w-6 h-6 text-vanz-teal" /> Gestions des Codes Promo
         </h2>
         <button 
           onClick={() => setShowForm(!showForm)}
           className="bg-vanz-teal text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#20A6C4] transition-colors"
         >
            {showForm ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
            {showForm ? 'Annuler' : 'Nouveau Code'}
         </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreatePromo} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-[fade-in-up_200ms_ease-out]">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              <div>
                <label htmlFor="promo-code" className="block text-xs font-bold text-gray-500 mb-1">Code *</label>
                <input id="promo-code" type="text" required value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="VANZ10" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-vanz-teal uppercase" />
              </div>

              <div>
                <label htmlFor="promo-type" className="block text-xs font-bold text-gray-500 mb-1">Type de Réduction *</label>
                <select id="promo-type" title="Type de réduction" value={form.discount_type} onChange={(e) => setForm({...form, discount_type: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-vanz-teal">
                   <option value="fixed">Montant Fixe (TND)</option>
                   <option value="percentage">Pourcentage (%)</option>
                </select>
              </div>

              <div>
                <label htmlFor="promo-value" className="block text-xs font-bold text-gray-500 mb-1">Valeur *</label>
                <input id="promo-value" type="number" step="0.1" required value={form.discount_value} onChange={(e) => setForm({...form, discount_value: e.target.value})} placeholder="Ex: 10" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-vanz-teal" />
              </div>

              <div>
                <label htmlFor="promo-max-uses" className="block text-xs font-bold text-gray-500 mb-1">Stock (Vide = Illimité)</label>
                <input id="promo-max-uses" type="number" value={form.max_uses} onChange={(e) => setForm({...form, max_uses: e.target.value})} placeholder="Ex: 100" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-vanz-teal" />
              </div>

              <div>
                <label htmlFor="promo-uses-per-user" className="block text-xs font-bold text-gray-500 mb-1">Utilisation par Utilisateur</label>
                <input id="promo-uses-per-user" type="number" min="1" value={form.uses_per_user} onChange={(e) => setForm({...form, uses_per_user: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-vanz-teal" />
              </div>

              <div>
                <label htmlFor="promo-min-amount" className="block text-xs font-bold text-gray-500 mb-1">Montant Min Commande</label>
                <input id="promo-min-amount" type="number" value={form.min_job_amount} onChange={(e) => setForm({...form, min_job_amount: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-vanz-teal" />
              </div>

              <div>
                <label htmlFor="promo-valid-from" className="block text-xs font-bold text-gray-500 mb-1">Début de validité</label>
                <input id="promo-valid-from" type="date" value={form.valid_from} onChange={(e) => setForm({...form, valid_from: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-vanz-teal" />
              </div>

              <div>
                <label htmlFor="promo-valid-until" className="block text-xs font-bold text-gray-500 mb-1">Fin de validité</label>
                <input id="promo-valid-until" type="date" value={form.valid_until} onChange={(e) => setForm({...form, valid_until: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-vanz-teal" />
              </div>

           </div>
           
           <div className="flex justify-end border-t border-gray-100 pt-4">
              <button type="submit" className="bg-green-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-600 transition-colors">Enregistrer le Code</button>
           </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <table className="w-full text-left text-sm">
           <thead className="bg-[#051E3C] text-white">
             <tr>
               <th className="px-6 py-4 font-semibold">Code</th>
               <th className="px-6 py-4 font-semibold">Type</th>
               <th className="px-6 py-4 font-semibold">Utilisations</th>
               <th className="px-6 py-4 font-semibold">Validité</th>
               <th className="px-6 py-4 font-semibold">Statut</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {loading ? <tr><td colSpan={5} className="text-center py-8">Chargement...</td></tr> : 
              promos.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-500">Aucun code promo actif.</td></tr> : 
              promos.map(promo => {
                const isUnlimited = promo.max_uses === null;
                const percent = isUnlimited ? 0 : Math.min(100, Math.round((promo.current_uses / promo.max_uses) * 100));

                let totalDiscount = 0;
                if (promo.discount_type === 'fixed') {
                   totalDiscount = promo.discount_value * promo.current_uses;
                }
                
                return (
                 <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                   <td className="px-6 py-4">
                     <span className="font-mono text-base font-black text-vanz-teal block truncate">{promo.code}</span>
                     <span className="text-xs text-gray-400">Min. {promo.min_job_amount} TND</span>
                   </td>
                   <td className="px-6 py-4 font-bold text-gray-700">
                     {promo.discount_type === 'fixed' ? `${promo.discount_value} TND` : `${promo.discount_value}%`}
                     {promo.discount_type === 'fixed' && promo.current_uses > 0 && (
                        <div className="text-[10px] text-gray-400 font-normal mt-1 flex items-center gap-1">
                           <BarChart3 className="w-3 h-3"/> Cost: {totalDiscount} TND
                        </div>
                     )}
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex justify-between text-xs text-gray-500 font-bold mb-1">
                       <span>{promo.current_uses} consommés</span>
                       <span>{isUnlimited ? '∞' : `${promo.max_uses} MAX`}</span>
                     </div>
                         <div className="w-full">
                           <progress 
                             max="100" 
                             value={percent} 
                             className={`w-full h-1.5 block rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-gray-200 ${percent > 90 ? '[&::-webkit-progress-value]:bg-red-500' : '[&::-webkit-progress-value]:bg-green-500'}`}
                           />
                         </div>
                   </td>
                   <td className="px-6 py-4 text-xs text-gray-500">
                     <p>Du: {new Date(promo.valid_from).toLocaleDateString()}</p>
                     <p>Au: {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : 'Jamais'}</p>
                   </td>
                   <td className="px-6 py-4">
                     <button 
                       onClick={() => toggleStatus(promo.id, promo.is_active)} 
                       className={`flex items-center gap-1 font-bold ${promo.is_active ? 'text-green-500' : 'text-gray-400'}`}
                       title={promo.is_active ? "Désactiver le code" : "Activer le code"}
                       aria-label={promo.is_active ? "Désactiver le code promo" : "Activer le code promo"}
                     >
                        {promo.is_active ? <ToggleRight className="w-8 h-8"/> : <ToggleLeft className="w-8 h-8"/>}
                        <span className="text-xs uppercase">{promo.is_active ? 'Actif' : 'Inactif'}</span>
                     </button>
                   </td>
                 </tr>
                )
              })}
           </tbody>
         </table>
      </div>
    </div>
  );
}
