import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import type { DfcActivityBlock, DfcActivityCategory } from '../../types/Dfc';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface Props {
    activities: DfcActivityBlock[];
}

export const ActivitiesBlock: React.FC<Props> = ({ activities }) => {
    const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
        'OPERATIONAL': true
    });

    const toggleBlock = (type: string) => {
        setExpandedBlocks(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Math.abs(val));

    const renderActivityList = (categories: DfcActivityCategory[]) => {
        return (
            <div className="space-y-2 mt-4 px-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between py-2 border-b border-slate-200/60 last:border-0 hover:bg-white px-3 rounded-lg transition-colors cursor-pointer group">
                        <p className="text-sm font-bold text-slate-600 group-hover:text-amber-600 transition-colors">{cat.name}</p>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                                {cat.percentOfTotal.toFixed(1)}%
                            </span>
                            <span className="text-sm font-black text-slate-800">{formatCurrency(cat.value)}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {activities.map(block => (
                <div key={block.type} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">

                    <div
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => toggleBlock(block.type)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                                ${block.type === 'OPERATIONAL' ? 'bg-[#3B6D11]/10 text-[#3B6D11]' :
                                    block.type === 'INVESTMENT' ? 'bg-[#BA7517]/10 text-[#BA7517]' : 'bg-[#185FA5]/10 text-[#185FA5]'}`}>
                                {block.type === 'OPERATIONAL' ? <PieChartIcon size={20} /> : <PieChartIcon size={20} />}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg">
                                    {block.type === 'OPERATIONAL' ? 'Atividades Operacionais' :
                                        block.type === 'INVESTMENT' ? 'Atividades de Investimento' : 'Atividades de Financiamento'}
                                </h3>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                            {expandedBlocks[block.type] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                    </div>

                    <div className="my-6 grid grid-cols-3 gap-4">
                        <div className="bg-green-50 p-3 rounded-2xl">
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Entradas</p>
                            <p className="font-black text-green-700">{formatCurrency(block.totalInflows)}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-2xl">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Saídas</p>
                            <p className="font-black text-red-700">{formatCurrency(block.totalOutflows)}</p>
                        </div>
                        <div className={`p-3 rounded-2xl ${block.netFlow >= 0 ? 'bg-[#3B6D11] text-white' : 'bg-[#A32D2D] text-white'} shadow-lg shadow-black/5`}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Fluxo Líquido</p>
                            <p className="font-black">{formatCurrency(block.netFlow)}</p>
                        </div>
                    </div>

                    {expandedBlocks[block.type] && block.compositionData && (
                        <div className="h-40 w-full mt-4 mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={block.compositionData}
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {block.compositionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {expandedBlocks[block.type] && renderActivityList(block.categories)}
                </div>
            ))}
        </div>
    );
};
