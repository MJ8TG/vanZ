'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { datasql } from '@/lib/datasql';
import { 
  Package, MapPin, CalendarDays, Loader2, Navigation, Star, FileText, CheckCircle2, Zap, Truck, CreditCard, ChevronRight
} from 'lucide-react';

export default function DriverDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const tServices = useTranslations('services');

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await datasql.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      try {
        // 1. Fetch driver profile stats
        const { data: userProfile, error: profErr } = await datasql
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profErr) throw profErr;
        
        if (userProfile.role !== 'driver') {
           router.push(`/${locale}/mes-missions`);
           return;
        }

        // 🚨 Protect Route: Only fully registered and APPROVED drivers can access the Dashboard
        const { data: driverAcc } = await datasql
          .from('drivers')
          .select('status')
          .eq('id', user.id)
          .single();

        if (!driverAcc || driverAcc.status !== 'approved') {
          router.push(`/${locale}/signup`);
          return;
        }
        
        setProfile(userProfile);

        // 2. Fetch driver's active jobs (Matched or In Progress)
        const { data: acceptedBids } = await datasql
          .from('bids')
          .select('job_id, amount')
          .eq('driver_id', user.id)
          .eq('status', 'accepted');

        const activeJobIds = acceptedBids?.map(b => b.job_id) || [];

        if (activeJobIds.length > 0) {
          const { data: jobs } = await datasql
            .from('jobs')
            .select(`*`)
            .in('id', activeJobIds)
            .in('status', ['matched', 'in_progress'])
            .order('scheduled_at', { ascending: true });
            
          setActiveJobs(jobs || []);
        } else {
          setActiveJobs([]);
        }

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [locale, router]);

  const getServiceLabel = (type: string) => {
    return tServices(type) || type;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-vanz-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-vanz-navy flex items-center gap-3">
              👋 Bonjour, {profile?.first_name}
            </h1>
            <p className="text-gray-500 font-medium mt-1">Voici votre tableau de bord de chauffeur.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => router.push(`/${locale}/chauffeur/missions`)}
                className="px-6 py-4 bg-vanz-navy text-white font-black rounded-2xl shadow-lg shadow-vanz-navy/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Zap className="w-5 h-5 fill-vanz-yellow text-vanz-yellow" />
                Trouver des missions
             </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/${locale}/profil/wallet`)}>
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                 <CreditCard className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Solde Actuel</p>
                <h2 className="text-2xl font-black text-vanz-navy">{profile?.credit_balance || 0} {tCommon('tnd')}</h2>
              </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="w-16 h-16 bg-vanz-yellow/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                 <Star className="w-8 h-8 fill-vanz-yellow text-vanz-yellow" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Note Globale</p>
                <h2 className="text-2xl font-black text-vanz-navy">{profile?.cached_rating ? profile.cached_rating.toFixed(1) : 'N/A'}</h2>
              </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="w-16 h-16 bg-vanz-teal/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                 <CheckCircle2 className="w-8 h-8 text-vanz-teal" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Missions Complétées</p>
                <h2 className="text-2xl font-black text-vanz-navy">{profile?.total_reviews || 0}</h2>
              </div>
           </div>
        </div>

        {/* Active Missions Section */}
        <div className="mb-8">
           <h2 className="text-xl font-black text-vanz-navy mb-6 flex items-center gap-2">
             <Truck className="w-6 h-6 text-vanz-teal" /> Missions En Cours
           </h2>

           {activeJobs.length === 0 ? (
             <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Package className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-vanz-navy mb-2">Aucune mission active</h3>
                <p className="text-gray-500 font-medium mb-6">Consultez le marché pour trouver de nouvelles opportunités de livraison.</p>
                <button 
                  onClick={() => router.push(`/${locale}/chauffeur/missions`)}
                  className="px-6 py-3 bg-vanz-teal text-white font-bold rounded-xl shadow-lg shadow-vanz-teal/20 transition-all"
                >
                  Ouvrir le marché
                </button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeJobs.map((job) => (
                  <div key={job.id} onClick={() => router.push(`/${locale}/chauffeur/tracker/${job.id}`)} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-vanz-teal/30 transition-all cursor-pointer group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                           <div className="w-12 h-12 bg-vanz-ice rounded-xl flex items-center justify-center">
                              <Package className="w-6 h-6 text-vanz-teal" />
                           </div>
                           <div>
                              <h3 className="font-black text-vanz-navy text-lg">{getServiceLabel(job.service_type)}</h3>
                              <p className="text-xs font-bold text-vanz-teal uppercase px-2 py-0.5 bg-vanz-teal/10 rounded-full inline-block mt-1">
                                {job.status === 'in_progress' ? 'En Route' : 'Confirmé'}
                              </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gains</p>
                           <p className="text-lg font-black text-vanz-navy">{job.driver_payout || job.client_budget || 0} {tCommon('tnd')}</p>
                        </div>
                     </div>

                     <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                       <div className="flex gap-3 mb-3 relative">
                          <div className="w-3 h-3 rounded-full bg-vanz-teal flex-shrink-0 mt-1 shadow-[0_0_0_2px_white]" />
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Point de départ</p>
                            <p className="text-xs font-bold text-gray-700 line-clamp-1">{job.pickup_address}</p>
                          </div>
                       </div>
                       <div className="flex gap-3 relative">
                          <div className="w-3 h-3 rounded-full bg-vanz-yellow flex-shrink-0 mt-1 shadow-[0_0_0_2px_white]" />
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Point d'arrivée</p>
                            <p className="text-xs font-bold text-gray-700 line-clamp-1">{job.dropoff_address}</p>
                          </div>
                       </div>
                     </div>

                     <div className="flex items-center justify-between mt-4 text-xs font-bold text-gray-400 uppercase">
                        <div className="flex items-center gap-1.5">
                           <CalendarDays className="w-4 h-4" />
                           {job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString(locale, { day: 'numeric', month: 'long' }) : 'Asap'}
                        </div>
                        <div className="flex items-center gap-1 text-vanz-teal group-hover:translate-x-1 transition-transform">
                           Gérer <ChevronRight className="w-4 h-4" />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>

      </main>
    </div>
  );
}
