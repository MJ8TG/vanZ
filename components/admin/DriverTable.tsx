"use client";

import { DriverApplication } from "@/lib/mock-data/drivers";
import { Eye } from "lucide-react";

interface Props {
  drivers: DriverApplication[];
  onSelect: (driver: DriverApplication) => void;
}

export default function DriverTable({ drivers, onSelect }: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">En attente</span>;
      case "approved":
        return <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">Approuvé</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">Rejeté</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-500">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Nom</th>
              <th className="px-6 py-4">Téléphone</th>
              <th className="px-6 py-4">Véhicule</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {drivers.map((drv) => (
              <tr key={drv.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(drv.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-vanz-navy">{drv.firstName} {drv.lastName}</div>
                  <div className="text-xs text-gray-400">{drv.city}</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{drv.phone}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-vanz-navy">{drv.brand} {drv.model}</div>
                  <div className="text-xs font-mono text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-1">{drv.plate}</div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(drv.status)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onSelect(drv)}
                    className="p-2 text-gray-400 hover:text-vanz-teal hover:bg-vanz-teal/10 rounded-lg transition-colors"
                    title="Voir les détails"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Aucun chauffeur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
