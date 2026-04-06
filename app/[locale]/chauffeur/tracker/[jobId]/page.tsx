'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql } from '@/lib/datasql';
import { Loader2, ArrowLeft, Navigation, Play, Pause, CheckCircle2, Camera } from 'lucide-react';
import { uploadFile } from '@/lib/upload';

interface Job {
  id: string;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  pickup_address: string;
  dropoff_address: string;
  accepted_bid_id: string;
  destination_address: string;
}

export default function DriverTrackingConsole() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const jobId = params.jobId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobData, setJobData] = useState<Job | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // ... (rest of states)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const init = async () => {
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
        
        // Verify Driver is assigned to this job
        const { data: bid } = await datasql
          .from('bids')
          .select('driver_id')
          .eq('id', job.accepted_bid_id)
          .single();

        if (bid?.driver_id !== user.id) throw new Error("Cette mission n'est pas la vôtre.");

        setJobData(job);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      init();
    }

    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [jobId, locale, router]);

  const toggleSimulation = () => {
    if (!jobData) return;
    if (isSimulating) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      // Start pushing fake coordinates towards the dropoff point
      
      // Starting lat/lng (Mock start somewhere near pickup)
      let currentLat = jobData.pickup_lat + 0.01;
      let currentLng = jobData.pickup_lng + 0.01;
      let stepCount = 0;
      
      simulationRef.current = setInterval(async () => {
        if (!jobData) return;
        stepCount++;
        // Slowly move towards dropoff
        currentLat += (jobData.dropoff_lat - currentLat) * 0.1;
        currentLng += (jobData.dropoff_lng - currentLng) * 0.1;

        // Upsert into driver_locations
        const upsertData = {
          driver_id: userId,
          job_id: jobId,
          lat: currentLat,
          lng: currentLng,
          heading: (stepCount * 15) % 360, // Fake heading changes
          updated_at: new Date().toISOString()
        };

        const { error: upsertErr } = await datasql
          .from('driver_locations')
          .upsert(upsertData, { onConflict: 'driver_id' });

        if (upsertErr) {
          console.error("Simulation error", upsertErr);
        }

        if (stepCount >= 100) { // Stop after 100 updates
          if (simulationRef.current) clearInterval(simulationRef.current);
          setIsSimulating(false);
        }
      }, 3000); // Push every 3 seconds to trigger the realtime animation on the client side
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCompleteJob = async () => {
    try {
      if (!photoFile) {
        alert("Preuve de livraison photo obligatoire (Photo du colis devant la porte ou avec le client).");
        return;
      }

      if (!confirm("Voulez-vous clôturer cette mission ? Le paiement sera crédité sur votre compte.")) return;
      
      setIsUploading(true);
      
      // 1. Upload photo to Supabase
      const timestamp = new Date().getTime();
      const fileName = `${jobId}_proof_${timestamp}.jpg`;
      const bucketPath = `job-proofs/${userId}/${fileName}`;
      const photoUrl = await uploadFile('driver-documents', bucketPath, photoFile);
      
      // 2. Get location for geotagging proof
      let lat = null;
      let lng = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => 
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        console.warn("Geotagging failed, proceeding without coordinates.");
      }

      // 3. Call Completion API
      const res = await fetch('/api/jobs/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          driver_id: userId,
          delivery_photo_url: photoUrl,
          delivery_photo_lat: lat,
          delivery_photo_lng: lng
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur lors de la clôture.");

      alert("🎉 Félicitations ! Mission clôturée. Gains: " + result.data.driver_payout + " TND.");
      router.push(`/${locale}/mes-missions`);
    } catch (err: unknown) {
      console.error(err);
      alert((err as Error).message || "Une erreur est survenue.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 text-vanz-teal animate-spin mb-4" />
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-md max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">!</div>
          <h2 className="text-xl font-black text-vanz-navy mb-2">Accès Refusé</h2>
          <p className="text-gray-500 font-medium mb-6">{error}</p>
          <button onClick={() => router.push(`/${locale}/chauffeur/missions`)} className="px-6 py-3 bg-vanz-navy text-white font-bold rounded-xl hover:bg-vanz-navy/90 w-full">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-md w-full relative">
        <button 
          onClick={() => router.push(`/${locale}/mes-missions`)}
          className="bg-white p-3 rounded-xl shadow-sm text-vanz-navy hover:bg-gray-50 mb-6 flex items-center gap-2 font-bold"
        >
          <ArrowLeft className="w-5 h-5" /> Quitter Tracker
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-vanz-navy p-6 pb-8 text-center text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-vanz-teal/20 blur-3xl rounded-full" />
            <Navigation className="w-12 h-12 text-vanz-yellow mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-1">Console Chauffeur</h1>
            <p className="text-vanz-ice font-medium">Mission #{jobId.split('-')[0]}</p>
          </div>

          <div className="p-6 -mt-4 relative bg-white rounded-t-3xl">
            <div className="flex flex-col gap-3 mb-8 bg-gray-50 p-4 rounded-2xl relative border border-gray-100">
              <div className="absolute left-[29px] top-8 bottom-8 w-0.5 bg-gray-200" />
              <div className="flex gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-vanz-teal" />
                </div>
                <div className="flex-1 mt-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Départ</p>
                  <p className="text-xs font-bold text-vanz-navy truncate">{jobData.pickup_address}</p>
                </div>
              </div>
              <div className="flex gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-vanz-yellow" />
                </div>
                <div className="flex-1 mt-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Arrivée</p>
                  <p className="text-xs font-bold text-vanz-navy truncate">{jobData.dropoff_address}</p>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-black text-vanz-navy uppercase tracking-wider mb-3">Outils GPS</h3>
            <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
              Le suivi GPS réel nécessite une API Key Google Maps. Pour faire une démonstration à vos investisseurs, vous pouvez utiliser le simulateur intégré ci-dessous.
            </p>

            <button
              onClick={toggleSimulation}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                isSimulating 
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                  : 'bg-[#2BBFDF] text-white hover:brightness-105 shadow-[#2BBFDF]/20'
              }`}
            >
              {isSimulating ? (
                <><Pause className="w-5 h-5 fill-current" /> Arrêter la simulation</>
              ) : (
                <><Play className="w-5 h-5 fill-current" /> Lancer le Van Virtuel</>
              )}
            </button>

            {isSimulating && (
              <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-xs font-medium border border-blue-100 flex items-start gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0 mt-0.5" />
                <p>
                  <strong>En cours.</strong> La base de données reçoit des coordonnées toutes les 3 secondes. 
                  Ouvrez la page `/suivi/{jobId}` en tant que client sur un autre écran pour voir le Van bouger en temps réel !
                </p>
              </div>
            )}

            <hr className="my-8 border-gray-100" />
            
            <div className="mb-6">
              <h3 className="text-sm font-black text-vanz-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-vanz-teal" /> Preuve de Livraison
              </h3>
              
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  title="Prendre une photo de la livraison"
                  aria-label="Prendre une photo de la livraison"
                />
                
                {photoPreview ? (
                  <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-vanz-teal/30 shadow-lg">
                    <img src={photoPreview} alt="Proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Changer la photo
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center hover:border-vanz-teal/50 hover:bg-vanz-teal/5 transition-all">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-vanz-teal mb-4 group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-vanz-navy mb-1">Prendre la photo</p>
                    <p className="text-xs text-gray-400 font-medium max-w-[180px]">Colis à destination avec preuve visible du domicile.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCompleteJob}
              disabled={isSimulating || isUploading}
              className="w-full py-4 rounded-xl bg-green-500 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isUploading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Clôture en cours...</>
              ) : (
                <><CheckCircle2 className="w-6 h-6" /> Confirmer la Livraison</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
