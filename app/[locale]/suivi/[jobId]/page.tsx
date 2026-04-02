'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql } from '@/lib/datasql';
import { LiveTrackingMap } from '@/components/tracking/LiveTrackingMap';
import ReviewModal from '@/components/jobs/ReviewModal';
import { Loader2, ArrowLeft } from 'lucide-react';

interface Job {
  id: string;
  status: string;
  client_id: string;
  accepted_bid_id: string;
  pickup_address: string;
  destination_address: string;
  dropoff_address: string;
}

export default function ClientTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const jobId = params.jobId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobData, setJobData] = useState<Job | null>(null);
  const [driverData, setDriverData] = useState<{ 
    id: string; 
    first_name: string; 
    last_name: string; 
    phone: string;
    rating: number;
    avatar_url?: string;
    drivers: { vehicle_type: string; vehicle_plate: string } | null;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'client' | 'driver' | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const { data: { user } } = await datasql.auth.getUser();
        if (!user) {
          router.push(`/${locale}/test-login`);
          return;
        }
        setUserId(user.id);

        // Fetch Job Details
        const { data: job, error: jobErr } = await datasql
          .from('jobs')
          .select('*, accepted_bid_id')
          .eq('id', jobId)
          .single();

        if (jobErr || !job) throw new Error("Mission introuvable");
        if (job.client_id !== user.id) throw new Error("Accès non autorisé");
        if (!['in_progress', 'completed'].includes(job.status)) {
          throw new Error("Suivi indisponible pour le statut actuel (" + job.status + ")");
        }

        // Fetch User Role
        const { data: profile } = await datasql.from('users').select('role').eq('id', user.id).single();
        setRole(profile?.role || 'client');

        setJobData(job);

        // Fetch Accepted Driver Details
        const { data: bid } = await datasql
          .from('bids')
          .select('driver_id')
          .eq('id', job.accepted_bid_id)
          .single();

        if (!bid) throw new Error("Aucun chauffeur assigné trouvé");

        const { data: driverInfo } = await datasql
          .from('users')
          .select('id, first_name, last_name, phone_number, rating, avatar_url')
          .eq('id', bid.driver_id)
          .single();

        const { data: driverVehicle } = await datasql
          .from('drivers')
          .select('vehicle_type, vehicle_plate')
          .eq('id', bid.driver_id)
          .single();

        setDriverData({
          id: bid.driver_id,
          first_name: driverInfo?.first_name || '',
          last_name: driverInfo?.last_name || '',
          phone: driverInfo?.phone_number || '',
          rating: driverInfo?.rating || 5,
          avatar_url: driverInfo?.avatar_url,
          drivers: driverVehicle
        });

      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchTrackingData();
      
      // Real-time listener for job status changes
      const channel = datasql
        .channel(`job_status:${jobId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${jobId}`
        }, (payload) => {
          setJobData((prev) => (prev ? { ...prev, ...payload.new } : null));
          if (payload.new.status === 'completed') {
            setShowReviewModal(true);
          }
        })
        .subscribe();

      return () => {
        datasql.removeChannel(channel);
      };
    }
  }, [jobId, locale, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#e8e0d8] items-center justify-center">
        <Loader2 className="w-10 h-10 text-vanz-teal animate-spin mb-4" />
        <p className="text-vanz-navy font-bold">Connexion au GPS en cours...</p>
      </div>
    );
  }

  if (error || !jobData || !driverData) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-md max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">!</div>
          <h2 className="text-xl font-black text-vanz-navy mb-2">Erreur de Suivi</h2>
          <p className="text-gray-500 font-medium mb-6">{error || "Impossible de charger la carte."}</p>
          <button onClick={() => router.push(`/${locale}/mes-missions`)} className="px-6 py-3 bg-vanz-navy text-white font-bold rounded-xl hover:bg-vanz-navy/90 w-full transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5"/> Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Reserved Map Header (Static Height for structured feel) */}
      <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden shadow-2xl z-10">
        <button 
          onClick={() => router.push(`/${locale}/mes-missions`)}
          className="absolute top-6 left-4 z-50 bg-white shadow-xl p-3 rounded-2xl text-vanz-navy hover:scale-105 active:scale-95 transition-all border border-gray-100 flex items-center gap-2 font-bold text-sm"
        >
          <ArrowLeft className="w-5 h-5" /> {role === 'driver' ? 'Tableau de bord' : 'Retour'}
        </button>

        <div className="absolute top-6 right-4 z-50 bg-vanz-navy/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 shadow-xl">
           <div className="w-2 h-2 rounded-full bg-vanz-teal animate-pulse" />
           <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">GPS LIVE Active</span>
        </div>

        <LiveTrackingMap 
          job={jobData} 
          driver={driverData} 
          client_id={userId as string} 
        />
      </div>

      {/* 2. Control Center Dashboard */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 -mt-10 relative z-20 pb-12">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-8">
           
           {/* Primary Mission Card */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              
              {/* Status & Timing */}
              <div className="flex flex-col gap-1">
                 <p className="text-xs font-black text-gray-400 uppercase tracking-tighter">Statut de Mission</p>
                 <h2 className="text-2xl font-black text-vanz-navy capitalize">
                   {jobData.status === 'in_progress' ? '💼 En Transit' : '✅ Terminée'}
                 </h2>
                 <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-vanz-teal/10 text-vanz-teal text-[10px] font-black rounded-lg border border-vanz-teal/20 uppercase">
                      Prise en charge active
                    </span>
                 </div>
              </div>

              {/* Itinerary */}
              <div className="md:col-span-2 bg-gray-50 rounded-3xl p-6 border border-gray-100 relative overflow-hidden">
                 <div className="flex flex-col gap-4 relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                    <div className="flex gap-4 items-start">
                       <div className="w-4 h-4 rounded-full bg-vanz-teal border-4 border-white shadow-sm z-10" />
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Origine</p>
                          <p className="text-sm font-bold text-gray-600 truncate">{jobData.pickup_address}</p>
                       </div>
                    </div>
                    <div className="flex gap-4 items-start">
                       <div className="w-4 h-4 rounded-full bg-vanz-yellow border-4 border-white shadow-sm z-10" />
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Destination</p>
                          <p className="text-sm font-bold text-gray-600 truncate">{jobData.destination_address || jobData.dropoff_address}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Driver & Telemetry Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Driver Info Card */}
              <div className="bg-vanz-navy text-white rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
                 <div className="flex gap-4 items-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black overflow-hidden border border-white/20">
                      {driverData.avatar_url ? <img src={driverData.avatar_url} alt="Chauffeur" className="w-full h-full object-cover" /> : driverData.first_name[0]}
                    </div>
                    <div>
                        <h4 className="font-black text-lg leading-tight">{driverData.first_name} {driverData.last_name}</h4>
                        <div className="flex text-vanz-yellow gap-0.5 mt-1">
                           {[...Array(5)].map((_, i) => (
                             <div key={i} className={`w-3 h-3 rounded-full ${i < Math.floor(driverData.rating) ? 'bg-vanz-yellow' : 'bg-white/20'}`} />
                           ))}
                        </div>
                    </div>
                 </div>
                 <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black text-white/40 uppercase">Véhicule</p>
                       <p className="font-bold text-sm tracking-tight">{driverData.drivers?.vehicle_type || 'Transporteur'}</p>
                    </div>
                    <p className="bg-white/10 px-3 py-1 rounded-lg text-xs font-mono font-black">{driverData.drivers?.vehicle_plate || 'TUNIS — NO PLATE'}</p>
                 </div>
              </div>

              {/* Telemetry Card 1: Chronos */}
              <div className="bg-vanz-teal text-white rounded-[2rem] p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute -right-8 -bottom-8 opacity-10">
                    <Loader2 className="w-48 h-48 animate-[spin_20s_linear_infinite]" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/40 uppercase mb-1">Arrivée estimée</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-5xl font-black tracking-tighter">15</span>
                       <span className="text-lg font-black text-white/60">min</span>
                    </div>
                 </div>
                 <p className="text-xs font-bold text-white/80">Basé sur le trafic en temps réel</p>
              </div>

              {/* Telemetry Card 2: Distance */}
              <div className="bg-white rounded-[2rem] p-6 border-2 border-gray-100 flex flex-col justify-between">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Distance de Livraison</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-5xl font-black text-vanz-navy tracking-tighter">4.2</span>
                       <span className="text-lg font-black text-gray-400">km</span>
                    </div>
                 </div>
                 <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="w-[70%] h-full bg-vanz-yellow rounded-full" />
                 </div>
              </div>

           </div>
           
           {/* Action Bar */}
           <div className="mt-8 flex flex-col md:flex-row gap-4 pt-8 border-t border-gray-100">
              <a 
                href={`tel:${driverData.phone}`} 
                className="flex-1 py-4 bg-vanz-teal text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-vanz-teal/20 hover:scale-[1.02] transition-all"
              >
                 📞 Contacter le Chauffeur
              </a>
              <button 
                onClick={() => router.push(`/${locale}/messages`)}
                className="flex-1 py-4 bg-gray-50 text-vanz-navy rounded-2xl font-black border border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-100 transition-all"
              >
                 💬 Ouvrir le Chat
              </button>
              <button 
                className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all flex items-center justify-center gap-3"
              >
                 🚨 SOS
              </button>
           </div>

        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          jobId={jobId}
          driverId={driverData.id}
          driverName={`${driverData.first_name} ${driverData.last_name}`}
          clientId={userId as string}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => router.push(`/${locale}/mes-missions`)}
        />
      )}
    </main>
  );
}
