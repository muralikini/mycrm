"use client";

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function StatusChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <p className="mt-4 text-gray-500 italic">No ticket data available to graph yet.</p>;
  }

  return (
    <div className="mt-6 h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            allowDecimals={false} 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar 
            dataKey="count" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]} 
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}