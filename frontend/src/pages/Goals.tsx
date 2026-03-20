import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '../services/api';
import {
    Target,
    TrendingUp,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    BarChart3,
    Trophy,
    Flame,
    Loader2
} from 'lucide-react';
import { Progress } from '../components/ui/Progress';

const Goals = () => {
    const { data: response, isLoading } = useQuery({
        queryKey: ['goals-report'],
        queryFn: () => reportingApi.getGoals()
    });

    // A API retorna um array direto de metas [FinancialGoal]
    const goalsList = Array.isArray(response?.data) ? response.data : [];

    // Calcular resumo localmente caso não venha do backend
    const summary = {
        globalProgress: goalsList.length > 0
            ? Math.round(goalsList.reduce((acc: number, g: any) => acc + (g.target > 0 ? Math.min(((g.current || g.achieved || 0) / g.target) * 100, 100) : 0), 0) / goalsList.length)
            : 0,
        achieved: goalsList.filter((g: any) => (g.current || g.achieved || 0) >= g.target).length,
        delayed: 0 // Backend ainda não envia status de atraso
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#697D58]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando metas estratégicas...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Metas e OKRs</h2>
                    <p className="text-slate-500 font-medium mt-1">Acompanhamento estratégico de objetivos do negócio.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <PlusIcon />
                        Nova Meta
                    </button>
                </div>
            </div>

            {/* Top Insight */}
            <div className="bg-[#697D58] text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 w-32 h-32 bg-white/10 rounded-[2.5rem] border border-white/20 flex items-center justify-center shrink-0">
                    <Trophy size={64} className="text-[#DEB587]" />
                </div>
                <div className="relative z-10 flex-1">
                    <h3 className="text-3xl font-black mb-4">
                        {summary.globalProgress > 50 ? 'Você está no caminho certo!' : 'Continue focado nos objetivos!'}
                    </h3>
                    <p className="text-[#F0EAD6]/80 font-medium text-lg leading-relaxed mb-8 max-w-2xl">
                        Este período sua clínica atingiu <span className="text-white font-black text-xl">{summary.globalProgress}%</span> do objetivo global. {summary.globalProgress < 10 && 'Inicie lançamentos reais para acompanhar o progresso.'}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest">
                            <CheckCircle2 size={16} /> {summary.achieved} Metas Batidas
                        </span>
                        <span className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest">
                            <Flame size={16} /> {summary.delayed} Em Atraso
                        </span>
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[400px]">
                {goalsList.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 bg-white/50 rounded-[2.5rem] border border-[#8A9A5B]/10">
                        <Target size={48} className="text-slate-200" />
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest text-center">
                            Nenhuma meta cadastrada para este período
                        </p>
                    </div>
                ) : (
                    goalsList.map((goal: any) => (
                        <div key={goal.id} className="bg-white p-8 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${goal.type === 'finance' ? 'bg-[#8A9A5B]/10 text-[#8A9A5B]' :
                                    goal.type === 'growth' ? 'bg-[#DEB587]/10 text-[#DEB587]' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                    {goal.type === 'finance' ? <BarChart3 size={28} /> : goal.type === 'growth' ? <TrendingUp size={28} /> : <Target size={28} />}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={12} /> {goal.month}/{goal.year}
                                </span>
                            </div>

                            <h4 className="text-xl font-black text-[#697D58] mb-2">{goal.title || (goal.type === 'PROFIT' ? 'Meta de Lucro' : 'Objetivo')}</h4>

                                <div className="mb-6">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-2xl font-black text-slate-800">
                                            {goal.type === 'finance' || goal.type === 'PROFIT' || goal.type.toUpperCase() === 'FATURAMENTO' ? `R$ ${(goal.current || goal.achieved || 0).toLocaleString('pt-BR')}` : goal.type === 'efficiency' ? `${goal.current}%` : goal.current}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">Objetivo: {goal.type === 'finance' || goal.type === 'PROFIT' || goal.type.toUpperCase() === 'FATURAMENTO' ? `R$ ${goal.target.toLocaleString('pt-BR')}` : goal.type === 'efficiency' ? `${goal.target}%` : goal.target}</span>
                                    </div>
                                    <Progress value={Math.min(((goal.current || goal.achieved || 0) / goal.target) * 100, 100)} />
                                </div>

                            <div className="flex gap-2 mt-auto">
                                <button className="flex-1 py-4 bg-slate-50 text-slate-400 group-hover:bg-[#8A9A5B] group-hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    Ver Detalhes <ArrowUpRight size={16} />
                                </button>
                                <button className="px-4 py-4 bg-slate-50 text-slate-400 hover:bg-[#DEB587] hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center shadow-inner">
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default Goals;
