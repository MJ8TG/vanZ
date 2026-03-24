"use client";

import { DriverFormData } from "@/app/[locale]/devenir-chauffeur/page";
import { UploadCloud, ArrowRight, ArrowLeft } from "lucide-react";

interface Props {
  data: DriverFormData;
  updateData: (data: Partial<DriverFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export default function Step2Identity({ data, updateData, onNext, onBack, t }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("firstName")}</label>
          <input
            type="text"
            required
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("lastName")}</label>
          <input
            type="text"
            required
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("email")}</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("city")}</label>
          <select
            required
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          >
            <option value="" disabled>-- {t("city")} --</option>
            {/* Note: In a real app we'd fetch cities or use translations for options. For now hardcode or use simple ones. */}
            {["Tunis", "Sousse", "Sfax", "Bizerte", "Ariana", "Ben Arous", "Nabeul", "Monastir"].map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("cin")}</label>
          <input
            type="text"
            required
            maxLength={8}
            pattern="\d{8}"
            value={data.cin}
            onChange={(e) => updateData({ cin: e.target.value.replace(/\D/g, "") })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("dob")}</label>
          <input
            type="date"
            required
            value={data.dob}
            onChange={(e) => updateData({ dob: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("cinExpiry")}</label>
          <input
            type="date"
            required
            value={data.cinExpiry}
            onChange={(e) => updateData({ cinExpiry: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("cinFront")}</label>
          <div
            className={`cursor-pointer w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${data.cinFrontUploaded ? 'border-vanz-teal bg-vanz-teal/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
            onClick={() => updateData({ cinFrontUploaded: true })}
          >
            <UploadCloud className={`w-8 h-8 mb-2 ${data.cinFrontUploaded ? 'text-vanz-teal' : 'text-gray-400'}`} />
            <span className={`text-sm ${data.cinFrontUploaded ? 'text-vanz-teal font-medium' : 'text-gray-500'}`}>
              {data.cinFrontUploaded ? "Image uploadée" : t("uploadPlaceholder")}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("cinBack")}</label>
          <div
            className={`cursor-pointer w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${data.cinBackUploaded ? 'border-vanz-teal bg-vanz-teal/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
            onClick={() => updateData({ cinBackUploaded: true })}
          >
            <UploadCloud className={`w-8 h-8 mb-2 ${data.cinBackUploaded ? 'text-vanz-teal' : 'text-gray-400'}`} />
            <span className={`text-sm ${data.cinBackUploaded ? 'text-vanz-teal font-medium' : 'text-gray-500'}`}>
              {data.cinBackUploaded ? "Image uploadée" : t("uploadPlaceholder")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3.5 bg-gray-100 text-vanz-navy font-bold rounded-xl hover:bg-gray-200 transition-all flex justify-center items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          {t("back")}
        </button>
        <button
          type="submit"
          disabled={!data.firstName || !data.lastName || !data.city || !data.cin || !data.dob || !data.cinExpiry || !data.cinFrontUploaded || !data.cinBackUploaded}
          className="flex-1 py-3.5 bg-vanz-yellow text-vanz-navy font-bold rounded-xl hover:brightness-105 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {t("next")}
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </button>
      </div>
    </form>
  );
}
