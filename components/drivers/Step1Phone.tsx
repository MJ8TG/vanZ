"use client";

import { useState } from "react";
import { DriverFormData } from "@/app/[locale]/devenir-chauffeur/page";
import { ArrowRight, Phone, Loader2, Gift } from "lucide-react";
import { datasql as supabase } from "@/lib/datasql";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface Props {
  data: DriverFormData;
  updateData: (data: Partial<DriverFormData>) => void;
  onNext: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export default function Step1Phone({ data, updateData, onNext, t }: Props) {
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const searchParams = useSearchParams();
  const refCode = searchParams?.get("ref");

  useEffect(() => {
    if (refCode && !data.appliedReferralCode) {
      updateData({ appliedReferralCode: refCode.toUpperCase() });
    }
  }, [refCode, data.appliedReferralCode, updateData]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.phone.length < 8) {
      setError("Le numéro de téléphone doit comporter 8 chiffres.");
      return;
    }
    
    if (data.phone.length >= 8) {
      setLoading(true);
      setError("");

      // TEST BYPASS (Prefix 000 or magic numbers)
      const isTestNumber = data.phone.startsWith("000") || ["22222222", "33333333", "55555555"].includes(data.phone);
      
      if (isTestNumber) {
        setTimeout(() => {
          setShowOtp(true);
          setLoading(false);
        }, 500);
        return;
      }

      try {
        const fullPhone = `+216${data.phone}`;
        console.log("Sending OTP to:", fullPhone);
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });
        if (error) throw error;
        setShowOtp(true);
      } catch (err: any) {
        setError(err.message || "Erreur lors de l'envoi du code.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.otp.length === 6) {
      setLoading(true);
      setError("");

      // TEST BYPASS (Universal Code for test numbers)
      const isTestNumber = data.phone.startsWith("000") || ["22222222", "33333333", "55555555"].includes(data.phone);
      
      if (isTestNumber && data.otp === "123456") {
        setTimeout(() => {
          onNext();
          setLoading(false);
        }, 500);
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          phone: `+216${data.phone}`,
          token: data.otp,
          type: 'sms'
        });
        if (error) throw error;
        onNext();
      } catch (err: any) {
        setError("Code invalide ou expiré.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg animate-in fade-in zoom-in duration-200">
          {error}
        </div>
      )}

      {!showOtp ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-vanz-navy mb-2">
              {t("phone")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">+216</span>
              </div>
              <input
                type="tel"
                id="driver-phone"
                name="tel"
                autoComplete="tel-national"
                value={data.phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  // If user pasted with 216 prefix, strip it
                  if (val.startsWith('216') && val.length > 8) {
                    val = val.substring(3);
                  } else if (val.startsWith('00216') && val.length > 8) {
                    val = val.substring(5);
                  }
                  updateData({ phone: val.slice(0, 8) });
                }}
                className="w-full pl-16 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-vanz-teal outline-none font-bold text-vanz-navy text-lg tracking-[0.2em]"
                placeholder="22 333 444"
                required
              />
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2" htmlFor="driver-referral">
              <Gift className="w-3.5 h-3.5 text-vanz-yellow" />
              Code de parrainage (Optionnel)
            </label>
            <input
              type="text"
              id="driver-referral"
              value={data.appliedReferralCode}
              onChange={(e) => updateData({ appliedReferralCode: e.target.value.toUpperCase() })}
              className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-100 focus:border-vanz-teal outline-none font-bold text-vanz-navy placeholder:text-gray-300 bg-gray-50/50 focus:bg-white tracking-widest"
              placeholder="ABC12"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-vanz-yellow text-vanz-navy font-bold py-3.5 rounded-xl hover:brightness-105 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg shadow-vanz-yellow/10 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {t("next")}
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-vanz-navy mb-2">{t("otp")}</h3>
            <p className="text-gray-500 text-sm">
              {t("otpDesc")} <span className="font-bold text-vanz-navy">+216 {data.phone}</span>
            </p>
            <button 
              type="button"
              onClick={() => setShowOtp(false)}
              className="text-vanz-teal text-xs font-bold mt-2 hover:underline"
            >
              Modifier le numéro
            </button>
          </div>

          <div>
            <input
              type="text"
              id="driver-otp"
              name="one-time-code"
              autoComplete="one-time-code"
              value={data.otp}
              onChange={(e) => updateData({ otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              className="w-full py-4 rounded-xl border-2 border-gray-100 focus:border-vanz-teal outline-none font-black text-vanz-navy text-2xl text-center tracking-[0.5em]"
              placeholder="000000"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={data.otp.length < 6 || loading}
            className="w-full bg-vanz-teal text-white font-bold py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg shadow-vanz-teal/20 disabled:opacity-50 disabled:pointer-events-none"
          >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("submit")}
          </button>
        </form>
      )}
    </div>
  );
}
