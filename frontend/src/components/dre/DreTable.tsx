import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DreRow } from '../../types/Dre';

interface Props {
    data: DreRow[];
    onRowClick: (row: DreRow) => void;
}

export const DreTable: React.FC<Props> = ({ data, onRowClick }) => {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);

    const getBenchmarkBadge = (status?: 'OK' | 'ALERTA' | 'CRITICO') => {
        if (!status) return <span className="text-slate-300">-</span>;
        const colors = {
            OK: 'bg-green-500',
            ALERTA: 'bg-yellow-500',
            CRITICO: 'bg-red-500'
        };
        return (
            <div className="flex items-center gap-2 justify-center">
                <div className={`w-3 h-3 rounded-full ${colors[status]} shadow-sm`} />
            </div>
        );
    };

    const renderRow = (row: DreRow, level: number = 0) => {
        const hasChildren = row.subRows && row.subRows.length > 0;
        const isExpanded = !!expandedRows[row.id];

        return (
            <React.Fragment key={row.id}>
                <tr
                    onClick={() => onRowClick(row)}
                    className={`cursor-pointer transition-colors border-b border-slate-100 
            ${row.isHighlighted ? 'bg-slate-50 hover:bg-slate-100/80 font-bold' : 'hover:bg-slate-50/50'}
          `}
                >
                    <td className="py-4 px-6">
                        <div className={`flex items-center gap-2`} style={{ paddingLeft: `${level * 1.5}rem` }}>
                            {hasChildren ? (
                                <button
                                    onClick={(e) => toggleRow(row.id, e)}
                                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors"
                                >
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                            ) : (
                                <div className="w-6" /> // spacer
                            )}
                            <span className={row.isHighlighted ? 'text-[#697D58]' : 'text-slate-700'}>
                                {row.title}
                            </span>
                        </div>
                    </td>

                    <td className="py-4 px-6 text-right font-medium text-slate-800">
                        {formatCurrency(row.value)}
                    </td>

                    <td className="py-4 px-6 text-right text-slate-500">
                        {row.compareValue !== undefined ? formatCurrency(row.compareValue) : '-'}
                    </td>

                    <td className="py-4 px-6 text-right">
                        {row.percentChange !== undefined ? (
                            <div className={`flex items-center justify-end gap-1 ${row.percentChange > 0 ? 'text-green-600' : row.percentChange < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {row.percentChange > 0 ? <TrendingUp size={14} /> : row.percentChange < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                <span className="font-bold">{Math.abs(row.percentChange).toFixed(1)}%</span>
                            </div>
                        ) : '-'}
                    </td>

                    <td className="py-4 px-6 text-right text-slate-500 font-medium">
                        {row.percentOfRevenue ? `${row.percentOfRevenue.toFixed(1)}%` : '-'}
                    </td>

                    <td className="py-4 px-6 text-center">
                        {getBenchmarkBadge(row.benchmarkStatus)}
                    </td>
                </tr>

                {/* Renderização condicional dos filhos */}
                {hasChildren && isExpanded && row.subRows!.map((child: DreRow) => renderRow(child, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="w-full overflow-x-auto rounded-[2rem] border border-[#8A9A5B]/20 shadow-sm bg-white">
            <table className="w-full text-sm text-left">
                <thead className="bg-[#697D58] text-white">
                    <tr>
                        <th className="py-5 px-6 font-bold uppercase tracking-widest text-xs rounded-tl-[2rem]">Conta</th>
                        <th className="py-5 px-6 font-bold uppercase tracking-widest text-xs text-right">Período Selecionado</th>
                        <th className="py-5 px-6 font-bold uppercase tracking-widest text-xs text-right opacity-80">Comparativo</th>
                        <th className="py-5 px-6 font-bold uppercase tracking-widest text-xs text-right">Var. %</th>
                        <th className="py-5 px-6 font-bold uppercase tracking-widest text-xs text-right opacity-80">% da Rec.</th>
                        <th className="py-5 px-6 font-bold uppercase tracking-widest text-xs text-center rounded-tr-[2rem]">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map(row => renderRow(row))}
                </tbody>
            </table>
        </div>
    );
};
