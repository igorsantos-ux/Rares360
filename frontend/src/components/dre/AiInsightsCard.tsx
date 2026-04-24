import React from 'react';
import { Sparkles, ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AiInsightsResponse } from '../../types/Dre';

interface Props {
    insights: AiInsightsResponse;
    onRegenerate: () => void;
    isLoading: boolean;
}

export const AiInsightsCard: React.FC<Props> = ({ insights, onRegenerate, isLoading }) => {
    const scoreColor = insights.score_saude_financeira > 75 ? 'text-green-600' :
        insights.score_saude_financeira > 50 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[2.5rem] p-8 shadow-2xl border border-slate-700 relative overflow-hidden">
            {/* Decoração bg */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/50 pb-6 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
                        <Sparkles className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                            Análise Estratégica AI
                            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 tracking-wider">
                                POWERED BY GEMINI
                            </span>
                        </h3>
                        <p className="text-slate-400 font-medium">Diagnóstico C-Level da sua estrutura de resultados</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Health Score</p>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black ${scoreColor}`}>{insights.score_saude_financeira}</span>
                            <span className="text-slate-500 font-bold">/100</span>
                        </div>
                    </div>
                    <button
                        onClick={onRegenerate}
                        disabled={isLoading}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Analisando...' : 'Regerar Análise'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Activity size={16} /> Diagnóstico Executivo
                        </h4>
                        <p className="text-slate-200 text-lg leading-relaxed font-medium">
                            {insights.diagnostico_geral}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-green-500/20">
                            <h4 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <CheckCircle2 size={16} /> Fortalezas
                            </h4>
                            <ul className="space-y-3">
                                {insights.pontos_fortes.map((p, i) => (
                                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span> <span>{p}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-yellow-500/20">
                            <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <AlertTriangle size={16} /> Pontos Críticos
                            </h4>
                            <ul className="space-y-3">
                                {insights.pontos_criticos.map((p, i) => (
                                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                                        <span className="text-yellow-500 mt-0.5">•</span> <span>{p}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-black/20 rounded-3xl p-6 border border-slate-700/50">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-6">
                        Recomendações Práticas
                    </h4>
                    <div className="space-y-4">
                        {insights.recomendacoes.map((rec, i) => (
                            <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg
                    ${rec.prioridade === 'alta' ? 'bg-red-500/20 text-red-400' :
                                            rec.prioridade === 'media' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-300'}
                  `}>
                                        Prioridade {rec.prioridade}
                                    </span>
                                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                                        <ArrowUpRight size={12} /> {rec.impacto_estimado}
                                    </span>
                                </div>
                                <h5 className="font-bold text-white mb-1">{rec.titulo}</h5>
                                <p className="text-sm text-slate-400 leading-relaxed">{rec.acao}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
