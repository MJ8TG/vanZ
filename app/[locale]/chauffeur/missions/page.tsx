'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql } from '@/lib/datasql';
import Navbar from '@/components/homepage/Navbar';
import Footer from '@/components/homepage/Footer';
import { 
  Package, MapPin, CalendarDays, Loader2, DollarSign, 
  Clock, Check, X, CheckCircle2, ChevronDown, ChevronUp, FileText
} from 'lucide-react';


export default function DriverFeedPage() {
  const router = useRouter();
  const locale = useLocale();
  const [userId, setUserId] = useState<string | null>(null);
  const [isDriver, setIsDriver] = useState<boolean | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bidding states
  const [biddingJobId, setBiddingJobId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await datasql.auth.getUser();
      if (!user) {
        router.push(`/${locale}/test-login`);
        return;
      }
      setUserId(user.id);

      // Verify the user is a driver
      const { data: profile } = await datasql
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'driver') {
        setIsDriver(false);
        setLoading(false);
        return;
      }
      setIsDriver(true);

      fetchJobs(user.id);
    };

    init();

    // Subscribe to new jobs
    const subscription = datasql
      .channel('public:jobs_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        if (userId) fetchJobs(userId);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [locale, router, userId]);

  const fetchJobs = async (uid: string) => {
    // Bring in open jobs along with the user's bids to know if they already bid
    const { data: jobsData, error: jobsErr } = await datasql
      .from('jobs')
      .select(`
        id, 
        service_type, 
        pickup_address, 
        dropoff_address, 
        load_capacity, 
        scheduled_at, 
        description,
        client_budget,
        created_at,
        bids ( id, driver_id )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (jobsErr) {
      console.error(jobsErr);
      return;
    }

    if (jobsData) {
      // Annotate each job with whether THIS driver has already bid
      const annotated = jobsData.map((job: any) => ({
        ...job,
        hasBid: job.bids?.some((b: any) => b.driver_id === uid),
      }));
      setJobs(annotated);
    }
    setLoading(false);
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

  const VehicleLabel = ({ capacity }: { capacity: string }) => {
    const colors: Record<string, string> = {
      moto: 'bg-purple-100 text-purple-700',
      van_s: 'bg-blue-100 text-blue-700',
      van_xl: 'bg-vanz-teal/20 text-vanz-teal',
      camion: 'bg-vanz-yellow/30 text-vanz-navy'
    };
    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${colors[capacity] || 'bg-gray-100 text-gray-500'}`}>
        {capacity}
      </span>
    );
  };

  const handleSubmitBid = async (jobId: string) => {
    if (!amount || Number(amount) <= 0) {
      setError("Le montant doit être supérieur à 0 TND.");
      return;
    }
    setSubmittingBid(true);
    setError(null);

    try {
      const res = await fetch('/api/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          driver_id: userId,
          amount: parseFloat(amount),
          note,
          estimated_duration_minutes: duration ? parseInt(duration) : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh jobs to show 'Offre envoyée'
      fetchJobs(userId!);
      setBiddingJobId(null);
      setAmount('');
      setNote('');
      setDuration('');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi de l'offre");
    } finally {
      setSubmittingBid(false);
    }
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

  if (isDriver === false) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md w-full border border-red-100 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">
              !
            </div>
            <h2 className="text-2xl font-black text-vanz-navy mb-3">Accès Refusé</h2>
            <p className="text-gray-500 font-medium mb-8">
              Vous devez avoir un compte Chauffeur activé pour accéder aux missions disponibles.
            </p>
            <button 
              onClick={() => router.push(`/${locale}`)}
              className="w-full py-4 rounded-xl bg-vanz-navy text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Retour à l'accueil
            </button>
            <button 
              onClick={() => router.push(`/${locale}/devenir-chauffeur`)}
              className="w-full py-4 mt-3 rounded-xl border-2 border-vanz-yellow text-vanz-navy font-black hover:bg-vanz-yellow transition-all"
            >
              Devenir Chauffeur
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-vanz-navy">Missions Disponibles</h1>
            <p className="text-gray-500 font-medium mt-1">Faites des offres sur les missions près de vous</p>
          </div>
          <div className="text-sm font-bold text-vanz-teal bg-vanz-teal/10 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-vanz-teal animate-pulse" />
            Actualisation en direct
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0 cursor-pointer" onClick={() => setError(null)} />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-vanz-navy mb-2">Pas de missions pour l'instant</h3>
              <p className="text-gray-500 font-medium pb-4">Revenez plus tard ou attendez les nouvelles demandes.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-md transition-shadow">
                
                {/* Header info */}
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-vanz-ice flex items-center justify-center flex-shrink-0 mt-1">
                        <Package className="w-6 h-6 text-vanz-teal" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-lg font-black text-vanz-navy">{getServiceLabel(job.service_type)}</h2>
                          <VehicleLabel capacity={job.load_capacity} />
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase">
                          Publiée il y a {Math.max(1, Math.floor((Date.now() - new Date(job.created_at).getTime()) / 60000))} min
                        </p>
                      </div>
                    </div>
                    {job.client_budget && !job.hasBid && (
                      <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 text-center md:text-right">
                        <p className="text-[10px] font-bold text-green-600 uppercase">Budget Client</p>
                        <p className="text-lg font-black text-green-700">{job.client_budget} TND</p>
                      </div>
                    )}
                  </div>

                  {/* Addresses */}
                  <div className="flex flex-col gap-3 mb-6 bg-gray-50 p-4 rounded-2xl relative">
                    <div className="absolute left-[29px] top-8 bottom-8 w-0.5 bg-gray-200" />
                    
                    <div className="flex gap-4 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
                      </div>
                      <div className="flex-1 mt-1.5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Départ</p>
                        <p className="text-sm font-bold text-vanz-navy">{job.pickup_address}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-vanz-yellow" />
                      </div>
                      <div className="flex-1 mt-1.5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Arrivée</p>
                        <p className="text-sm font-bold text-vanz-navy">{job.dropoff_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timing & Desc */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-1">
                        <CalendarDays className="w-3.5 h-3.5" /> Date / Créneau
                      </p>
                      <p className="text-sm font-bold text-vanz-navy">
                        {job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Flexible / Immédiat'}
                      </p>
                    </div>
                    {job.description && (
                      <div className="flex-1">
                         <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-1">
                          <FileText className="w-3.5 h-3.5" /> Description
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bidding Zone */}
                <div className="border-t border-gray-100">
                  {job.hasBid ? (
                    <div className="p-4 bg-green-50 flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      Vous avez envoyé une offre (en attente du client)
                    </div>
                  ) : biddingJobId === job.id ? (
                    <div className="p-6 md:p-8 bg-vanz-ice animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-vanz-navy flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-vanz-teal" /> 
                          Faire une offre
                        </h4>
                        <button onClick={() => setBiddingJobId(null)} className="p-1 hover:bg-white rounded-md text-gray-500" title="Annuler">
                          <X className="w-5 h-5" />
                        </button>

                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prix proposé (TND)</label>
                          <input 
                            type="number" 
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ex: 50"
                            className="w-full py-3 px-4 rounded-xl border border-gray-200 outline-none focus:border-vanz-teal focus:ring-1 focus:ring-vanz-teal text-vanz-navy font-black text-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Durée estimée (min) - Optionnel</label>
                          <input 
                            type="number" 
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="Ex: 45"
                            className="w-full py-3 px-4 rounded-xl border border-gray-200 outline-none focus:border-vanz-teal focus:ring-1 focus:ring-vanz-teal text-vanz-navy font-medium"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Un mot pour le client ? (Optionnel)</label>
                        <input 
                          type="text" 
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Ex: Je suis à 5 min, je peux le faire tout de suite."
                          className="w-full py-3 px-4 rounded-xl border border-gray-200 outline-none focus:border-vanz-teal focus:ring-1 focus:ring-vanz-teal text-vanz-navy"
                        />
                      </div>

                      <button 
                        onClick={() => handleSubmitBid(job.id)}
                        disabled={!amount || submittingBid}
                        className="w-full py-4 bg-vanz-yellow text-vanz-navy rounded-xl font-black text-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingBid ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Soumettre mon offre ({amount || '0'} TND)
                      </button>
                      <p className="text-center text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-wider">
                        Commission VanZ : {(Number(amount) * 0.15).toFixed(2)} TND
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setBiddingJobId(job.id);
                        setAmount(job.client_budget ? job.client_budget.toString() : '');
                        setNote('');
                        setError(null);
                      }}
                      className="w-full p-4 flex items-center justify-center gap-2 text-vanz-teal font-black hover:bg-vanz-ice transition-colors"
                    >
                      Proposer un prix <ChevronDown className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
