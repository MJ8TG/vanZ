"use client";

import { DriverFormData } from "@/app/[locale]/devenir-chauffeur/page";
import { CheckCircle, MessageCircle } from "lucide-react";

interface Props {
  data: DriverFormData;
  onBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export default function Step5Confirmation({ data, onBack, t }: Props) {
  // In a real scenario, this step should perhaps trigger the API call on load,
  // or the previous step's onSubmit would trigger the API call before moving here.
  // For now, it's a visual confirmation.

  return (
    <div className="max-w-md mx-auto text-center animate-in zoom-in-95 fade-in duration-500 py-8">
      
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50">
          <CheckCircle className="w-10 h-10" />
        </div>
      </div>
      
      <h2 className="text-2xl font-black text-vanz-navy mb-3">
        {t("confirmTitle")}
      </h2>
      
      <p className="text-gray-600 mb-8 px-4 text-base leading-relaxed">
        {t("confirmDesc")}
      </p>

      <div className="bg-vanz-ice rounded-2xl p-6 mb-8 text-left border border-vanz-teal/20">
        <div className="flex items-center justify-between font-bold text-sm mb-4">
          <span className="text-vanz-navy uppercase tracking-wider">Status:</span>
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs">
            {t("pendingBadge")}
          </span>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">{t("phone")}:</span>
            <span className="font-semibold text-vanz-navy">+216 {data.phone}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">{t("firstName")} {t("lastName")}:</span>
            <span className="font-semibold text-vanz-navy">{data.firstName} {data.lastName}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">{t("vehicleType")}:</span>
            <span className="font-semibold text-vanz-navy">{data.vehicleType}</span>
          </div>
        </div>
      </div>

      <a
        href={`https://wa.me/21655123456?text=Bonjour, je viens de soumettre mon dossier chauffeur sur VanZ. Mon numéro est le ${data.phone}.`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl hover:brightness-105 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-500/20"
      >
        <MessageCircle className="w-5 h-5" />
        {t("whatsappSupport")}
      </a>
      
    </div>
  );
}
