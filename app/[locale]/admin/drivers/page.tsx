'use client';

import { useState, useEffect } from 'react';
import { datasql as supabase } from '@/lib/datasql';
import { 
  Search, ShieldCheck, XCircle, Clock, X, ChevronRight, 
  Truck, CreditCard, FileText, Image as ImageIcon, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function AdminDriversApprovalPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    // Fetch drivers joined with users
    const { data, error } = await supabase
      .from('drivers')
      .select('*, users!drivers_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  const filteredDrivers = drivers.filter(d => {
    const name = `${d.users?.first_name} ${d.users?.last_name}`.toLowerCase();
    const phone = d.users?.phone || '';
    const s = search.toLowerCase();
    return name.includes(s) || phone.includes(s);
  });

  const handleUpdateStatus = async (status: 'approved' | 'rejected', reason?: string) => {
    if (!selectedDriver) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status, 
          rejection_reason: reason || null,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', selectedDriver.id);

      if (error) throw error;

      // Update local state
      setDrivers(prev => prev.map(d => d.id === selectedDriver.id ? { ...d, status, rejection_reason: reason || null } : d));
      setSelectedDriver(null);
      alert(status === 'approved' ? "Chauffeur approuvé !" : "Candidature rejetée.");
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectionPrompt = () => {
    const reason = window.prompt("Motif du rejet (sera envoyé par SMS/Push) :");
    if (reason !== null) {
      handleUpdateStatus('rejected', reason);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-vanz-navy">Gestion des Chauffeurs</h1>
          <p className="text-gray-500 font-medium">Validation des dossiers et vérification des documents.</p>
        </div>

        <div className="flex gap-2">
           <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
             <p className="text-[10px] uppercase font-bold text-gray-400">En attente</p>
             <p className="text-lg font-black text-orange-500">{drivers.filter(d => d.status === 'pending').length}</p>
           </div>
           <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
             <p className="text-[10px] uppercase font-bold text-gray-400">Approuvés</p>
             <p className="text-lg font-black text-vanz-teal">{drivers.filter(d => d.status === 'approved').length}</p>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou téléphone..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-vanz-teal outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-48 rounded-2xl animate-pulse border border-gray-100"></div>
          ))
        ) : filteredDrivers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
             <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
             <p className="text-gray-400 font-bold">Aucun dossier trouvé.</p>
          </div>
        ) : (
          filteredDrivers.map((driver) => (
            <div 
              key={driver.id} 
              onClick={() => setSelectedDriver(driver)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-vanz-teal cursor-pointer transition-all group relative overflow-hidden"
            >
              {/* Status Ribbon */}
              <div className={`absolute top-0 right-0 px-4 py-1 text-[10px] font-black uppercase rounded-bl-xl ${
                driver.status === 'approved' ? 'bg-vanz-teal/10 text-vanz-teal' :
                driver.status === 'rejected' ? 'bg-red-50 text-red-500' :
                'bg-orange-50 text-orange-500 animate-pulse'
              }`}>
                {driver.status}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-vanz-ice flex items-center justify-center text-vanz-teal font-black text-xl">
                   {driver.users?.first_name[0]}{driver.users?.last_name[0]}
                </div>
                <div>
                   <h3 className="font-bold text-vanz-navy text-lg group-hover:text-vanz-teal transition-colors">
                     {driver.users?.first_name} {driver.users?.last_name}
                   </h3>
                   <p className="text-sm text-gray-500 font-medium">{driver.users?.phone}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-tighter">Véhicule</span>
                  <span className="font-black text-vanz-navy">{driver.vehicle_brand} {driver.vehicle_model}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-tighter">Matricule</span>
                  <span className="font-black text-vanz-navy">{driver.vehicle_plate}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-tighter">Ville</span>
                  <span className="font-black text-vanz-navy capitalize">{driver.users?.city || '-'}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-vanz-teal group-hover:text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Slide-over Panel */}
      {selectedDriver && (
        <>
          <div className="fixed inset-0 bg-vanz-navy/40 backdrop-blur-sm z-[60] animate-in fade-in" onClick={() => setSelectedDriver(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white z-[70] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-vanz-teal text-white flex items-center justify-center font-black text-xl">
                  {selectedDriver.users?.first_name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-black text-vanz-navy">{selectedDriver.users?.first_name} {selectedDriver.users?.last_name}</h2>
                  <p className="text-gray-500 font-bold text-sm">Candidature au poste de Chauffeur</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDriver(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Fermer"
                aria-label="Fermer"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-10">
              {/* Quick Actions if Pending */}
              {selectedDriver.status === 'pending' && (
                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div>
                     <p className="text-orange-800 font-black text-lg">Action Requise</p>
                     <p className="text-orange-600 text-sm font-medium">Vérifiez les documents ci-dessous avant d'approuver.</p>
                   </div>
                   <div className="flex gap-3 w-full md:w-auto">
                     <button 
                       disabled={isProcessing}
                       onClick={openRejectionPrompt}
                       className="flex-1 md:flex-none px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                     >
                       <XCircle className="w-4 h-4" /> Rejeter
                     </button>
                     <button 
                       disabled={isProcessing}
                       onClick={() => handleUpdateStatus('approved')}
                       className="flex-1 md:flex-none px-8 py-3 bg-vanz-teal text-white rounded-2xl font-black text-sm hover:bg-vanz-teal/90 shadow-lg shadow-vanz-teal/20 transition-all flex items-center justify-center gap-2"
                     >
                       {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Approuver
                     </button>
                   </div>
                </div>
              )}

              {/* Driver Identity */}
              <section>
                <div className="flex items-center gap-2 mb-6 text-vanz-navy">
                  <CreditCard className="w-5 h-5 text-vanz-teal" />
                  <h3 className="font-black uppercase tracking-wider text-sm">Identité & CIN</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Numéro CIN</p>
                        <p className="font-black text-vanz-navy">{selectedDriver.cin_number}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Date d'expiration CIN</p>
                        <p className="font-black text-vanz-navy">{selectedDriver.cin_expiry}</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="group relative rounded-2xl aspect-[4/3] bg-gray-100 border border-gray-100 overflow-hidden">
                        {selectedDriver.cin_front_url ? (
                           <img src={selectedDriver.cin_front_url} alt="CIN Front" className="w-full h-full object-cover" />
                        ) : (
                           <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon className="w-8 h-8" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <a href={selectedDriver.cin_front_url} target="_blank" className="text-white text-xs font-black underline">Voir plein écran</a>
                        </div>
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] font-bold px-2 py-1 rounded">CIN FACE</span>
                      </div>
                      <div className="group relative rounded-2xl aspect-[4/3] bg-gray-100 border border-gray-100 overflow-hidden">
                        {selectedDriver.cin_back_url ? (
                           <img src={selectedDriver.cin_back_url} alt="CIN Back" className="w-full h-full object-cover" />
                        ) : (
                           <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon className="w-8 h-8" /></div>
                        )}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <a href={selectedDriver.cin_back_url} target="_blank" className="text-white text-xs font-black underline">Voir plein écran</a>
                        </div>
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] font-bold px-2 py-1 rounded">CIN DOS</span>
                      </div>
                   </div>
                </div>
              </section>

              {/* Vehicle Section */}
              <section>
                <div className="flex items-center gap-2 mb-6 text-vanz-navy">
                  <Truck className="w-5 h-5 text-vanz-teal" />
                  <h3 className="font-black uppercase tracking-wider text-sm">Véhicule & Matériel</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 relative group">
                      {selectedDriver.vehicle_photo_url ? (
                         <img src={selectedDriver.vehicle_photo_url} alt="Vehicle" className="w-full h-full object-cover" />
                      ) : (
                         <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon className="w-12 h-12" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                         <span className="bg-vanz-navy/80 text-white text-xs font-black px-4 py-2 rounded-full backdrop-blur">Photo du véhicule</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Marque / Modèle</p>
                        <p className="font-black text-vanz-navy">{selectedDriver.vehicle_brand} {selectedDriver.vehicle_model}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Année</p>
                        <p className="font-black text-vanz-navy">{selectedDriver.vehicle_year}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Capacité</p>
                        <p className="font-black text-vanz-navy">{selectedDriver.vehicle_capacity} kg</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Matricule</p>
                        <p className="font-black text-vanz-navy">{selectedDriver.vehicle_plate}</p>
                      </div>
                   </div>
                </div>
              </section>

              {/* Documents Checklist */}
              <section className="bg-vanz-ice/30 rounded-3xl p-8 border border-vanz-teal/10">
                <div className="flex items-center gap-2 mb-6 text-vanz-navy">
                  <FileText className="w-5 h-5 text-vanz-teal" />
                  <h3 className="font-black uppercase tracking-wider text-sm">Pièces Jointes Obligatoires</h3>
                </div>
                <div className="space-y-4">
                   {[
                     { label: 'Carte Grise', url: selectedDriver.doc_carte_grise },
                     { label: 'Assurance', url: selectedDriver.doc_assurance },
                     { label: 'Permis de Conduire', url: selectedDriver.doc_permis },
                     { label: 'Visite Technique', url: selectedDriver.doc_visite_technique }
                   ].map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                         <div className="flex items-center gap-3">
                           {doc.url ? <CheckCircle2 className="w-5 h-5 text-vanz-teal" /> : <XCircle className="w-5 h-5 text-gray-300" />}
                           <span className="font-bold text-vanz-navy">{doc.label}</span>
                         </div>
                         {doc.url ? (
                           <a href={doc.url} target="_blank" className="text-vanz-teal font-black text-xs hover:underline uppercase tracking-tighter">Ouvrir le document</a>
                         ) : (
                           <span className="text-gray-300 text-xs font-bold uppercase">Non fourni</span>
                         )}
                      </div>
                   ))}
                </div>
              </section>

              {/* Moderation History Placeholder */}
              {selectedDriver.status === 'rejected' && (
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-start gap-4">
                   <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                   <div>
                     <p className="text-red-800 font-black">Candidature Rejetée</p>
                     <p className="text-red-600 text-sm font-medium mt-1">Raison: {selectedDriver.rejection_reason || "Non spécifiée"}</p>
                   </div>
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-between items-center z-10">
               <div className="text-xs text-gray-400 font-medium">Inscrit le {new Date(selectedDriver.created_at).toLocaleDateString()}</div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setSelectedDriver(null)}
                    className="px-6 py-3 text-gray-500 font-black text-sm"
                  >
                    Fermer
                  </button>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}></div>;
}
