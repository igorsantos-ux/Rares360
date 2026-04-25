import React from 'react';
import { Sparkles, AlertTriangle, Target, RefreshCw } from 'lucide-react';
import type { DfcAiInsights } from '../../types/Dfc';

interface Props {
    insights: DfcAiInsights;
    isLoading?: boolean;
    onRefresh?: () => void;
}

export const AiInsightsDfcCard: React.FC<Props> = ({ insights, isLoading, onRefresh }) => {

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 gap-4 text-purple-600 animate-pulse">
                <Sparkles size={32} />
                <p className="font-bold">Gemini analisando o caixa...</p>
            </div>
        );
    }

    if (!insights) return null;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-full bg-white border border-purple-200">
                    <svg className="w-full h-full rotate-[-90deg]">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#f3e8ff" strokeWidth="6" />
                        <circle
                            cx="32" cy="32" r="28" fill="none"
                            stroke={insights.score_saude_caixa > 70 ? "#16a34a" : insights.score_saude_caixa > 40 ? "#eab308" : "#dc2626"}
                            strokeWidth="6"
                            strokeDasharray={`${(insights.score_saude_caixa / 100) * 175.9} 175.9`}
                        />
                    </svg>
                    <span className="absolute font-black text-slate-800">{insights.score_saude_caixa}</span>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Score de Saúde do Caixa</h3>
                    <p className="text-purple-700 text-sm italic font-medium leading-tight">"{insights.diagnostico_caixa}"</p>
                </div>
            </div>

            {insights.risco_caixa_negativo.probabilidade > 10 && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-red-800 text-sm flex items-center gap-1">
                            <AlertTriangle size={16} /> Risco de Caixa Negativo
                        </h4>
                        <span className="text-xs font-black bg-red-200 text-red-700 px-2 py-1 rounded">
                            {insights.risco_caixa_negativo.probabilidade}% PROB.
                        </span>
                    </div>
                    <p className="text-sm text-red-700">
                        Previsto déficit em <span className="font-black">{insights.risco_caixa_negativo.dias_ate_evento} dias</span>.
                        Impacto projetado de <span className="font-black">{formatCurrency(insights.risco_caixa_negativo.valor_estimado)}</span>.
                    </p>
                </div>
            )}

            <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Recomendações Táticas</h4>
                <div className="space-y-3">
                    {insights.recomendacoes_taticas.map((rec, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-xl group hover:border-[#697D58]/40 transition-colors">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <Target size={14} className="text-[#697D58]" /> {rec.titulo}
                                    </h5>
                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{rec.acao}</p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>Impacto Est: {formatCurrency(rec.impacto_estimado_reais)}</span>
                                <span className={`px-2 py-0.5 rounded uppercase ${rec.prioridade === 'alta' ? 'bg-red-100 text-red-700' :
                                    rec.prioridade === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                    Prioridade: {rec.prioridade}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {onRefresh && (
                <button
                    onClick={onRefresh}
                    className="w-full py-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold flex items-center justify-center gap-2 transition-colors border border-purple-200"
                >
                    <RefreshCw size={16} /> Regenerar Análise Completa
                </button>
            )}
        </div>
    );
};
