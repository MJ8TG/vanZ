"use client";

import { useState, useRef } from "react";
import { DriverFormData } from "@/app/[locale]/devenir-chauffeur/page";
import { UploadCloud, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { datasql as supabase } from "@/lib/datasql";
import { uploadFile } from "@/lib/upload";

interface Props {
  data: DriverFormData;
  updateData: (data: Partial<DriverFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export default function Step4Documents({ data, updateData, onNext, onBack, t }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  const fileInputRefs = {
    docCarteGrise: useRef<HTMLInputElement>(null),
    docAssurance: useRef<HTMLInputElement>(null),
    docPermis: useRef<HTMLInputElement>(null),
    docVisite: useRef<HTMLInputElement>(null),
    docVehicle: useRef<HTMLInputElement>(null),
  };

  const docs = [
    { key: "docCarteGrise", label: t("docCarteGrise"), required: true },
    { key: "docAssurance", label: t("docAssurance"), required: true },
    { key: "docPermis", label: t("docPermis"), required: true },
    { key: "docVisite", label: t("docVisite"), required: false },
    { key: "docVehicle", label: t("docVehicle"), required: false },
  ] as const;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof fileInputRefs) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 10Mo)");
      return;
    }

    setUploading(key);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth session missing");

      const fileExt = file.name.split('.').pop();
      const fileName = `${key}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const publicUrl = await uploadFile('driver-documents', filePath, file);
      updateData({ [key]: publicUrl });
    } catch (err: any) {
      console.error(err);
      setError("Échec de l'upload. " + (err.message || ""));
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!data.docCarteGrise || !data.docAssurance || !data.docPermis) {
      setError("Veuillez télécharger tous les documents obligatoires.");
      return;
    }

    // Trigger final API call via parent handler
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map(({ key, label, required }) => {
          const isUploaded = !!(data as any)[key];
          const isUploading = uploading === key;
          
          return (
            <div key={key}>
              <label className="block text-sm font-semibold text-vanz-navy mb-2">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              
              <input
                type="file"
                ref={fileInputRefs[key]}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, key)}
                title={label}
              />

              <button
                type="button"
                disabled={loading || isUploading}
                className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isUploaded ? 'border-vanz-teal bg-vanz-teal/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-vanz-teal/50'
                }`}
                onClick={() => fileInputRefs[key].current?.click()}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-vanz-teal" />
                    <span className="text-xs text-vanz-teal font-medium">Chargement...</span>
                  </div>
                ) : (
                  <>
                    {isUploaded ? (
                      <CheckCircle2 className="w-8 h-8 mb-2 text-vanz-teal animate-in zoom-in duration-300" />
                    ) : (
                      <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                    )}
                    <span className={`text-sm ${isUploaded ? 'text-vanz-teal font-bold' : 'text-gray-500'}`}>
                      {isUploaded ? "Document reçu" : t("uploadPlaceholder")}
                    </span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 pt-6 border-t mt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3.5 bg-gray-100 text-vanz-navy font-bold rounded-xl hover:bg-gray-200 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          {t("back")}
        </button>
        <button
          type="submit"
          disabled={loading || !!uploading || !data.docCarteGrise || !data.docAssurance || !data.docPermis}
          className="flex-1 py-3.5 bg-vanz-yellow text-vanz-navy font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-vanz-yellow/10"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              {t("submit")}
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
