import { Check } from "lucide-react";

interface WizardProgressProps {
  steps: string[];
  currentStep: number;
}

export default function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <div className="w-full mb-8">
      {/* Progress Bar (Desktop) */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 rounded" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-vanz-teal -translate-y-1/2 z-0 transition-all duration-300 rounded"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((label, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={label} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                  isActive
                    ? "bg-vanz-teal text-white ring-4 ring-vanz-teal/20"
                    : isCompleted
                    ? "bg-vanz-teal text-white"
                    : "bg-white text-gray-400 border-2 border-gray-200"
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={`absolute top-12 text-xs font-semibold whitespace-nowrap hidden md:block ${
                  isActive || isCompleted ? "text-vanz-navy" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar (Mobile) */}
      <div className="sm:hidden flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-sm font-bold text-vanz-navy">
            Étape {currentStep + 1} / {steps.length}
          </span>
          <span className="text-sm font-semibold text-vanz-teal">{steps[currentStep]}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-vanz-teal transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
