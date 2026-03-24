"use client";

import { DriverApplication } from "@/lib/mock-data/drivers";
import { X, CheckCircle, XCircle, FileText, Check } from "lucide-react";

interface Props {
  driver: DriverApplication | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function DriverDetailsPanel({ driver, onClose, onApprove, onReject }: Props) {
  if (!driver) return null;

  const DocStatus = ({ label, uploaded }: { label: string; uploaded: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      {uploaded ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-md">Manquant</span>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-vanz-navy/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-vanz-navy">Détails Chauffeur</h2>
            <p className="text-xs text-gray-500">ID: {driver.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Identity */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Identité</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-gray-500 mb-1">Nom Complet</span>
                <span className="font-semibold text-vanz-navy">{driver.firstName} {driver.lastName}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Téléphone</span>
                <span className="font-semibold text-vanz-navy">+216 {driver.phone}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">CIN</span>
                <span className="font-semibold text-vanz-navy">{driver.cin}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">Ville</span>
                <span className="font-semibold text-vanz-navy">{driver.city}</span>
              </div>
            </div>
          </section>

          {/* Vehicle */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Véhicule</h3>
            <div className="bg-vanz-ice rounded-xl p-4 border border-vanz-teal/20">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-vanz-navy">{driver.brand} {driver.model} ({driver.year})</span>
                <span className="text-xs font-semibold px-2 py-1 bg-white text-vanz-teal border border-vanz-teal/30 rounded-full uppercase">
                  {driver.vehicleType}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div><span className="text-gray-500">Matricule:</span> <span className="font-mono font-medium">{driver.plate}</span></div>
                <div><span className="text-gray-500">Capacité:</span> <span className="font-medium">{driver.capacity} kg</span></div>
                <div><span className="text-gray-500">Couleur:</span> <span className="font-medium">{driver.color || 'N/A'}</span></div>
              </div>
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Documents</h3>
            <div className="space-y-2">
              <DocStatus label="CIN (Recto)" uploaded={driver.cinFrontUploaded} />
              <DocStatus label="CIN (Verso)" uploaded={driver.cinBackUploaded} />
              <DocStatus label="Permis de conduire" uploaded={driver.docPermis} />
              <DocStatus label="Carte Grise" uploaded={driver.docCarteGrise} />
              <DocStatus label="Assurance" uploaded={driver.docAssurance} />
              <DocStatus label="Visite Technique" uploaded={driver.docVisite} />
              <DocStatus label="Photo du véhicule" uploaded={driver.docVehicle} />
            </div>
          </section>

        </div>

        {/* Actions Footer */}
        {driver.status === "pending" && (
          <div className="p-6 border-t bg-gray-50 grid grid-cols-2 gap-4">
            <button
              onClick={() => { onReject(driver.id); onClose(); }}
              className="flex items-center justify-center gap-2 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Rejeter
            </button>
            <button
              onClick={() => { onApprove(driver.id); onClose(); }}
              className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
            >
              <CheckCircle className="w-5 h-5" />
              Approuver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
