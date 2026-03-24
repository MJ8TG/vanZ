"use client";

import { useState } from "react";
import { mockDrivers, DriverApplication } from "@/lib/mock-data/drivers";
import DriverTable from "@/components/admin/DriverTable";
import DriverDetailsPanel from "@/components/admin/DriverDetailsPanel";
import { Users, CheckCircle, XCircle } from "lucide-react";

export default function AdminChauffeursPage() {
  const [drivers, setDrivers] = useState<DriverApplication[]>(mockDrivers);
  const [selectedDriver, setSelectedDriver] = useState<DriverApplication | null>(null);

  const pendingCount = drivers.filter(d => d.status === "pending").length;
  // Let's assume the "today" logic is just a simple filter for this mock
  const approvedCount = drivers.filter(d => d.status === "approved").length;
  const rejectedCount = drivers.filter(d => d.status === "rejected").length;

  const handleApprove = (id: string) => {
    const updatedDrivers = drivers.map(d => d.id === id ? { ...d, status: "approved" as const } : d);
    setDrivers(updatedDrivers);
    // If the modal was open, update the selected driver object to reflect new status
    if (selectedDriver?.id === id) {
      setSelectedDriver(updatedDrivers.find(d => d.id === id) || null);
    }
  };

  const handleReject = (id: string) => {
    const updatedDrivers = drivers.map(d => d.id === id ? { ...d, status: "rejected" as const } : d);
    setDrivers(updatedDrivers);
    if (selectedDriver?.id === id) {
      setSelectedDriver(updatedDrivers.find(d => d.id === id) || null);
    }
  };

  return (
    <div className="min-h-screen bg-vanz-ice pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-vanz-navy mb-8">Gestion des Chauffeurs</h1>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">En attente</p>
              <p className="text-3xl font-bold text-vanz-navy">{pendingCount}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Approuvés</p>
              <p className="text-3xl font-bold text-gray-800">{approvedCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Rejetés</p>
              <p className="text-3xl font-bold text-gray-800">{rejectedCount}</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-vanz-navy">Dossiers Récents</h2>
        </div>
        
        <DriverTable drivers={drivers} onSelect={setSelectedDriver} />

        {/* Details Panel */}
        <DriverDetailsPanel
          driver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </div>
  );
}
