'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql } from '@/lib/datasql';
import Navbar from '@/components/homepage/Navbar';
import Footer from '@/components/homepage/Footer';
import BidsList from '@/components/jobs/BidsList';
import ReportIssueModal from '@/components/jobs/ReportIssueModal';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { DeliveryProofUpload } from '@/components/jobs/DeliveryProofUpload';
import { 
  Package, MapPin, CalendarDays, Loader2, Navigation, MessageCircle, Star, FileText, CheckCircle2, AlertTriangle, X, Truck
} from 'lucide-react';

export default function MesMissionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'client' | 'driver' | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'active' | 'completed'>('open');

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeJobId, setDisputeJobId] = useState<string | null>(null);
  const [disputeRole, setDisputeRole] = useState<'client' | 'driver'>('client');

  const [showProofModal, setShowProofModal] = useState(false);
  const [activeCompletionJob, setActiveCompletionJob] = useState<any | null>(null);

  useEffect(() => {
    const fetchUserAndJobs = async () => {
      const { data: { user } } = await datasql.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }
      setUserId(user.id);

      // Fetch Profile to get Role
      const { data: profile } = await datasql.from('users').select('role').eq('id', user.id).single();
      const userRole = profile?.role || 'client';
      setRole(userRole);

      // Find jobs based on role
      let jobsData = [];
      let jobsErr = null;

      if (userRole === 'client') {
        const { data, error } = await datasql
          .from('jobs')
          .select(`
            id, status, service_type, pickup_address, dropoff_address, scheduled_at, client_budget, client_id, created_at, accepted_bid_id, driver_payout,
            reviews(id, reviewer_id, stars),
            bids:bids(id, amount, status, driver_id, driver:users(first_name, last_name, phone_number, vehicle_type, rating))
          `)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        jobsData = data || [];
        jobsErr = error;
      } else {
        // Driver View: Jobs I bid on OR jobs I'm assigned to
        const { data: userBids } = await datasql.from('bids').select('job_id').eq('driver_id', user.id);
        const biddedJobIds = userBids?.map(b => b.job_id) || [];
        
        const { data, error } = await datasql
          .from('jobs')
          .select(`
            id, status, service_type, pickup_address, dropoff_address, scheduled_at, client_budget, client_id, created_at, accepted_bid_id, driver_payout,
            reviews(id, reviewer_id, stars),
            bids:bids(id, amount, status, driver_id, driver:users(first_name, last_name, phone_number, vehicle_type, rating))
          `)
          .or(`id.in.(${biddedJobIds.length > 0 ? biddedJobIds.join(',') : '""'}),accepted_bid_id.is.not.null`) // Fallback to avoid empty IN clause
          .order('created_at', { ascending: false });
          
        // Filter to only show if driver has a bid or is the accepted driver
        jobsData = (data || []).filter(j => 
            biddedJobIds.includes(j.id) || 
            j.bids?.some((b: any) => b.id === j.accepted_bid_id && b.driver_id === user.id)
        );
        jobsErr = error;
      }

      if (!jobsErr) {
        setJobs(jobsData);
      }
      setLoading(false);
    };

    fetchUserAndJobs();

    // Setup realtime subscription to refresh jobs
    const subscription = datasql
      .channel('public:jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        // Simple re-fetch on any job change
        fetchUserAndJobs();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [locale, router]);

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'open') return job.status === 'open';
    if (activeTab === 'active') return ['matched', 'in_progress'].includes(job.status);
    if (activeTab === 'completed') return ['completed', 'cancelled'].includes(job.status);
    return false;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider">En attente</span>;
      case 'matched':
        return <span className="px-3 py-1 rounded-full bg-vanz-teal/20 text-vanz-teal font-bold text-xs uppercase tracking-wider">Accepté</span>;
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full bg-vanz-yellow/20 text-vanz-navy font-black text-xs uppercase tracking-wider">En route 🚚</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs uppercase tracking-wider">Terminée ✅</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-bold text-xs uppercase tracking-wider">Annulée</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-bold text-xs uppercase tracking-wider">{status}</span>;
    }
  };

  const getServiceLabel = (type: string) => {
    const labels: Record<string, string> = {
      moving: 'Déménagement',
      furniture: 'Meuble',
      parcel: 'Colis',
      intercity: 'Interville',
      office: 'Bureaux',
      express: 'Express'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-vanz-teal animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-vanz-teal/10 rounded-[1.5rem] flex items-center justify-center">
                 {role === 'driver' ? <Truck className="w-8 h-8 text-vanz-teal" /> : <Package className="w-8 h-8 text-vanz-teal" />}
             </div>
             <div>
                <h1 className="text-3xl font-black text-vanz-navy">
                  {role === 'driver' ? 'Espace Chauffeur' : 'Mes Expéditions'}
                </h1>
                <p className="text-gray-500 font-medium">
                  {role === 'driver' ? 'Gérez vos gains et missions' : 'Suivez vos demandes de transport'}
                </p>
             </div>
          </div>
          {role === 'client' ? (
            <button 
              onClick={() => router.push(`/${locale}/nouveau-job`)}
              className="px-6 py-4 bg-vanz-yellow text-vanz-navy font-black rounded-2xl shadow-lg shadow-vanz-yellow/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              + Nouvelle Annonce
            </button>
          ) : (
            <button 
              onClick={() => router.push(`/${locale}/chauffeur/missions`)}
              className="px-6 py-4 bg-vanz-navy text-white font-black rounded-2xl shadow-lg shadow-vanz-navy/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              🚚 Marché des Missions
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-10 w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('open')}
            className={`flex-1 min-w-[120px] px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'open' ? 'bg-vanz-navy text-white shadow-xl' : 'text-gray-400 hover:text-vanz-navy hover:bg-gray-50'
            }`}
          >
            {role === 'driver' ? '🏷️ Mes Offres' : '📣 Ouvertes'}
            {jobs.filter(j => j.status === 'open').length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-vanz-yellow text-vanz-navy text-[10px] font-black">{jobs.filter(j => j.status === 'open').length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 min-w-[120px] px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'active' ? 'bg-vanz-teal text-white shadow-xl' : 'text-gray-400 hover:text-vanz-teal hover:bg-gray-50'
            }`}
          >
            ⚡ En Cours
            {jobs.filter(j => ['matched', 'in_progress'].includes(j.status)).length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white text-vanz-teal text-[10px] font-black">{jobs.filter(j => ['matched', 'in_progress'].includes(j.status)).length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 min-w-[120px] px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'completed' ? 'bg-vanz-navy text-white shadow-xl' : 'text-gray-400 hover:text-vanz-navy hover:bg-gray-50'
            }`}
          >
            📁 Historique
          </button>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 text-center shadow-sm">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                {role === 'driver' ? '🚚' : '📦'}
              </div>
              <h3 className="text-2xl font-black text-vanz-navy mb-3">Aucune mission ici</h3>
              <p className="text-gray-500 font-medium max-w-xs mx-auto mb-8">
                {role === 'driver' 
                  ? "Vous n'avez pas encore d'offres en cours. Allez sur le marché pour trouver du travail !"
                  : "Vous n'avez pas encore publié d'annonces dans cette catégorie."}
              </p>
              {role === 'driver' && (
                 <button 
                   onClick={() => router.push(`/${locale}/chauffeur/missions`)}
                   className="px-8 py-4 bg-vanz-teal text-white font-black rounded-2xl shadow-lg shadow-vanz-teal/20 hover:scale-105 transition-all"
                 >
                   Voir le Marché des Missions
                 </button>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Job Header */}
                <div className="p-6 md:p-8 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-vanz-ice flex items-center justify-center">
                        <Package className="w-6 h-6 text-vanz-teal" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-vanz-navy">{getServiceLabel(job.service_type)}</h2>
                        <p className="text-sm text-gray-500 font-medium">
                          {new Date(job.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div>{getStatusBadge(job.status)}</div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 md:gap-12 pl-2">
                    {/* Route */}
                    <div className="flex-1 relative">
                      <div className="absolute left-[7px] top-6 bottom-4 w-0.5 bg-gray-100" />
                      
                      <div className="flex gap-4 mb-4 relative z-10">
                        <div className="w-4 h-4 rounded-full bg-vanz-teal shadow-[0_0_0_4px_white] mt-1" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Départ</p>
                          <p className="text-sm font-bold text-vanz-navy">{job.pickup_address}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 relative z-10">
                        <div className="w-4 h-4 rounded-full bg-vanz-yellow shadow-[0_0_0_4px_white] mt-1" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Arrivée</p>
                          <p className="text-sm font-bold text-vanz-navy">{job.dropoff_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-2xl">
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <CalendarDays className="w-3.5 h-3.5" /> Date Prévue
                        </p>
                        <p className="text-sm font-bold text-vanz-navy">
                          {job.scheduled_at 
                            ? new Date(job.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) 
                            : 'Dès que possible'}
                        </p>
                      </div>
                      {job.client_budget && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            💰 Budget Client
                          </p>
                          <p className="text-sm font-bold text-vanz-navy">{job.client_budget} TND</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Footer / Actions */}
                <div className="p-6 md:p-8 bg-gray-50/50">
                  {job.status === 'open' && job.client_id === userId && (
                    <div>
                      <h3 className="text-sm font-black text-vanz-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span>🏷️ Offres reçues</span>
                        <span className="bg-vanz-yellow text-vanz-navy px-2 py-0.5 rounded-full text-xs">
                          {job.bids?.filter((b: any) => b.status === 'pending').length || 0}
                        </span>
                      </h3>
                      <BidsList jobId={job.id} clientId={userId || ''} />
                    </div>
                  )}

                  {job.status === 'open' && job.client_id !== userId && (
                    <div className="flex items-center gap-3 bg-blue-50 text-blue-800 p-4 rounded-xl font-bold">
                      <Package className="w-5 h-5" />
                      Vous avez soumis une offre. En attente de la décision du client.
                    </div>
                  )}

                  {['matched', 'in_progress'].includes(job.status) && job.bids && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      {/* Driver or Client Info */}
                      {job.bids.filter((b: any) => b.id === job.accepted_bid_id).map((acceptedBid: any) => (
                        <div key={acceptedBid.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 w-full">
                          {job.client_id === userId ? (
                            <>
                              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${acceptedBid.driver?.first_name}`} alt="Driver" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Votre Chauffeur</p>
                                <p className="text-sm font-black text-vanz-navy">
                                  {acceptedBid.driver?.first_name} {acceptedBid.driver?.last_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs font-bold text-vanz-teal">{acceptedBid.amount} TND</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-8 h-8 text-vanz-teal" />
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Statut</p>
                                <p className="text-sm font-black text-vanz-teal">Vous avez remporté cette mission !</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Actions */}
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => router.push(`/${locale}/messages?conv=${job.id}`)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-vanz-teal text-white font-bold rounded-2xl hover:scale-105 transition-transform shadow-md shadow-vanz-teal/20"
                        >
                          <MessageCircle className="w-5 h-5" /> Chat
                        </button>
                        
                        {job.status === 'in_progress' && job.client_id === userId && (
                          <button 
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-vanz-navy text-white font-bold rounded-2xl hover:scale-105 transition-transform"
                            onClick={() => router.push(`/${locale}/suivi/${job.id}`)}
                          >
                            <Navigation className="w-5 h-5" /> Suivre le van
                          </button>
                        )}

                        {['in_progress', 'completed', 'matched'].includes(job.status) && (
                          <button 
                            onClick={() => {
                              setDisputeJobId(job.id);
                              setDisputeRole(job.client_id === userId ? 'client' : 'driver');
                              setDisputeModalOpen(true);
                            }}
                            className="flex-none flex items-center justify-center gap-2 p-4 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-colors"
                            title="Signaler un problème"
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </button>
                        )}

                        {['matched', 'in_progress'].includes(job.status) && job.client_id !== userId && (
                          <div className="flex-1 md:flex-none flex gap-2">
                             <button 
                               className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-vanz-ice text-vanz-navy font-bold rounded-2xl border border-vanz-navy/10 hover:bg-vanz-ice/80 transition-colors"
                               onClick={() => router.push(`/${locale}/chauffeur/tracker/${job.id}`)}
                             >
                               <Navigation className="w-5 h-5" /> Suivre
                             </button>

                             {job.status === 'in_progress' && (
                               <button 
                                 className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-vanz-teal text-white font-black rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-vanz-teal/20"
                                 onClick={() => {
                                   setActiveCompletionJob(job);
                                   setShowProofModal(true);
                                 }}
                               >
                                 <CheckCircle2 className="w-5 h-5" /> Terminer
                               </button>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {job.status === 'completed' && job.driver_payout && (
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-500">Montant final: <span className="text-vanz-navy">{job.driver_payout} TND</span> (Payé)</p>
                        <button className="flex items-center gap-2 text-sm font-bold text-vanz-teal hover:underline">
                          <FileText className="w-4 h-4" /> Voir Facture
                        </button>
                      </div>

                      {/* Review System Integration */}
                      {(() => {
                        const myReview = job.reviews?.find((r: any) => r.reviewer_id === userId);
                        const isClient = job.client_id === userId;
                        const acceptedBid = job.bids?.find((b: any) => b.id === job.accepted_bid_id);
                        
                        if (!acceptedBid) return null; // Edge case
                        const revieweeId = isClient ? acceptedBid.driver_id : job.client_id;
                        
                        if (myReview) {
                           return (
                             <div className="flex items-center gap-3 bg-vanz-teal/5 p-4 rounded-xl border border-vanz-teal/10 w-full mt-4">
                               <div className="w-10 h-10 rounded-full bg-vanz-teal/10 flex items-center justify-center">
                                  <Star className="w-5 h-5 fill-vanz-teal text-vanz-teal" />
                               </div>
                               <div>
                                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Votre Avis</p>
                                 <p className="text-sm font-bold text-vanz-navy">Vous avez noté {myReview.stars}/5 étoiles.</p>
                               </div>
                             </div>
                           );
                        }

                        // Mount Review Form if not reviewed!
                        return (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                             <div className="mb-4">
                               <h4 className="text-sm font-black text-vanz-navy">Comment s'est passée la mission ?</h4>
                               <p className="text-xs text-gray-500 font-medium">Votre avis compte pour la communauté VanZ.</p>
                             </div>
                             <ReviewForm 
                               jobId={job.id} 
                               reviewerId={userId || ''} 
                               revieweeId={revieweeId} 
                               reviewerType={isClient ? 'client' : 'driver'} 
                               onSuccess={() => window.location.reload()}
                             />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />

      <ReportIssueModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        jobId={disputeJobId || ''}
        openerType={disputeRole}
        userId={userId || ''}
      />

      {/* Proof of Delivery Modal */}
      {showProofModal && activeCompletionJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-vanz-navy/80 backdrop-blur-sm" onClick={() => setShowProofModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-vanz-navy text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Clôturer la mission</h3>
                <p className="text-xs text-white/60 font-medium">Téléchargez une preuve photo pour valider</p>
              </div>
              <button 
                onClick={() => setShowProofModal(false)} 
                className="p-2 hover:bg-white/10 rounded-full"
                title="Fermer"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
              <DeliveryProofUpload 
                jobId={activeCompletionJob.id}
                driverId={userId!}
                onProofUploaded={() => {
                  setShowProofModal(false);
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
