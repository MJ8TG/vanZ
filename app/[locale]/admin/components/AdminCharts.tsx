'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminCharts({ data }: { data: { date: string; jobs: number; revenue: number }[] }) {
  // Format date simply for XAxis
  const formattedData = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }));

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
          <YAxis yAxisId="left" orientation="left" stroke="#2BBFDF" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#10B981" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <Tooltip 
             cursor={{ fill: '#F3F4F6' }}
             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          
          <Bar yAxisId="left" name="Missions" dataKey="jobs" fill="#2BBFDF" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar yAxisId="right" name="Revenus (TND)" dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
