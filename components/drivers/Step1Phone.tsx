"use client";

import { useState } from "react";
import { DriverFormData } from "@/app/[locale]/devenir-chauffeur/page";
import { ArrowRight, Phone } from "lucide-react";

interface Props {
  data: DriverFormData;
  updateData: (data: Partial<DriverFormData>) => void;
  onNext: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export default function Step1Phone({ data, updateData, onNext, t }: Props) {
  const [showOtp, setShowOtp] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.phone.length >= 8) {
      setShowOtp(true);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.otp.length === 6) {
      onNext();
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
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
                required
                pattern="^[234579][0-9]{7}$"
                value={data.phone}
                onChange={(e) => updateData({ phone: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal focus:border-vanz-teal transition-all outline-none font-medium text-lg"
                placeholder={t("phonePlaceholder")}
              />
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={data.phone.length < 8}
            className="w-full bg-vanz-yellow text-vanz-navy font-bold py-3.5 rounded-xl hover:brightness-105 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {t("next")}
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-vanz-navy mb-2">{t("otp")}</h3>
            <p className="text-gray-500 text-sm">
              {t("otpDesc")} <span className="font-bold text-vanz-navy">+216 {data.phone}</span>
            </p>
          </div>

          <div>
            <input
              type="text"
              required
              maxLength={6}
              value={data.otp}
              onChange={(e) => updateData({ otp: e.target.value.replace(/\D/g, "") })}
              className="w-full text-center tracking-[1em] py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal focus:border-vanz-teal transition-all outline-none font-bold text-2xl"
              placeholder="------"
            />
          </div>

          <button
            type="submit"
            disabled={data.otp.length < 6}
            className="w-full bg-vanz-teal text-white font-bold py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg shadow-vanz-teal/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            {t("submit")}
          </button>
        </form>
      )}
    </div>
  );
}
