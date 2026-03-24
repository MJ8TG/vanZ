'use client';

import { useEffect, useState } from "react";
import { datasql as supabase } from '@/lib/datasql';
import { Briefcase, Activity, HandCoins, Truck, LineChart } from "lucide-react";
import AdminCharts from "./components/AdminCharts";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({ gmvt: 0, completed: 0, open: 0, online: 0, revenue: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyString = thirtyDaysAgo.toISOString();

    const [
      { count: completedJobs },
      { count: openJobs },
      { count: onlineDrivers },
      { data: revenueData },
      { data: gmvToday }
    ] = await Promise.all([
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_online', true).eq('role', 'driver'),
      supabase.from('jobs').select('commission_amount').eq('status', 'completed'),
      supabase.rpc('get_gmv_today')
    ]);

    const totalRevenue = revenueData?.reduce((sum, j) => sum + (Number(j.commission_amount) || 0), 0) || 0;
    
    setMetrics({
       gmvt: gmvToday || 0,
       completed: completedJobs || 0,
       open: openJobs || 0,
       online: onlineDrivers || 0,
       revenue: totalRevenue
    });

    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('updated_at, commission_amount')
      .eq('status', 'completed')
      .gte('updated_at', thirtyString);

    const dailyStats: Record<string, { date: string; jobs: number; revenue: number }> = {};
    for (let i = 29; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().split('T')[0];
       dailyStats[dateStr] = { date: dateStr, jobs: 0, revenue: 0 };
    }

    if (recentJobs) {
      recentJobs.forEach(job => {
        const dateStr = (job.updated_at || '').split('T')[0];
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].jobs += 1;
          dailyStats[dateStr].revenue += Number(job.commission_amount) || 0;
        }
      });
    }

    setChartData(Object.values(dailyStats));
  };

  const cards = [
    { title: "GMV du Jour", value: `${metrics.gmvt} TND`, icon: LineChart, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Missions Clôturées", value: metrics.completed, icon: Briefcase, color: "text-green-500", bg: "bg-green-50" },
    { title: "Missions Ouvertes", value: metrics.open, icon: Activity, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Chauffeurs en ligne", value: metrics.online, icon: Truck, color: "text-vanz-teal", bg: "bg-vanz-teal/10" },
    { title: "Revenu Total (Général)", value: `${metrics.revenue} TND`, icon: HandCoins, color: "text-purple-500", bg: "bg-purple-50" }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
             <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
               <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                 <Icon className={`w-6 h-6 ${c.color}`} />
               </div>
               <div>
                 <p className="text-gray-500 text-sm font-semibold mb-1">{c.title}</p>
                 <p className="text-2xl font-black text-[#051E3C]">{c.value}</p>
               </div>
             </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-[#051E3C] mb-6">Activité des 30 derniers jours</h3>
        {chartData.length > 0 ? (
          <AdminCharts data={chartData} />
        ) : (
          <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100"><p className="text-gray-400 font-bold">Chargement des graphiques...</p></div>
        )}
      </div>
    </div>
  );
}
