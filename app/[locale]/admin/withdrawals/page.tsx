'use client';

import { useEffect, useState } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Banknote, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'rejected'>('pending');

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('withdrawals')
      .select('*, drivers(users(id, first_name, last_name, phone, credit_balance, pending_commission_debt))')
      .eq('status', filter)
      .order('created_at', { ascending: false });
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  const processWithdrawal = async (w: any) => {
    const driver = w.drivers?.users;
    if (!driver) return alert("Chauffeur introuvable!");

    const availableBalance = (driver.credit_balance || 0) - (driver.pending_commission_debt || 0);

    if (availableBalance < w.amount) {
      alert(`Solde insuffisant. Disponible: ${availableBalance} TND`);
      return;
    }

    if (!confirm(`Valider le virement de ${w.amount} TND pour ${driver.first_name} ?`)) return;

    try {
      const newCredit = driver.credit_balance - w.amount;
      await supabase.from('users').update({ credit_balance: newCredit }).eq('id', driver.id);

      await supabase.from('withdrawals').update({ 
        status: 'completed', 
        processed_at: new Date().toISOString() 
      }).eq('id', w.id);

      await supabase.functions.invoke('driver-status-change', {
         body: { type: 'withdrawal_success', phone: driver.phone, amount: w.amount }
      });

      fetchWithdrawals();
    } catch (e: any) {
      alert("Erreur Serveur.");
    }
  };

  const rejectWithdrawal = async (w: any) => {
    const reason = window.prompt("Motif du rejet :");
    if (reason === null) return;

    try {
      await supabase.from('withdrawals').update({ 
        status: 'rejected', 
        processed_at: new Date().toISOString() 
      }).eq('id', w.id);
      
      const phone = w.drivers?.users?.phone;
      if (phone) {
         await supabase.functions.invoke('driver-status-change', {
           body: { type: 'withdrawal_rejected', phone, reason }
         });
      }
      fetchWithdrawals();
    } catch(e) {
      alert("Erreur Serveur.");
    }
  };

  const totalPending = filter === 'pending' ? withdrawals.reduce((sum, w) => sum + w.amount, 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <div>
           <h2 className="text-xl font-bold text-[#051E3C] flex items-center gap-2">
             <Banknote className="w-5 h-5 text-vanz-teal" /> Virements Chauffeurs
           </h2>
         </div>
         {filter === 'pending' && (
           <div className="text-right">
             <p className="text-xs text-gray-500 font-bold uppercase">Total en attente</p>
             <p className="text-2xl font-black text-orange-500">{totalPending} TND</p>
           </div>
         )}
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
         <button onClick={() => setFilter('pending')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${filter === 'pending' ? 'bg-white shadow text-[#051E3C]' : 'text-gray-500'}`}>En Attente</button>
         <button onClick={() => setFilter('completed')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${filter === 'completed' ? 'bg-white shadow text-[#051E3C]' : 'text-gray-500'}`}>Traités</button>
         <button onClick={() => setFilter('rejected')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${filter === 'rejected' ? 'bg-white shadow text-[#051E3C]' : 'text-gray-500'}`}>Rejetés</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <table className="w-full text-left">
           <thead className="bg-[#051E3C] text-white text-sm">
             <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Chauffeur</th>
                <th className="p-4">Méthode / RIB</th>
                <th className="p-4 text-right">Montant</th>
                <th className="p-4">Action</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {loading ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chargement...</td></tr> :
              withdrawals.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Aucune demande.</td></tr> :
              withdrawals.map(w => {
                const driver = w.drivers?.users;
                const available = (driver?.credit_balance || 0) - (driver?.pending_commission_debt || 0);
                const isInsufficient = available < w.amount;
                
                return (
                  <tr key={w.id} className="font-medium hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-500">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-[#051E3C]">
                       {driver?.first_name} {driver?.last_name}
                       <div className="text-xs text-gray-500">{driver?.phone}</div>
                    </td>
                    <td className="p-4">
                       <span className="uppercase text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600 mr-2">{w.method}</span>
                       <span className="text-sm font-mono text-gray-800">{w.account_ref}</span>
                    </td>
                    <td className="p-4 text-right">
                       <div className="font-bold text-[#051E3C] text-lg">{w.amount} TND</div>
                    </td>
                    <td className="p-4 text-center">
                       {w.status === 'pending' && (
                         <div className="flex gap-2 justify-center">
                            <button onClick={() => processWithdrawal(w)} className="bg-vanz-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1A99B4] transition">
                               Traiter
                            </button>
                            <button onClick={() => rejectWithdrawal(w)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition">
                               Rejeter
                            </button>
                         </div>
                       )}
                       {w.status === 'completed' && <span className="text-green-500 font-bold flex items-center justify-center gap-1 text-sm"><CheckCircle className="w-4 h-4"/> Validé</span>}
                       {w.status === 'rejected' && <span className="text-red-500 font-bold flex items-center justify-center gap-1 text-sm"><AlertCircle className="w-4 h-4"/> Rejeté</span>}
                    </td>
                  </tr>
                );
             })}
           </tbody>
         </table>
      </div>
    </div>
  );
}
