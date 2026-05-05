import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EvolucaoChartProps {
  data: Array<{ mes: number; retornoAcumulado: number }>;
}

export default function EvolucaoChart({ data }: EvolucaoChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    name: `Mês ${item.mes}`,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#4A5D23] p-3 rounded-xl border border-white/20 shadow-xl">
          <p className="text-white text-xs font-bold mb-1 uppercase tracking-wider">{label}</p>
          <p className="text-[#F0EAD6] text-sm font-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRetorno" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8A9A5B" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8A9A5B" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8A9A5B20" />
          <XAxis 
            dataKey="mes" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7E45', fontSize: 10 }}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7E45', fontSize: 10 }}
            tickFormatter={(value) => `R$ ${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="retornoAcumulado"
            stroke="#8A9A5B"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRetorno)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
