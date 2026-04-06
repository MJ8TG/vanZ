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
  t: (key: string) => string;
}

export default function Step2Identity({ data, updateData, onNext, onBack, t }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  const cinFrontRef = useRef<HTMLInputElement>(null);
  const cinBackRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: 'cinFrontUrl' | 'cinBackUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Add file size/type validation here if needed
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 5Mo)");
      return;
    }

    setUploading(key);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth session missing");

      // Generate a unique file path: userId/timestamp_filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const publicUrl = await uploadFile('driver-documents', filePath, file);
      updateData({ [key]: publicUrl });
    } catch (err: unknown) {
      console.error(err);
      setError("Échec de l'upload de l'image. " + ((err as Error).message || ""));
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée. Veuillez recommencer.");

      // 1. Update Users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          city: data.city,
          role: 'driver'
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // 2. Initial Upsert in Drivers table
      const { error: driverError } = await supabase
        .from('drivers')
        .upsert({
          id: user.id,
          cin_number: data.cin,
          cin_expiry: data.cinExpiry,
          date_of_birth: data.dob,
          cin_front_url: data.cinFrontUrl,
          cin_back_url: data.cinBackUrl,
          status: 'pending'
        });

      if (driverError) throw driverError;

      onNext();
    } catch (err: unknown) {
      console.error(err);
      setError("Erreur lors de l'enregistrement. Veuillez vérifier vos informations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="first-name" className="block text-sm font-semibold text-vanz-navy mb-2">{t("firstName")}</label>
          <input
            id="first-name"
            type="text"
            required
            disabled={loading}
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="last-name" className="block text-sm font-semibold text-vanz-navy mb-2">{t("lastName")}</label>
          <input
            id="last-name"
            type="text"
            required
            disabled={loading}
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="email-address" className="block text-sm font-semibold text-vanz-navy mb-2">{t("email")}</label>
          <input
            id="email-address"
            type="email"
            disabled={loading}
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="city-select" className="block text-sm font-semibold text-vanz-navy mb-2">{t("city")}</label>
          <select
            id="city-select"
            required
            disabled={loading}
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
            title={t("city")}
          >
            <option value="" disabled>-- {t("city")} --</option>
            {["Tunis", "Sousse", "Sfax", "Bizerte", "Ariana", "Ben Arous", "Nabeul", "Monastir"].map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cin-number" className="block text-sm font-semibold text-vanz-navy mb-2">{t("cin")}</label>
          <input
            id="cin-number"
            type="text"
            required
            maxLength={8}
            pattern="\d{8}"
            disabled={loading}
            value={data.cin}
            onChange={(e) => updateData({ cin: e.target.value.replace(/\D/g, "") })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="dob-field" className="block text-sm font-semibold text-vanz-navy mb-2">{t("dob")}</label>
          <input
            id="dob-field"
            type="date"
            required
            disabled={loading}
            value={data.dob}
            onChange={(e) => updateData({ dob: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="cin-expiry" className="block text-sm font-semibold text-vanz-navy mb-2">{t("cinExpiry")}</label>
          <input
            id="cin-expiry"
            type="date"
            required
            disabled={loading}
            value={data.cinExpiry}
            onChange={(e) => updateData({ cinExpiry: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Hidden inputs for file selection */}
        <input 
          type="file" 
          ref={cinFrontRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleFileChange(e, 'cinFrontUrl')} 
          title="Sélectionner le recto de la CIN"
        />
        <input 
          type="file" 
          ref={cinBackRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleFileChange(e, 'cinBackUrl')} 
          title="Sélectionner le verso de la CIN"
        />

        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("cinFront")}</label>
          <button
            type="button"
            disabled={loading || uploading === "cinFrontUrl"}
            className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${data.cinFrontUrl ? 'border-vanz-teal bg-vanz-teal/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-vanz-teal/50'}`}
            onClick={() => cinFrontRef.current?.click()}
          >
            {uploading === "cinFrontUrl" ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-vanz-teal" />
                <span className="text-xs text-vanz-teal font-medium">Upload en cours...</span>
              </div>
            ) : (
              <>
                {data.cinFrontUrl ? (
                  <CheckCircle2 className="w-8 h-8 mb-2 text-vanz-teal animate-in zoom-in duration-300" />
                ) : (
                  <UploadCloud className="w-8 h-8 mb-2 text-gray-400 group-hover:text-vanz-teal transition-colors" />
                )}
                <span className={`text-sm ${data.cinFrontUrl ? 'text-vanz-teal font-bold' : 'text-gray-500'}`}>
                  {data.cinFrontUrl ? "Recto Image Envoyée" : t("uploadPlaceholder")}
                </span>
                {data.cinFrontUrl && <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">Fichier chargé</span>}
              </>
            )}
          </button>
        </div>
        <div>
          <label className="block text-sm font-semibold text-vanz-navy mb-2">{t("cinBack")}</label>
          <button
            type="button"
            disabled={loading || uploading === "cinBackUrl"}
            className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${data.cinBackUrl ? 'border-vanz-teal bg-vanz-teal/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-vanz-teal/50'}`}
            onClick={() => cinBackRef.current?.click()}
          >
            {uploading === "cinBackUrl" ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-vanz-teal" />
                <span className="text-xs text-vanz-teal font-medium">Upload en cours...</span>
              </div>
            ) : (
              <>
                {data.cinBackUrl ? (
                  <CheckCircle2 className="w-8 h-8 mb-2 text-vanz-teal animate-in zoom-in duration-300" />
                ) : (
                  <UploadCloud className="w-8 h-8 mb-2 text-gray-400 group-hover:text-vanz-teal transition-colors" />
                )}
                <span className={`text-sm ${data.cinBackUrl ? 'text-vanz-teal font-bold' : 'text-gray-500'}`}>
                  {data.cinBackUrl ? "Verso Image Envoyée" : t("uploadPlaceholder")}
                </span>
                {data.cinBackUrl && <span className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">Fichier chargé</span>}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t">
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
          disabled={loading || !!uploading || !data.firstName || !data.lastName || !data.city || !data.cin || !data.dob || !data.cinExpiry || !data.cinFrontUrl || !data.cinBackUrl}
          className="flex-1 py-3.5 bg-vanz-yellow text-vanz-navy font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-vanz-yellow/10"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              {t("next")}
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
