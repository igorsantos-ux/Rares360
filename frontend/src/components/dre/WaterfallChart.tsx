import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DreWaterfallData } from '../../types/Dre';

interface Props {
    data: DreWaterfallData[];
}

export const WaterfallChart: React.FC<Props> = ({ data }) => {
    // O Recharts empilha as barras. Precisamos transformar os dados para criar o "floating bar" waterfall
    // array[0] = invisible bottom, array[1] = visible top
    const formattedData = data.reduce((acc, curr, index) => {
        let prevTotal = 0;
        if (index > 0) {
            prevTotal = acc[index - 1].endValue;
        }

        let start = prevTotal;
        let end = prevTotal;

        if (curr.type === 'total') {
            start = 0;
            end = curr.value;
        } else if (curr.type === 'positive') {
            end = start + curr.value;
        } else if (curr.type === 'negative') {
            end = start - curr.value; // assumindo q o value já vem positivo no payload
        }

        acc.push({
            ...curr,
            startValue: start,
            endValue: end,
            [curr.type === 'total' ? 'total' : 'change']: curr.type === 'total' ? [0, curr.value] : [Math.min(start, end), Math.max(start, end)]
        });
        return acc;
    }, [] as any[]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-[#8A9A5B]/20 shadow-xl rounded-2xl z-50">
                    <p className="font-bold text-[#697D58] mb-1">{data.name}</p>
                    <p className="text-xl font-black text-slate-800">
                        {formatCurrency(data.value)}
                    </p>
                    {data.percentOfRevenue && (
                        <p className="text-xs text-slate-500 font-bold mt-1">
                            Repres. {data.percentOfRevenue}% da R.B.
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={formattedData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        interval={0}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={(val) => `R$ ${val / 1000}k`}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

                    {/* Para funcionar o Waterfall perfeito precisaríamos de bars flutuantes, 
              o Recharts atua melhor com fill range [start, end] */}
                    <Bar dataKey="change" isAnimationActive={true}>
                        {formattedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.type === 'total' ? '#3b82f6' : entry.type === 'positive' ? '#22c55e' : '#ef4444'}
                                radius={[4, 4, 4, 4]}
                            />
                        ))}
                    </Bar>
                    <Bar dataKey="total" isAnimationActive={true}>
                        {formattedData.map((entry, index) => (
                            <Cell
                                key={`cell-total-${index}`}
                                fill={'#3b82f6'}
                                radius={[4, 4, 4, 4]}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
