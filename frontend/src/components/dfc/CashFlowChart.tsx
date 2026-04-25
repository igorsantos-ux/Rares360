import React from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea
} from 'recharts';
import type { DfcDailyFlow } from '../../types/Dfc';

interface Props {
    data: DfcDailyFlow[];
}

export const CashFlowChart: React.FC<Props> = ({ data }) => {

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-50">
                    <p className="font-black text-slate-700 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between items-center gap-4 text-sm font-bold mb-1">
                            <span style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="text-slate-800">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Identificar dias críticos
    const renderCriticalZones = () => {
        return data.map((d, index) => {
            const balance = d.projectedBalance !== undefined ? d.projectedBalance : (d.realizedBalance || 0);
            if (balance < 0) {
                return (
                    <ReferenceArea
                        key={index}
                        x1={data[Math.max(0, index - 1)].date}
                        x2={d.date}
                        fill="#fee2e2"
                        fillOpacity={0.5}
                    />
                );
            }
            return null;
        });
    };

    return (
        <div className="h-full w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                            const d = new Date(val);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false} tickLine={false}
                    />
                    <YAxis
                        tickFormatter={(val) => `R$ ${val / 1000}k`}
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '13px' }} />

                    {renderCriticalZones()}

                    <Bar dataKey="inflows" name="Entradas" fill="#3B6D11" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="outflows" name="Saídas" fill="#A32D2D" radius={[4, 4, 0, 0]} maxBarSize={40} />

                    <Line
                        type="monotone"
                        dataKey="realizedBalance"
                        name="Saldo Realizado"
                        stroke="#1E293B"
                        strokeWidth={4}
                        dot={false}
                        activeDot={{ r: 6, fill: '#1E293B', stroke: 'white', strokeWidth: 2 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="projectedBalance"
                        name="Saldo Projetado (Futuro)"
                        stroke="#4338ca"
                        strokeWidth={4}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 6, fill: '#4338ca', stroke: 'white', strokeWidth: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
