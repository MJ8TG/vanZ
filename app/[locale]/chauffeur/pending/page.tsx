'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { datasql as supabase } from '@/lib/datasql';
import { Loader2, ShieldCheck, Clock, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: userData } = await supabase.from('users').select('first_name, last_name, role').eq('id', user.id).single();
      if (userData?.role !== 'driver') {
         router.push(`/${locale}/mes-missions`);
         return;
      }
      setProfile(userData);

      const { data: driverAcc, error } = await supabase
        .from('drivers')
        .select('status, rejection_reason')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!driverAcc) {
         router.push(`/${locale}/signup`);
         return;
      }

      setDriverStatus(driverAcc.status);
      setRejectionReason(driverAcc.rejection_reason);

      if (driverAcc.status === 'approved') {
        router.push(`/${locale}/chauffeur/dashboard`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto-poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [locale, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center">
        <Loader2 className="w-10 h-10 text-vanz-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        
        {/* Header Icon */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-xl ${
          driverStatus === 'rejected' ? 'bg-red-50 text-red-500 shadow-red-500/20' : 'bg-vanz-teal/10 text-vanz-teal shadow-vanz-teal/20'
        }`}>
          {driverStatus === 'rejected' ? (
             <AlertCircle className="w-12 h-12" />
          ) : (
             <ShieldCheck className="w-12 h-12" />
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-vanz-navy mb-4">
            {driverStatus === 'rejected' ? 'Candidature Rejetée' : 'Votre dossier est en cours de validation'}
          </h1>
          <p className="text-gray-500 font-medium text-lg max-w-lg mx-auto">
            {driverStatus === 'rejected' 
              ? 'Malheureusement, votre dossier n\'a pas pu être validé.' 
              : `Merci ${profile?.first_name || ''}, notre équipe de sécurité examine actuellement vos documents. Ce processus prend généralement moins de 24 heures.`}
          </p>
        </div>

        {driverStatus === 'rejected' && rejectionReason && (
          <div className="bg-red-50 w-full p-6 rounded-3xl border border-red-100 mb-8 flex items-start gap-4">
             <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
             <div>
               <p className="text-red-800 font-black mb-1">Motif du rejet :</p>
               <p className="text-red-600 font-medium">{rejectionReason}</p>
               <button 
                 onClick={() => router.push(`/${locale}/signup`)}
                 className="mt-4 px-4 py-2 bg-white text-red-600 font-bold rounded-xl text-sm border border-red-200 hover:bg-red-50 transition-colors"
               >
                 Soumettre un nouveau dossier
               </button>
             </div>
          </div>
        )}

        {driverStatus === 'pending' && (
          <>
            <div className="w-full bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-8">
              <h3 className="font-black text-vanz-navy text-lg mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-vanz-teal" /> Résumé des étapes
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-vanz-teal flex items-center justify-center shrink-0 shadow-md shadow-vanz-teal/20">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-vanz-navy">Inscription complétée</h4>
                    <p className="text-sm text-gray-500 font-medium">Informations personnelles et documents envoyés avec succès.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-vanz-navy">Vérification en cours</h4>
                    <p className="text-sm text-gray-500 font-medium">L'équipe support VanZ vérifie votre identité et votre véhicule.</p>
                  </div>
                </div>

                <div className="flex gap-4 opacity-50 grayscale">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700">Dossier approuvé</h4>
                    <p className="text-sm text-gray-500 font-medium">Accès débloqué au marché des missions.</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={fetchStatus}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-vanz-navy font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-vanz-teal' : ''}`} /> 
              {refreshing ? 'Vérification...' : 'Actualiser le statut'}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
