'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql } from '@/lib/datasql';
import { LiveTrackingMap } from '@/components/tracking/LiveTrackingMap';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ClientTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const jobId = params.jobId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
          ...driverInfo,
          phone: driverInfo?.phone_number,
          drivers: driverVehicle
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchTrackingData();
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
    <main className="w-full h-screen overflow-hidden bg-black flex flex-col relative">
      {/* Back button overlay */}
      <button 
        onClick={() => router.push(`/${locale}/mes-missions`)}
        className="absolute top-safe mt-6 left-4 z-50 bg-white/90 backdrop-blur aspect-square p-3 rounded-full shadow-lg text-vanz-navy hover:scale-105 transition-transform"
        title="Retour"
        aria-label="Retour"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Re-using the premium LiveTrackingMap component */}
      <LiveTrackingMap 
        job={jobData} 
        driver={driverData} 
        client_id={userId as string} 
      />
    </main>
  );
}
