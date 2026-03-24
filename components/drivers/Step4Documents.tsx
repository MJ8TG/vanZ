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

export default function Step4Documents({ data, updateData, onNext, onBack, t }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const docs = [
    { key: "docCarteGrise", label: t("docCarteGrise"), required: true },
    { key: "docAssurance", label: t("docAssurance"), required: true },
    { key: "docPermis", label: t("docPermis"), required: true },
    { key: "docVisite", label: t("docVisite"), required: false },
    { key: "docVehicle", label: t("docVehicle"), required: false },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map(({ key, label, required }) => {
          const isUploaded = (data as any)[key];
          
          return (
            <div key={key}>
              <label className="block text-sm font-semibold text-vanz-navy mb-2">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <div
                className={`cursor-pointer w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
                  isUploaded ? 'border-vanz-teal bg-vanz-teal/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => updateData({ [key]: true })}
              >
                <UploadCloud className={`w-8 h-8 mb-2 ${isUploaded ? 'text-vanz-teal' : 'text-gray-400'}`} />
                <span className={`text-sm ${isUploaded ? 'text-vanz-teal font-medium' : 'text-gray-500'}`}>
                  {isUploaded ? "Image uploadée" : t("uploadPlaceholder")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 pt-6 border-t mt-8">
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
          disabled={!data.docCarteGrise || !data.docAssurance || !data.docPermis}
          className="flex-1 py-3.5 bg-vanz-yellow text-vanz-navy font-bold rounded-xl hover:brightness-105 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {t("submit")}
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </button>
      </div>
    </form>
  );
}
