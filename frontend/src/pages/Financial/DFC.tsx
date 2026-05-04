import { useState, useEffect } from 'react';
import { Download, Sliders, Sparkles, AlertTriangle } from 'lucide-react';
import { useDfcReport, useDfcAiInsights, useDfcSimulator } from '../../hooks/useDfcData';
import type { DfcFilters } from '../../hooks/useDfcData';
import { DfcKpiCard } from '../../components/dfc/DfcKpiCard';
import { CashFlowChart } from '../../components/dfc/CashFlowChart';
import { AiInsightsDfcCard } from '../../components/dfc/AiInsightsDfcCard';
import { AlertsPanel } from '../../components/dfc/AlertsPanel';
import { ActivitiesBlock } from '../../components/dfc/ActivitiesBlock';
import { ScenarioSimulator } from '../../components/dfc/ScenarioSimulator';
import { DrillDownDfcDrawer } from '../../components/dfc/DrillDownDfcDrawer';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { format, subDays } from 'date-fns';

export default function DfcPage() {
    const today = new Date();
    const [filters, setFilters] = useState<DfcFilters>({
        period: 'CUSTOM',
        startDate: format(subDays(today, 90), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
        mode: 'BOTH',
        method: 'DIRECT'
    });

    const { data: dfc, isLoading, isError } = useDfcReport(filters);
    const aiInsightsMutation = useDfcAiInsights();

    // Trigger AI Fetch upon render quando DFC chega
    useEffect(() => {
        if (dfc && !aiInsightsMutation.data && !aiInsightsMutation.isPending) {
            aiInsightsMutation.mutate({ dfcData: dfc });
        }
    }, [dfc, aiInsightsMutation.data, aiInsightsMutation.isPending, aiInsightsMutation]);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const simulatorMutation = useDfcSimulator();

    if (isLoading) {
        return (
            <div className="p-8 h-full flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold">Consolidando Fluxos de Caixa...</p>
                </div>
            </div>
        );
    }

    if (isError || !dfc) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>Falha ao carregar relatório. Tente novamente mais tarde.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header Stratégico C-Level */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 mb-8 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-[#1E293B]">Fluxo de Caixa (DFC)</h1>
                        <p className="text-slate-500 font-medium">Gestão Preditiva e Acompanhamento de Tesouraria</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => setIsSimulatorOpen(true)} className="h-10 px-4 rounded-xl font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-2 border border-indigo-200 transition-colors">
                            <Sliders size={18} />
                            Simular Cenário
                        </button>

                        <div className="flex bg-slate-100 p-1 rounded-xl mr-3">
                            <DateRangePicker 
                                value={{ startDate: filters.startDate!, endDate: filters.endDate! }}
                                onChange={(range) => setFilters({ ...filters, period: 'CUSTOM', ...range })}
                            />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['REALIZED', 'PROJECTED', 'BOTH'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setFilters({ ...filters, mode: mode as any })}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filters.mode === mode
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                >
                                    {mode === 'REALIZED' ? 'Realizado' : mode === 'PROJECTED' ? 'Projetado' : 'Misto'}
                                </button>
                            ))}
                        </div>

                        <button className="h-10 px-4 rounded-xl font-bold bg-[#697D58] text-white hover:bg-[#526343] flex items-center gap-2 transition-colors shadow-lg shadow-[#697D58]/20">
                            <Download size={18} />
                            Exportar Relatório
                        </button>
                    </div>
                </div>
            </div>

            <main className="px-8 max-w-[1920px] mx-auto space-y-8">
                <DfcKpiCard kpis={dfc.kpis} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[600px] flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="font-bold text-slate-800">Projeção Composta (90 dias)</h2>
                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Automático</span>
                        </div>
                        <div className="flex-1 min-h-0">
                            <CashFlowChart data={dfc.dailyFlows} />
                        </div>
                    </div>

                    <div className="xl:col-span-1 flex flex-col gap-6">
                        <div className="border border-slate-200 rounded-3xl p-6 bg-white shadow-sm flex-1">
                            <h2 className="font-bold mb-4 text-slate-800 flex items-center gap-2">
                                <Sparkles size={20} className="text-purple-600" />
                                Inteligência de Caixa
                                <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-auto">Gemini AI</span>
                            </h2>
                            <AiInsightsDfcCard
                                insights={aiInsightsMutation.data!}
                                isLoading={aiInsightsMutation.isPending}
                                onRefresh={() => dfc && aiInsightsMutation.mutate({ dfcData: dfc })}
                            />
                        </div>

                        <div className="border border-slate-200 rounded-3xl p-6 bg-white shadow-sm">
                            <h2 className="font-bold mb-4 text-slate-800 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-amber-500" />
                                Alertas de Tesouraria
                            </h2>
                            <AlertsPanel alerts={[
                                { id: '1', type: 'WARNING', message: 'Burn rate cresceu 2.5% em relação à média dos últimos 3 meses.', actionLabel: 'Avaliar Custos' },
                                { id: '2', type: 'CRITICAL', message: 'Déficit projetado na primeira semana do mês seguinte se baseada na folha prevista.', actionLabel: 'Antecipar' }
                            ]} />
                        </div>
                    </div>
                </div>

                <ActivitiesBlock activities={dfc.activities} />
            </main>

            <ScenarioSimulator
                isOpen={isSimulatorOpen}
                onClose={() => setIsSimulatorOpen(false)}
                onSimulate={(inputs) => simulatorMutation.mutate(inputs)}
            />

            <DrillDownDfcDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Atividades Operacionais"
                dateContext="Últimos 90 dias"
            />
        </div>
    );
}
