'use client';

import { useState, useEffect } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { Download, Search, FileText, X, AlertOctagon } from 'lucide-react';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  
  // Slide out state
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, cityFilter, dateFrom, dateTo, search]);

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from('jobs')
      .select(`
        *,
        client:users!jobs_client_id_fkey(first_name, last_name, phone, city),
        driver:preferred_driver_id(users(first_name, last_name, phone))
      `)
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);
    if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const { data } = await query;
    let filteredData = data || [];

    if (cityFilter) {
      filteredData = filteredData.filter(j => 
         j.client?.city?.toLowerCase().includes(cityFilter.toLowerCase()) || 
         j.pickup_address.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }
    
    if (search) {
      filteredData = filteredData.filter(j => 
         j.id.includes(search) || 
         (j.client?.first_name + ' ' + j.client?.last_name).toLowerCase().includes(search.toLowerCase())
      );
    }

    setJobs(filteredData);
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Client', 'Driver', 'Service', 'Pickup', 'Dropoff', 'Status', 'Date', 'Amount'];
    const rows = jobs.map(j => {
      const cname = j.client ? `${j.client.first_name} ${j.client.last_name}` : '';
      const dname = j.driver?.users ? `${j.driver.users.first_name} ${j.driver.users.last_name}` : '';
      return [
        j.id.substring(0,8),
        `"${cname}"`, `"${dname}"`, j.service_type,
        `"${j.pickup_address}"`, `"${j.dropoff_address}"`,
        j.status, new Date(j.created_at).toLocaleDateString(),
        Number(j.accepted_bid_id ? j.commission_amount : 0) || 0
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vanz_jobs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleCancelAndRefund = async (jobId: string, paymeeRef: string | null) => {
    const confirmation = window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?\nSi elle a été payée, un remboursement sera émis matériellement.");
    if (!confirmation) return;

    try {
       await supabase.from('jobs').update({
         status: 'cancelled',
         cancel_reason: 'Admin Override'
       }).eq('id', jobId);

       // Note: Refund specific API mapping logic would occur physically via Paymee keys 
       // but here we mark generic wallet_transaction refund logic if we map user balance
       if (paymeeRef) {
         alert("La commande a été payée par Paymee. Le remboursement en ligne doit être validé via leur tableau de bord ou l'API d'annulation stricte.");
       }

       fetchJobs();
       setSelectedJob(null);
    } catch(e) {
       alert("Erreur lors de l'annulation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
         <div className="flex gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" placeholder="Rechercher ID ou Client..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-vanz-teal outline-none"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-vanz-teal">
               <option value="">Tous les statuts</option>
               <option value="open">Ouvert</option>
               <option value="matched">Assigné</option>
               <option value="in_progress">En Cours</option>
               <option value="completed">Terminé</option>
               <option value="cancelled">Annulé</option>
            </select>

            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none" />
         </div>

         <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
         </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#051E3C] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Trajet</th>
                <th className="px-6 py-4 font-semibold">Montant</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Statut</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                 <tr><td colSpan={8} className="text-center py-8 text-gray-500">Chargement...</td></tr>
               ) : jobs.length === 0 ? (
                 <tr><td colSpan={8} className="text-center py-8 text-gray-500">Aucune commande trouvée.</td></tr>
               ) : (
                 jobs.map((job) => (
                   <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4 font-mono text-xs text-gray-500">#{job.id.substring(0,6)}</td>
                     <td className="px-6 py-4 font-semibold text-gray-800">{job.client?.first_name} {job.client?.last_name}</td>
                     <td className="px-6 py-4 text-gray-600 capitalize">{job.service_type}</td>
                     <td className="px-6 py-4 max-w-[200px] truncate text-xs text-gray-500">
                        <span className="text-vanz-teal font-bold block truncate">{job.pickup_address}</span>
                        <span className="text-gray-400 block truncate">{job.dropoff_address}</span>
                     </td>
                     <td className="px-6 py-4 font-bold">{job.accepted_bid_id ? 'Devis Fixé' : 'Enchère'}</td>
                     <td className="px-6 py-4 text-xs text-gray-500">{new Date(job.created_at).toLocaleDateString()}</td>
                     <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          job.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          job.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          job.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {job.status}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <button onClick={() => setSelectedJob(job)} className="p-2 bg-vanz-ice hover:bg-gray-200 text-vanz-teal rounded-lg transition-colors">
                           <FileText className="w-4 h-4" />
                        </button>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide Out Panel */}
      {selectedJob && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedJob(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto animate-[slide-in-right_300ms_ease-out]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur">
               <h3 className="font-bold text-xl text-[#051E3C]">Détails #{selectedJob.id.substring(0,8)}</h3>
               <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-gray-100 rounded-full">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 space-y-8">
               {/* Client Info */}
               <section>
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Client</h4>
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="font-bold text-gray-800">{selectedJob.client?.first_name} {selectedJob.client?.last_name}</p>
                    <p className="text-gray-500 text-sm">{selectedJob.client?.phone}</p>
                    <p className="text-gray-500 text-sm mt-2">{selectedJob.client?.city}</p>
                 </div>
               </section>

               {/* Chauffeur Info */}
               <section>
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Chauffeur Assigné</h4>
                 {selectedJob.driver ? (
                    <div className="bg-vanz-ice p-4 rounded-xl border border-vanz-teal/20">
                      <p className="font-bold text-vanz-navy">{selectedJob.driver?.users?.first_name} {selectedJob.driver?.users?.last_name}</p>
                      <p className="text-vanz-teal text-sm font-semibold">{selectedJob.driver?.users?.phone}</p>
                    </div>
                 ) : (
                    <div className="p-4 bg-gray-50 rounded-xl text-gray-400 text-sm text-center">
                      Aucun chauffeur assigné
                    </div>
                 )}
               </section>

               {/* Map/Address logic */}
               <section>
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Itinéraire</h4>
                 <div className="space-y-3">
                   <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-vanz-teal mt-2" />
                      <div>
                        <p className="text-xs text-gray-500">Départ</p>
                        <p className="font-semibold text-gray-800 text-sm">{selectedJob.pickup_address}</p>
                      </div>
                   </div>
                   <div className="w-0.5 h-6 bg-gray-200 ml-1" />
                   <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-vanz-yellow mt-2" />
                      <div>
                        <p className="text-xs text-gray-500">Arrivée</p>
                        <p className="font-semibold text-gray-800 text-sm">{selectedJob.dropoff_address}</p>
                      </div>
                   </div>
                 </div>
               </section>

               {/* Admin Actions */}
               {(selectedJob.status === 'open' || selectedJob.status === 'matched') && (
                 <section className="pt-6 border-t border-gray-100">
                    <button 
                      onClick={() => handleCancelAndRefund(selectedJob.id, selectedJob.paymee_ref)}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
                    >
                      <AlertOctagon className="w-5 h-5" />
                      Forcer Annulation & Remboursement
                    </button>
                 </section>
               )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
