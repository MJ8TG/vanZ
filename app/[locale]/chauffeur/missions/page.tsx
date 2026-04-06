'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql } from '@/lib/datasql';
import { 
  Package, MapPin, CalendarDays, Loader2, DollarSign, 
  Clock, Check, X, CheckCircle2, ChevronDown, ChevronUp, FileText,
  Navigation, Truck, Shield, Zap, SlidersHorizontal, Map, Building
} from 'lucide-react';
import RouteMap from '@/components/maps/RouteMap';

const VEHICLE_COLORS: Record<string, string> = {
  moto: 'bg-purple-100 text-purple-700',
  van_s: 'bg-blue-100 text-blue-700',
  van_xl: 'bg-vanz-teal/20 text-vanz-teal',
  camion: 'bg-vanz-yellow/30 text-vanz-navy'
};

const SERVICE_LABELS: Record<string, string> = {
  moving: 'Déménagement',
  furniture: 'Meuble',
  parcel: 'Colis',
  intercity: 'Interville',
  office: 'Bureaux',
  express: 'Express'
};

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

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState<'all' | 'gps' | 'city'>('all');
  const [radiusKm, setRadiusKm] = useState<number>(30);
  const [driverCoords, setDriverCoords] = useState<{lat: number, lng: number} | null>(null);
  const [driverCity, setDriverCity] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await datasql.auth.getUser();
      if (!user) {
        router.push(`/${locale}/test-login`);
        return;
      }
      setUserId(user.id);

      const { data: profile } = await datasql
        .from('users')
        .select('role, city')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'driver') {
        setIsDriver(false);
        setLoading(false);
        return;
      }

      // 🚨 Protect Route: Only fully registered and APPROVED drivers can access the market
      const { data: driverAcc } = await datasql
        .from('drivers')
        .select('status')
        .eq('id', user.id)
        .single();

      if (!driverAcc || driverAcc.status !== 'approved') {
        router.push(`/${locale}/signup`);
        return;
      }

      setIsDriver(true);
      if (profile?.city) setDriverCity(profile.city);
      fetchJobs(user.id, locationFilter, radiusKm, driverCoords, profile?.city);
    };

    init();

    const subscription = datasql
      .channel('public:jobs_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        const check = async () => {
          const { data: { user } } = await datasql.auth.getUser();
          if (user) fetchJobs(user.id);
        };
        check();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [locale, router]); // Run once on mount

  // Effect to refetch when filters change
  useEffect(() => {
    if (userId) {
      if (locationFilter === 'gps' && !driverCoords) {
        // Request GPS
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setDriverCoords(coords);
            fetchJobs(userId, 'gps', radiusKm, coords, driverCity);
          },
          (err) => {
            console.error("GPS Error:", err);
            setError("Impossible d'obtenir votre position GPS.");
            setLocationFilter('all');
          }
        );
      } else {
        fetchJobs(userId, locationFilter, radiusKm, driverCoords, driverCity);
      }
    }
  }, [locationFilter, radiusKm]);

  const fetchJobs = async (uid: string, filterMode = 'all', radius = 30, coords = null as any, city = null as any) => {
    setLoading(true);

    let query: any;
    
    if (filterMode === 'gps' && coords) {
       // Use PostGIS RPC
       query = datasql
         .rpc('get_jobs_within_radius', { 
            driver_lat: coords.lat, 
            driver_lng: coords.lng, 
            radius_km: radius 
         });
    } else {
       query = datasql.from('jobs').select('*');
       if (filterMode === 'city' && city) {
         query = query.ilike('pickup_address', `%${city}%`);
       }
       query = query.eq('status', 'open').order('created_at', { ascending: false });
    }

    const { data: jobsData, error: jobsErr } = await query;

    if (jobsErr) {
      console.error(jobsErr);
      setLoading(false);
      return;
    }

    if (jobsData) {
      // Manually fetch bids for these jobs to know if we already bid
      const jobIds = jobsData.map((j: any) => j.id);
      let allBids: any[] = [];
      if (jobIds.length > 0) {
        const { data: bData } = await datasql.from('bids').select('id, job_id, driver_id').in('job_id', jobIds);
        if (bData) allBids = bData;
      }

      const annotated = jobsData.map((job: any) => ({
        ...job,
        hasBid: allBids.some((b: any) => b.job_id === job.id && b.driver_id === uid),
      }));
      setJobs(annotated);
    }
    setLoading(false);
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

      if (userId) fetchJobs(userId);
      setBiddingJobId(null);
      setAmount(''); setNote(''); setDuration('');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi de l'offre");
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-vanz-teal animate-spin" aria-label="Chargement..." />
        </main>
      </div>
    );
  }

  if (isDriver === false) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-12 text-center max-w-md w-full border border-red-100 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
            <h2 className="text-2xl font-black text-vanz-navy mb-3">Accès Chauffeur Requis</h2>
            <p className="text-gray-500 font-medium mb-8">Vous devez avoir un compte Chauffeur pour accéder aux missions.</p>
            <button onClick={() => router.push(`/${locale}`)} className="w-full py-4 rounded-xl bg-vanz-navy text-white font-bold mb-3" title="Retour à l'accueil">Accueil</button>
            <button onClick={() => router.push(`/${locale}/devenir-chauffeur`)} className="w-full py-4 rounded-xl border-2 border-vanz-yellow text-vanz-navy font-black" title="S'inscrire comme chauffeur">Devenir Chauffeur</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-vanz-navy tracking-tight">Missions Disponibles</h1>
            <p className="text-gray-500 font-medium mt-1">Trouvez votre prochaine course en temps réel.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors ${showFilters ? 'bg-vanz-navy text-white' : 'bg-white text-vanz-navy border border-gray-200 hover:bg-gray-50 shadow-sm'}`}
             >
                <SlidersHorizontal className="w-4 h-4" /> Filtres
             </button>
             <div className="text-sm font-bold text-vanz-teal bg-vanz-teal/10 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-vanz-teal/10">
               <span className="w-2 h-2 rounded-full bg-vanz-teal animate-pulse" /> Live Feed
             </div>
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 animate-in slide-in-from-top-4">
             <h3 className="font-black text-vanz-navy mb-4">Filtrage de Zone Géographique</h3>
             
             <div className="grid md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Secteur de recherche</label>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setLocationFilter('all')} className={`px-4 py-2 rounded-full font-bold text-sm transition-colors border ${locationFilter==='all' ? 'bg-vanz-teal text-white border-vanz-teal' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      🌍 Toute la Tunisie
                    </button>
                    <button onClick={() => setLocationFilter('gps')} className={`px-4 py-2 flex items-center gap-2 rounded-full font-bold text-sm transition-colors border ${locationFilter==='gps' ? 'bg-vanz-teal text-white border-vanz-teal' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      <MapPin className="w-4 h-4" /> Position GPS Actuelle
                    </button>
                    {driverCity && (
                      <button onClick={() => setLocationFilter('city')} className={`px-4 py-2 flex items-center gap-2 rounded-full font-bold text-sm transition-colors border ${locationFilter==='city' ? 'bg-vanz-teal text-white border-vanz-teal' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        <Building className="w-4 h-4" /> {driverCity}
                      </button>
                    )}
                  </div>
               </div>

               {locationFilter === 'gps' && (
                 <div>
                    <label htmlFor="radius-range" className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase mb-3">
                      <span>Rayon (Distance Maximum)</span>
                      <span className="text-vanz-teal font-black">{radiusKm} KM</span>
                    </label>
                    <input 
                      id="radius-range"
                      type="range" 
                      min="5" 
                      max="200" 
                      step="5" 
                      value={radiusKm} 
                      onChange={(e) => setRadiusKm(parseInt(e.target.value))} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-vanz-teal"
                      title="Rayon de recherche"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2">
                       <span>5 km</span>
                       <span>200 km</span>
                    </div>
                 </div>
               )}
             </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-100 p-5 rounded-2xl text-sm font-bold mb-8 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3"><Shield className="w-5 h-5 opacity-70" aria-hidden="true" /> {error}</div>
            <button onClick={() => setError(null)} title="Fermer l'erreur"><X className="w-5 h-5" /></button>
          </div>
        )}

        <div className="grid gap-6">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 text-center shadow-sm">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-6" aria-hidden="true" />
              <h3 className="text-xl font-black text-vanz-navy mb-2">Aucune mission disponible</h3>
              <p className="text-gray-500 font-medium">Revenez dans quelques instants.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-vanz-ice flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Package className="w-7 h-7 text-vanz-teal" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <h2 className="text-xl font-black text-vanz-navy">{SERVICE_LABELS[job.service_type] || job.service_type}</h2>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${VEHICLE_COLORS[job.load_capacity] || 'bg-gray-100'}`}>
                            {job.load_capacity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          Il y a {Math.max(1, Math.floor((Date.now() - new Date(job.created_at).getTime()) / 60000))} min
                        </p>
                      </div>
                    </div>
                    {job.client_budget && !job.hasBid && (
                      <div className="bg-vanz-ice px-5 py-3 rounded-2xl border border-vanz-teal/10 w-full md:w-auto text-center">
                        <p className="text-[10px] font-black text-vanz-teal uppercase mb-1">Budget Estimé</p>
                        <p className="text-2xl font-black text-vanz-navy">{job.client_budget} TND</p>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-3xl mb-8 relative border border-gray-100">
                    <div className="space-y-6 relative">
                      <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-gray-200" />
                      <div className="flex gap-3 relative z-10"><div className="w-4 h-4 rounded-full bg-vanz-teal border-4 border-white mt-1" /><div><p className="text-xs font-black text-gray-400 uppercase mb-0.5">DÉPART</p><p className="text-sm font-bold text-gray-700">{job.pickup_address}</p></div></div>
                      <div className="flex gap-3 relative z-10"><div className="w-4 h-4 rounded-full bg-vanz-yellow border-4 border-white mt-1" /><div><p className="text-xs font-black text-gray-400 uppercase mb-0.5">ARRIVÉE</p><p className="text-sm font-bold text-gray-700">{job.dropoff_address}</p></div></div>
                    </div>
                    <div className="space-y-4">
                      <div><p className="text-xs font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" aria-hidden="true" /> Planifiée pour</p><p className="text-sm font-bold text-vanz-navy">{job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Maintenant / Flexible'}</p></div>
                      {job.description && (<div><p className="text-xs font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" aria-hidden="true" /> Note client</p><p className="text-sm text-gray-500 font-medium line-clamp-2 italic">&quot;{job.description}&quot;</p></div>)}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6 mt-6">
                    {job.hasBid ? (
                       <div className="w-full py-4 bg-green-50 text-green-700 rounded-2xl font-black text-center flex items-center justify-center gap-2 border border-green-100">
                          <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> Offre envoyée
                       </div>
                    ) : biddingJobId === job.id ? (
                       <div className="bg-vanz-ice/50 p-6 rounded-3xl animate-in slide-in-from-top-4">
                          <div className="flex justify-between items-center mb-6">
                             <h4 className="font-black text-vanz-navy uppercase text-sm tracking-widest">Votre Proposition</h4>
                             <button onClick={() => setBiddingJobId(null)} className="p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-vanz-navy" title="Annuler l'offre"><X className="w-5 h-5" /></button>
                          </div>

                          {/* MAP VIEW */}
                          {job.pickup_lat && job.dropoff_lat && (
                            <div className="mb-6 mt-2">
                              <RouteMap 
                                pickupLat={job.pickup_lat} 
                                pickupLng={job.pickup_lng} 
                                dropoffLat={job.dropoff_lat} 
                                dropoffLng={job.dropoff_lng}
                                className="h-48 w-full rounded-2xl shadow-sm border border-vanz-teal/20"
                              />
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-4 mb-6">
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Prix (TND)</label>
                                <input type="number" title="Montant de l'offre" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-white rounded-xl border-2 border-transparent focus:border-vanz-teal outline-none font-black text-xl text-vanz-navy shadow-sm" />
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Durée (Min)</label>
                                <input type="number" title="Durée estimée" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45" className="w-full p-4 bg-white rounded-xl border-2 border-transparent focus:border-vanz-teal outline-none font-bold text-vanz-navy shadow-sm" />
                             </div>
                          </div>
                          <div className="mb-6">
                             <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Message optionnel</label>
                             <input type="text" title="Message au client" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: Disponible dans 15 min" className="w-full p-4 bg-white rounded-xl border-2 border-transparent focus:border-vanz-teal outline-none font-medium text-vanz-navy shadow-sm" />
                          </div>
                          <button onClick={() => handleSubmitBid(job.id)} disabled={submittingBid || !amount} className="w-full py-5 bg-vanz-teal text-white rounded-2xl font-black text-lg shadow-xl shadow-vanz-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3" title="Confirmer et envoyer l'offre">
                             {submittingBid ? <Loader2 className="w-6 h-6 animate-spin" aria-label="Envoi..." /> : <Zap className="w-6 h-6" aria-hidden="true" />}
                             Confirmer l&apos;offre
                          </button>
                       </div>
                    ) : (
                       <button onClick={() => { setBiddingJobId(job.id); setAmount(job.client_budget || ''); }} className="w-full py-4 rounded-2xl border-2 border-vanz-teal text-vanz-teal font-black hover:bg-vanz-teal hover:text-white transition-all flex items-center justify-center gap-2" title="Ouvrir le formulaire d'offre">
                          🏷️ Faire une offre
                       </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
