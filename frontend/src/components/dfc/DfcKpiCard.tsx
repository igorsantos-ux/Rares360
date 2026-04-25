import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Activity, Calendar, Zap, AlertTriangle } from 'lucide-react';
import type { DfcKpis } from '../../types/Dfc';

interface Props {
    kpis: DfcKpis;
}

export const DfcKpiCard: React.FC<Props> = ({ kpis }) => {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* LINHA 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <Wallet size={20} />
                        </div>
                        <h3 className="font-bold text-slate-600 text-sm">Saldo Inicial</h3>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800">{formatCurrency(kpis.initialBalance)}</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">No período selecionado</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B6D11]/5 rounded-full blur-3xl" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kpis.cashGeneration >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {kpis.cashGeneration >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <h3 className="font-bold text-slate-600 text-sm">Geração de Caixa</h3>
                    </div>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full ${kpis.cashGeneration >= 0 ? 'bg-[#3B6D11] text-white' : 'bg-[#A32D2D] text-white'}`}>
                        {kpis.cashGeneration >= 0 ? 'Superávit' : 'Déficit'}
                    </div>
                </div>
                <div className="relative z-10">
                    <h2 className={`text-3xl font-black ${kpis.cashGeneration >= 0 ? 'text-[#3B6D11]' : 'text-[#A32D2D]'}`}>
                        {formatCurrency(kpis.cashGeneration)}
                    </h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">
                        <span className={kpis.cashGenerationPercent > 0 ? "text-green-500" : "text-red-500"}>
                            {kpis.cashGenerationPercent > 0 ? '+' : ''}{kpis.cashGenerationPercent.toFixed(1)}%
                        </span> vs entradas/saídas
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-md shadow-indigo-100 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-bold text-indigo-900 text-sm">Saldo Final Projetado</h3>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-indigo-700">{formatCurrency(kpis.projectedFinalBalance)}</h2>
                    <div className="mt-2 h-8 w-full bg-slate-50 border border-slate-100 rounded-lg flex items-end">
                        <div className="w-full text-xs text-center text-slate-400 italic">Sparkline preview</div>
                    </div>
                </div>
            </div>

            {/* LINHA 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Calendar size={20} />
                        </div>
                        <h3 className="font-bold text-slate-600 text-sm">Runway (Autonomia)</h3>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800">
                        {kpis.runwayMonths} <span className="text-lg font-bold text-slate-400">meses</span>
                    </h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">Equivale a {kpis.runwayDays} dias</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <Activity size={20} />
                        </div>
                        <h3 className="font-bold text-slate-600 text-sm">Burn Rate</h3>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800">{formatCurrency(kpis.burnRate)}</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">
                        <span className={kpis.burnRateChange > 0 ? "text-red-500" : "text-green-500"}>
                            {kpis.burnRateChange > 0 ? '+' : ''}{kpis.burnRateChange.toFixed(1)}%
                        </span> média últimos 3m
                    </p>
                </div>
            </div>

            <div className={`bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${kpis.liquidityStatus === 'SAUDAVEL' ? 'border-[#3B6D11]/30' :
                    kpis.liquidityStatus === 'ATENCAO' ? 'border-[#BA7517]/30' : 'border-[#A32D2D]/30'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kpis.liquidityStatus === 'SAUDAVEL' ? 'bg-[#3B6D11]/10 text-[#3B6D11]' :
                                kpis.liquidityStatus === 'ATENCAO' ? 'bg-[#BA7517]/10 text-[#BA7517]' : 'bg-[#A32D2D]/10 text-[#A32D2D]'
                            }`}>
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="font-bold text-slate-600 text-sm">Índice de Liquidez</h3>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800">{kpis.liquidityIndex.toFixed(2)}x</h2>
                    <p className={`text-sm font-bold mt-1 ${kpis.liquidityStatus === 'SAUDAVEL' ? 'text-[#3B6D11]' :
                            kpis.liquidityStatus === 'ATENCAO' ? 'text-[#BA7517]' : 'text-[#A32D2D]'
                        }`}>
                        Status: {kpis.liquidityStatus}
                    </p>
                </div>
            </div>
        </div>
    );
};
