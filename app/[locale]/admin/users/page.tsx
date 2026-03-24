'use client';

import { useState, useEffect } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Search, ShieldAlert, Ban, Clock, X, ChevronRight, User as UserIcon, Wallet, Star } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tab, setTab] = useState<'client' | 'driver'>('client');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Profile data blocks
  const [profileJobs, setProfileJobs] = useState<any[]>([]);
  
  useEffect(() => {
    fetchUsers();
  }, [tab, search]);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('*, jobs!jobs_client_id_fkey(count)')
      .eq('role', tab)
      .order('created_at', { ascending: false });

    // Note: jobs count requires alias since both driver and client can have jobs
    // In Supabase, if we filter by role='client', their jobs are essentially jobs_client_id_fkey.
    // If role='driver', their jobs are via preferred_driver_id or accepted bids. 
    // For simplicity, we fetch count manually later or rely on the total_reviews.
    // We will just fetch the base users first.

    const { data } = await query;
    let filtered = data || [];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(u => 
        (u.first_name + ' ' + u.last_name).toLowerCase().includes(s) || 
        u.phone.includes(s)
      );
    }

    setUsers(filtered);
    setLoading(false);
  };

  const loadUserProfile = async (user: any) => {
    setSelectedUser(user);
    // Fetch recent jobs
    const column = user.role === 'client' ? 'client_id' : 'preferred_driver_id';
    
    // For drivers it is safer to fetch jobs where accepted_bid_id -> driver_id.
    // Complex queries in client side: we'll just fetch latest 5 by ID.
    if (user.role === 'client') {
       const { data } = await supabase.from('jobs').select('*').eq('client_id', user.id).order('created_at', { ascending: false }).limit(5);
       setProfileJobs(data || []);
    } else {
       // Driver jobs
       const { data: bids } = await supabase.from('bids').select('jobs(*)').eq('driver_id', user.id).eq('status', 'accepted').limit(5);
       setProfileJobs(bids?.map(b => b.jobs) || []);
    }
  };

  const executeModeration = async (action: 'warn' | 'suspend' | 'ban') => {
    let reason = '';
    let days = 7;

    if (action === 'ban') {
       const res = window.prompt("Raison du bannissement définitif :");
       if (res === null) return;
       reason = res;
    } else if (action === 'suspend') {
       const res = window.prompt("Nombre de jours de suspension :", "7");
       if (res === null) return;
       days = parseInt(res) || 7;
    } else {
       if (!window.confirm("Envoyer un avertissement officiel ?")) return;
    }

    try {
      const res = await fetch('/api/admin/moderate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ action, userId: selectedUser.id, targetPhone: selectedUser.phone, reason, days })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      alert(`Action '${action}' appliquée avec succès.`);
      fetchUsers();
      setSelectedUser(null);
    } catch(err: any) {
      alert("Erreur de modération: " + err.message);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
         <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setTab('client')} 
              className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${tab === 'client' ? 'bg-white text-vanz-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Clients
            </button>
            <button 
              onClick={() => setTab('driver')} 
              className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${tab === 'driver' ? 'bg-white text-vanz-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Chauffeurs
            </button>
         </div>

         <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" placeholder="Nom ou #Téléphone..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-vanz-teal outline-none"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#051E3C] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Profil</th>
                <th className="px-6 py-4 font-semibold">Téléphone</th>
                <th className="px-6 py-4 font-semibold">Ville</th>
                <th className="px-6 py-4 font-semibold">Avis</th>
                <th className="px-6 py-4 font-semibold">Statut</th>
                <th className="px-6 py-4 font-semibold">Rejoint le</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                 <tr><td colSpan={7} className="text-center py-8 text-gray-500">Chargement...</td></tr>
               ) : users.length === 0 ? (
                 <tr><td colSpan={7} className="text-center py-8 text-gray-500">Aucun utilisateur.</td></tr>
               ) : (
                 users.map((user) => (
                   <tr key={user.id} onClick={() => loadUserProfile(user)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-vanz-ice flex items-center justify-center text-vanz-teal font-bold uppercase">
                           {user.first_name[0]}{user.last_name[0]}
                         </div>
                         <span className="font-bold text-gray-800">{user.first_name} {user.last_name}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-gray-600 font-medium">{user.phone}</td>
                     <td className="px-6 py-4 text-gray-500 capitalize">{user.city || '-'}</td>
                     <td className="px-6 py-4 text-yellow-500 font-bold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {user.cached_rating || 'N/A'} <span className="text-gray-300 font-normal">({user.total_reviews})</span>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          user.account_status === 'active' ? 'bg-green-100 text-green-700' : 
                          user.account_status === 'banned' ? 'bg-red-100 text-red-700' : 
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {user.account_status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                     <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-vanz-teal transition-colors" />
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Out Panel */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedUser(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto animate-[slide-in-right_300ms_ease-out]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-vanz-teal text-white flex items-center justify-center font-bold text-lg uppercase">
                    {selectedUser.first_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold border-gray-100text-[#051E3C]">{selectedUser.first_name} {selectedUser.last_name}</h3>
                    <p className="text-xs text-gray-500">{selectedUser.role.toUpperCase()}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 space-y-8">
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                     <div className="flex items-center gap-2 text-gray-500 mb-1"><Wallet className="w-4 h-4"/> Solde</div>
                     <p className="text-lg font-black text-vanz-teal">{selectedUser.credit_balance || 0} TND</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                     <div className="flex items-center gap-2 text-orange-600 mb-1"><ShieldAlert className="w-4 h-4"/> Pénalité Cash</div>
                     <p className="text-lg font-black text-orange-600">{selectedUser.pending_commission_debt || 0} TND</p>
                  </div>
               </div>

               <section>
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Missions Récentes</h4>
                 <div className="space-y-3">
                    {profileJobs.length === 0 ? <p className="text-sm text-gray-400">Aucune commande.</p> : profileJobs.map(j => (
                      <div key={j.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-100">
                         <div className="truncate pr-4">
                           <p className="text-sm font-bold text-gray-800 capitalize truncate">{j.service_type}</p>
                           <p className="text-xs text-gray-400 truncate mt-0.5">{j.pickup_address} → {j.dropoff_address}</p>
                         </div>
                         <span className="px-2 py-1 bg-white border border-gray-200 shadow-sm rounded text-[10px] font-bold uppercase shrink-0">
                           {j.status}
                         </span>
                      </div>
                    ))}
                 </div>
               </section>

               <section className="pt-6 border-t border-gray-100">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Gouvernance & Modération</h4>
                 
                 {selectedUser.account_status === 'suspended' && (
                    <div className="mb-4 p-4 bg-orange-100 text-orange-800 rounded-xl text-sm flex items-start gap-3 border border-orange-200">
                      <Clock className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold">Compte Suspendu</p>
                        <p className="text-xs mt-1">Jusqu'au : {new Date(selectedUser.suspended_until).toLocaleDateString()}</p>
                      </div>
                    </div>
                 )}

                 {selectedUser.account_status === 'banned' && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-xl text-sm flex items-start gap-3 border border-red-200">
                      <Ban className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold">Banni Définitivement</p>
                        <p className="text-xs mt-1">Motif : {selectedUser.ban_reason}</p>
                      </div>
                    </div>
                 )}

                 <div className="space-y-3">
                   <button 
                     onClick={() => executeModeration('warn')}
                     className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors group"
                   >
                     <p className="font-bold text-gray-800 group-hover:text-yellow-700">Envoyer Avertissement</p>
                     <p className="text-xs text-gray-500 mt-1">Envoie un Push + SMS officiel.</p>
                   </button>

                   <button 
                     onClick={() => executeModeration('suspend')}
                     className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors group"
                   >
                     <p className="font-bold text-gray-800 group-hover:text-orange-700">Suspendre (x Jours)</p>
                     <p className="text-xs text-gray-500 mt-1">Verrouille la visibilité des missions.</p>
                   </button>

                   <button 
                     onClick={() => executeModeration('ban')}
                     className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-red-400 hover:bg-red-50 transition-colors group"
                   >
                     <p className="font-bold text-gray-800 group-hover:text-red-700">Bannir Définitivement</p>
                     <p className="text-xs text-gray-500 mt-1">Désactive totalement l'accès et les tokens.</p>
                   </button>
                 </div>
               </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
