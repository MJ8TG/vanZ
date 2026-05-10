"use client";

import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import WizardProgress from "@/components/drivers/WizardProgress";
import Step1Phone from "@/components/drivers/Step1Phone";
import Step2Identity from "@/components/drivers/Step2Identity";
import Step3Vehicle from "@/components/drivers/Step3Vehicle";
import Step4Documents from "@/components/drivers/Step4Documents";
import Step5Confirmation from "@/components/drivers/Step5Confirmation";
import { datasql } from "@/lib/datasql";
import { Loader2 } from "lucide-react";

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
  // File paths stored as strings after upload to Supabase Storage
  cinFrontUrl: string;
  cinBackUrl: string;
  docCarteGrise: string;
  docAssurance: string;
  docPermis: string;
  docVisite: string;
  docVehicle: string;
  appliedReferralCode: string;
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
  cinFrontUrl: "",
  cinBackUrl: "",
  docCarteGrise: "",
  docAssurance: "",
  docPermis: "",
  docVisite: "",
  docVehicle: "",
  appliedReferralCode: "",
};

function DriverSignupForm() {
  const t = useTranslations("driverSignup");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DriverFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [driverStatus, setDriverStatus] = useState<"pending" | "approved">("pending");

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

  const nextStep = async () => {
    if (currentStep === 3) {
      // Logic to submit to backend BEFORE showing confirmation
      await handleFinalSubmit();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      const { data: { user } } = await datasql.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté (Étape 1).");

      const { authFetch } = await import('@/lib/auth-fetch');
      const response = await authFetch('/api/drivers/signup', {
        method: 'POST',
        body: JSON.stringify({ ...formData, userId: user.id })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Une erreur est survenue.");

      setDriverStatus(result.status || "pending");
      setCurrentStep(4); // Move to success step
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        return <Step5Confirmation data={formData} onBack={prevStep} t={t} status={driverStatus} />;
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
          
          {submitError && (
             <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-in shake">
               ⚠️ {submitError}
             </div>
          )}

          <div className={`mt-8 transition-all duration-300 ${isSubmitting ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            {isSubmitting ? (
               <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-vanz-teal animate-spin mb-4" />
                  <p className="text-vanz-navy font-black text-lg">Envoi de votre dossier...</p>
                  <p className="text-gray-400 font-medium">Ne fermez pas cette page</p>
               </div>
            ) : (
               renderStep()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-vanz-ice pt-20">
        <Loader2 className="w-12 h-12 text-vanz-teal animate-spin" />
      </div>
    }>
      <DriverSignupForm />
    </Suspense>
  );
}
