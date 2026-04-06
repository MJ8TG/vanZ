"use client";

import { useState } from "react";
import { DriverFormData } from "@/app/[locale]/devenir-chauffeur/page";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { datasql as supabase } from "@/lib/datasql";

interface Props {
  data: DriverFormData;
  updateData: (data: Partial<DriverFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  t: (key: string) => string;
}

export default function Step3Vehicle({ data, updateData, onNext, onBack, t }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée. Veuillez recommencer.");

      const { error: driverError } = await supabase
        .from('drivers')
        .update({
          vehicle_type: data.vehicleType,
          vehicle_brand: data.brand,
          vehicle_model: data.model,
          vehicle_year: parseInt(data.year),
          vehicle_color: data.color,
          vehicle_plate: data.plate,
          vehicle_capacity: parseInt(data.capacity)
        })
        .eq('id', user.id);

      if (driverError) throw driverError;

      onNext();
    } catch (err: unknown) {
      console.error(err);
      setError("Erreur lors de l'enregistrement du véhicule.");
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { id: "van", label: t("typeVan") },
    { id: "lightTruck", label: t("typeLightTruck") },
    { id: "utility", label: t("typeUtility") },
    { id: "sedan", label: t("typeSedan") },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
          {error}
        </div>
      )}
      
      {/* Vehicle Type Radio */}
      <div>
        <label className="block text-sm font-semibold text-vanz-navy mb-3">{t("vehicleType")}</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {vehicleTypes.map((type) => (
            <label
              key={type.id}
              htmlFor={`vehicle-${type.id}`}
              className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${loading ? 'opacity-50 pointer-events-none' : ''} ${
                data.vehicleType === type.id
                  ? "border-vanz-teal bg-vanz-teal/10 text-vanz-navy font-bold"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              <input
                id={`vehicle-${type.id}`}
                type="radio"
                name="vehicleType"
                value={type.id}
                checked={data.vehicleType === type.id}
                onChange={(e) => updateData({ vehicleType: e.target.value })}
                className="hidden"
                required
                disabled={loading}
              />
              <span className="text-sm block">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="vehicle-brand" className="block text-sm font-semibold text-vanz-navy mb-2">{t("brand")}</label>
          <input
            id="vehicle-brand"
            type="text"
            required
            disabled={loading}
            value={data.brand}
            onChange={(e) => updateData({ brand: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="vehicle-model" className="block text-sm font-semibold text-vanz-navy mb-2">{t("model")}</label>
          <input
            id="vehicle-model"
            type="text"
            required
            disabled={loading}
            value={data.model}
            onChange={(e) => updateData({ model: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="vehicle-year" className="block text-sm font-semibold text-vanz-navy mb-2">{t("year")}</label>
          <input
            id="vehicle-year"
            type="number"
            min="1990"
            max={new Date().getFullYear() + 1}
            required
            disabled={loading}
            value={data.year}
            onChange={(e) => updateData({ year: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="vehicle-color" className="block text-sm font-semibold text-vanz-navy mb-2">{t("color")}</label>
          <input
            id="vehicle-color"
            type="text"
            disabled={loading}
            value={data.color}
            onChange={(e) => updateData({ color: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="vehicle-plate" className="block text-sm font-semibold text-vanz-navy mb-2">{t("plate")}</label>
          <input
            id="vehicle-plate"
            type="text"
            required
            disabled={loading}
            pattern="[0-9]{1,3}\s?(TN|تونس)\s?[0-9]{1,4}"
            placeholder={t("platePlaceholder")}
            value={data.plate}
            onChange={(e) => updateData({ plate: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none uppercase font-semibold tracking-wider disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="vehicle-capacity" className="block text-sm font-semibold text-vanz-navy mb-2">{t("capacity")}</label>
          <input
            id="vehicle-capacity"
            type="number"
            required
            disabled={loading}
            min="100"
            max="10000"
            value={data.capacity}
            onChange={(e) => updateData({ capacity: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none disabled:opacity-50"
          />
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
          disabled={loading || !data.vehicleType || !data.brand || !data.model || !data.year || !data.plate || !data.capacity}
          className="flex-1 py-3.5 bg-vanz-yellow text-vanz-navy font-bold rounded-xl hover:brightness-105 transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-vanz-yellow/10"
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
