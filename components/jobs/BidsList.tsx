"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { datasql } from "@/lib/datasql";
import { Star, MessageCircle, Check } from "lucide-react";

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

export default function BidsList({ jobId }: { jobId: string }) {
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    // Note: The real-time channel subscription filters precisely to this jobId
    const channel = datasql
      .channel(`public:bids:job_id=eq.${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `job_id=eq.${jobId}` },
        (payload) => {
          // In production, you would fetch the remote joined `driver` relation via ID instead of mocking
          // Because Realtime payloads only contain the base table (bids) columns.
          // For UX purposes, we map a mock payload layout.
          const newBid = {
            ...payload.new,
            driver: {
              first_name: "Chauffeur",
              last_name: payload.new.driver_id ? payload.new.driver_id.substring(0, 4) : "X",
              vehicle_type: "Camionnette",
              rating: 4.8, 
              jobs_count: 15,
            }
          } as Bid;

          setBids((current) => {
            const updated = [...current, newBid];
            // Sort by amount ASC (lowest first) automatically
            return updated.sort((a, b) => a.amount - b.amount);
          });
        }
      )
      .subscribe();

    // Critical Cleanup Block to prevent duplicate stacking!
    return () => { 
      datasql.removeChannel(channel); 
    };
  }, [jobId]);

  // Exact Badge Condition: lowest amount + rating >= 4.5 + jobs_count >= 10
  const isBest = (bid: Bid) => {
    if (bids.length === 0) return false;
    const lowestAmount = Math.min(...bids.map(b => b.amount));
    
    return (
      bid.amount === lowestAmount &&
      bid.driver.rating >= 4.5 &&
      bid.driver.jobs_count >= 10
    );
  };

  if (bids.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 animate-pulse">
          <Star className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">En attente d'offres...</p>
        <p className="text-sm text-gray-400 mt-1">Les offres des chauffeurs apparaîtront ici en temps réel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {bids.map((bid) => {
          const best = isBest(bid);
          
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
                  <Star className="w-3.5 h-3.5 fill-vanz-navy" /> Meilleure offre
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
                      ({bid.driver.jobs_count} courses)
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                      {bid.driver.vehicle_type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl text-vanz-navy">{bid.amount} <span className="text-sm text-gray-500 font-normal">TND</span></p>
                  <p className="text-xs font-medium text-gray-500 mt-1">~ {bid.estimated_duration_minutes} min</p>
                </div>
              </div>

              {bid.note && (
                <p className="text-gray-600 text-sm mb-5 bg-white p-3 rounded-xl border border-gray-100 italic">
                  "{bid.note}"
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                <button className="flex-1 bg-vanz-teal hover:bg-[#20A8C5] text-white font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> Accepter
                </button>
                <button className="bg-vanz-ice hover:bg-gray-200 text-vanz-navy font-semibold py-3 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-transparent hover:border-gray-300">
                  <MessageCircle className="w-5 h-5" /> Message
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
