"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import WizardProgress from "@/components/drivers/WizardProgress";
import Step1Phone from "@/components/drivers/Step1Phone";
import Step2Identity from "@/components/drivers/Step2Identity";
import Step3Vehicle from "@/components/drivers/Step3Vehicle";
import Step4Documents from "@/components/drivers/Step4Documents";
import Step5Confirmation from "@/components/drivers/Step5Confirmation";

export interface DriverFormData {
  phone: string;
  otp: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  cin: string;
  dob: string;
  cinExpiry: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plate: string;
  capacity: string;
  // Files simulated as boolean or strings for now to indicate uploaded status
  cinFrontUploaded: boolean;
  cinBackUploaded: boolean;
  docCarteGrise: boolean;
  docAssurance: boolean;
  docPermis: boolean;
  docVisite: boolean;
  docVehicle: boolean;
}

const initialData: DriverFormData = {
  phone: "",
  otp: "",
  firstName: "",
  lastName: "",
  email: "",
  city: "",
  cin: "",
  dob: "",
  cinExpiry: "",
  vehicleType: "",
  brand: "",
  model: "",
  year: "",
  color: "",
  plate: "",
  capacity: "",
  cinFrontUploaded: false,
  cinBackUploaded: false,
  docCarteGrise: false,
  docAssurance: false,
  docPermis: false,
  docVisite: false,
  docVehicle: false,
};

export default function DriverSignupPage() {
  const t = useTranslations("driverSignup");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DriverFormData>(initialData);

  const steps = [
    t("step1"),
    t("step2"),
    t("step3"),
    t("step4"),
    t("step5"),
  ];

  const updateData = (fields: Partial<DriverFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Phone data={formData} updateData={updateData} onNext={nextStep} t={t} />;
      case 1:
        return <Step2Identity data={formData} updateData={updateData} onNext={nextStep} onBack={prevStep} t={t} />;
      case 2:
        return <Step3Vehicle data={formData} updateData={updateData} onNext={nextStep} onBack={prevStep} t={t} />;
      case 3:
        return <Step4Documents data={formData} updateData={updateData} onNext={nextStep} onBack={prevStep} t={t} />;
      case 4:
        return <Step5Confirmation data={formData} onBack={prevStep} t={t} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-vanz-ice pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-vanz-navy mb-3">{t("title")}</h1>
          <p className="text-vanz-navy/70 text-lg">{t("subtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <WizardProgress steps={steps} currentStep={currentStep} />
          <div className="mt-8 transition-all duration-300">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
