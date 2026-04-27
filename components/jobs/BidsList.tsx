"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { datasql } from "@/lib/datasql";
import { Star, MessageCircle, Check, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export interface Bid {
  id: string;
  amount: number;
  note: string;
  estimated_duration_minutes: number;
  driver_id: string;
  driver: {
    first_name: string;
    last_name: string;
    vehicle_type: string;
    rating: number;
    jobs_count: number;
  };
}

interface BidsListProps {
  jobId: string;
  clientId: string;
}

export default function BidsList({ jobId, clientId }: BidsListProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [acceptedBidId, setAcceptedBidId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('bids');
  const tCommon = useTranslations('common');

  useEffect(() => {
    // Fetch existing bids
    const fetchBids = async () => {
      const { data } = await datasql
        .from('bids')
        .select('id, amount, note, estimated_duration_minutes, driver_id, status')
        .eq('job_id', jobId)
        .eq('status', 'pending')
        .order('amount', { ascending: true });

      if (data) {
        // Fetch driver details for each bid
        const enriched = await Promise.all(data.map(async (bid) => {
          const { data: driver } = await datasql
            .from('users_public')
            .select('first_name, last_name')
            .eq('id', bid.driver_id)
            .maybeSingle();

          const { data: driverProfile } = await datasql
            .from('drivers')
            .select('vehicle_type')
            .eq('id', bid.driver_id)
            .maybeSingle();

          const { data: reviews } = await datasql
            .from('reviews')
            .select('stars')
            .eq('reviewee_id', bid.driver_id);

          const avgRating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
            : 4.5;

          return {
            ...bid,
            driver: {
              first_name: driver?.first_name || (locale === 'ar' ? 'سائق' : 'Chauffeur'),
              last_name: driver?.last_name || '',
              vehicle_type: driverProfile?.vehicle_type || 'van',
              rating: Math.round(avgRating * 10) / 10,
              jobs_count: reviews?.length || 0,
            }
          } as Bid;
        }));

        setBids(enriched);
      }
    };
    fetchBids();

    // Realtime subscription for new bids
    const channel = datasql
      .channel(`public:bids:job_id=eq.${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `job_id=eq.${jobId}` },
        async (payload) => {
          const newBidRaw = payload.new;

          // Fetch driver info for the new bid
          const { data: driver } = await datasql
            .from('users_public')
            .select('first_name, last_name')
            .eq('id', newBidRaw.driver_id)
            .maybeSingle();

          const { data: driverProfile } = await datasql
            .from('drivers')
            .select('vehicle_type')
            .eq('id', newBidRaw.driver_id)
            .maybeSingle();

          const newBid: Bid = {
            ...newBidRaw as any,
            driver: {
              first_name: driver?.first_name || (locale === 'ar' ? 'سائق' : 'Chauffeur'),
              last_name: driver?.last_name || '',
              vehicle_type: driverProfile?.vehicle_type || 'van',
              rating: 4.8,
              jobs_count: 0,
            }
          };

          setBids((current) => {
            const updated = [...current, newBid];
            return updated.sort((a, b) => a.amount - b.amount);
          });
        }
      )
      .subscribe();

    return () => { datasql.removeChannel(channel); };
  }, [jobId]);

  // "Meilleure offre" badge logic
  const isBest = (bid: Bid) => {
    if (bids.length === 0) return false;
    const lowestAmount = Math.min(...bids.map(b => b.amount));
    return (
      bid.amount === lowestAmount &&
      bid.driver.rating >= 4.5 &&
      bid.driver.jobs_count >= 10
    );
  };

  // Accept bid handler
  const handleAcceptBid = async (bid: Bid) => {
    setAcceptingBidId(bid.id);
    setError(null);

    try {
      const res = await fetch('/api/jobs/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          bid_id: bid.id,
          client_id: clientId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errorAccept'));
      }

      setAcceptedBidId(bid.id);

      // Redirect to messages after 2 seconds
      setTimeout(() => {
        if (data.data?.conversation_id) {
          router.push(`/${locale}/messages?conv=${data.data.conversation_id}`);
        } else {
          router.push(`/${locale}/messages`);
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setAcceptingBidId(null);
    }
  };

  if (acceptedBidId) {
    const accepted = bids.find(b => b.id === acceptedBidId);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
      >
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-green-800 mb-2">{t('acceptedTitle')}</h3>
        <p className="text-green-600 font-medium mb-1">
          {accepted?.driver.first_name} {accepted?.driver.last_name} — {accepted?.amount} {tCommon('tnd')}
        </p>
        <p className="text-sm text-green-500 animate-pulse font-bold mt-4">
          {t('redirecting')}
        </p>
      </motion.div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 animate-pulse">
          <Star className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">{t('loadingBids')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('emptySubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <AnimatePresence>
        {bids.map((bid) => {
          const best = isBest(bid);
          const isAccepting = acceptingBidId === bid.id;
          
          return (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
              className={`relative p-5 rounded-2xl border ${best ? 'border-vanz-yellow bg-[#FFFAF0] shadow-sm' : 'border-gray-200 bg-white'}`}
            >
              {best && (
                <span className="absolute -top-3 left-4 bg-vanz-yellow text-vanz-navy text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-vanz-navy" /> {t('bestOffer')}
                </span>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">
                    {bid.driver.first_name} {bid.driver.last_name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 
                      <span className="font-semibold text-gray-700">{bid.driver.rating.toFixed(1)}</span> 
                      ({bid.driver.jobs_count} {t('courses')})
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                      {bid.driver.vehicle_type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl text-vanz-navy">{bid.amount} <span className="text-sm text-gray-500 font-normal">{tCommon('tnd')}</span></p>
                  <p className="text-xs font-medium text-gray-500 mt-1">~ {bid.estimated_duration_minutes} min</p>
                </div>
              </div>

              {bid.note && (
                <p className="text-gray-600 text-sm mb-5 bg-white p-3 rounded-xl border border-gray-100 italic">
                  &quot;{bid.note}&quot;
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                <button 
                  onClick={() => handleAcceptBid(bid)}
                  disabled={isAccepting || !!acceptingBidId}
                  className="flex-1 bg-vanz-teal hover:bg-[#20A8C5] text-white font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAccepting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {t('accepting')}</>
                  ) : (
                    <><Check className="w-5 h-5" /> {t('accept')}</>
                  )}
                </button>
                <button className="bg-vanz-ice hover:bg-gray-200 text-vanz-navy font-semibold py-3 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-transparent hover:border-gray-300">
                  <MessageCircle className="w-5 h-5" /> {t('message')}
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
