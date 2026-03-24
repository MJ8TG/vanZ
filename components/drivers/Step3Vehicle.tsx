"use client";

import { DriverFormData } from "@/app/[locale]/devenir-chauffeur/page";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface Props {
  data: DriverFormData;
  updateData: (data: Partial<DriverFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export default function Step3Vehicle({ data, updateData, onNext, onBack, t }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const vehicleTypes = [
    { id: "van", label: t("typeVan") },
    { id: "lightTruck", label: t("typeLightTruck") },
    { id: "utility", label: t("typeUtility") },
    { id: "sedan", label: t("typeSedan") },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right-4 fade-in duration-300">
      
      {/* Vehicle Type Radio */}
      <div>
        <label className="block text-sm font-semibold text-vanz-navy mb-3">{t("vehicleType")}</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {vehicleTypes.map((type) => (
            <label
              key={type.id}
              htmlFor={`vehicle-${type.id}`}
              className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${
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
            value={data.brand}
            onChange={(e) => updateData({ brand: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
        <div>
          <label htmlFor="vehicle-model" className="block text-sm font-semibold text-vanz-navy mb-2">{t("model")}</label>
          <input
            id="vehicle-model"
            type="text"
            required
            value={data.model}
            onChange={(e) => updateData({ model: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
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
            value={data.year}
            onChange={(e) => updateData({ year: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
        <div>
          <label htmlFor="vehicle-color" className="block text-sm font-semibold text-vanz-navy mb-2">{t("color")}</label>
          <input
            id="vehicle-color"
            type="text"
            value={data.color}
            onChange={(e) => updateData({ color: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
        </div>
        <div>
          <label htmlFor="vehicle-plate" className="block text-sm font-semibold text-vanz-navy mb-2">{t("plate")}</label>
          <input
            id="vehicle-plate"
            type="text"
            required
            pattern="[0-9]{1,3}\s?(TN|تونس)\s?[0-9]{1,4}"
            placeholder={t("platePlaceholder")}
            value={data.plate}
            onChange={(e) => updateData({ plate: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none uppercase font-semibold tracking-wider"
          />
        </div>
        <div>
          <label htmlFor="vehicle-capacity" className="block text-sm font-semibold text-vanz-navy mb-2">{t("capacity")}</label>
          <input
            id="vehicle-capacity"
            type="number"
            required
            min="100"
            max="10000"
            value={data.capacity}
            onChange={(e) => updateData({ capacity: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vanz-teal outline-none"
          />
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
          className="flex-1 py-3.5 bg-vanz-yellow text-vanz-navy font-bold rounded-xl hover:brightness-105 transition-all flex justify-center items-center gap-2"
        >
          {t("next")}
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </button>
      </div>
    </form>
  );
}
