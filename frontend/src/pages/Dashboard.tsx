import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Target,
    TrendingDown,
    DollarSign,
    Wallet,
    PieChart,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { financialApi, integrationApi, goalsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import GoalModal from '../components/GoalModal';
import { Edit2 } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(false);
    const [period, setPeriod] = useState<'diário' | 'semanal' | 'mensal' | 'semestral' | 'anual'>('mensal');

    const getDateParams = () => {
        const now = new Date();
        let start = new Date();
        let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        switch (period) {
            case 'diário':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                break;
            case 'semanal':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                start.setHours(0, 0, 0, 0);
                break;
            case 'mensal':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'semestral':
                start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                break;
            case 'anual':
                start = new Date(now.getFullYear(), 0, 1);
                break;
        }
        return { 
            startDate: start.toISOString(), 
            endDate: end.toISOString() 
        };
    };

    const periodParams = getDateParams();
    
    // Gatilho de Sincronização Automática
    useEffect(() => {
        const triggerSync = async () => {
            try {
                setIsSyncing(true);
                await integrationApi.sync('finance');
                queryClient.invalidateQueries({ queryKey: ['dashboard-real'] });
                console.log('✅ Dashboard sincronizado.');
            } catch (error) {
                console.warn('Auto-sync Dashboard falhou:', error);
            } finally {
                setIsSyncing(false);
            }
        };
        triggerSync();
    }, [queryClient]);


    const { data: dashboard, isLoading, error } = useQuery({
        queryKey: ['dashboard-real', period],
        queryFn: () => financialApi.getSummary(periodParams).then(res => res.data),
        retry: 1
    });

    const { data: dailyEvolution } = useQuery({
        queryKey: ['financial-daily-evolution', period],
        queryFn: () => financialApi.getDailyEvolution(periodParams).then(res => res.data)
    });

    const { data: evolution } = useQuery({
        queryKey: ['financial-evolution', period],
        queryFn: () => financialApi.getEvolution(periodParams).then(res => res.data)
    });

    const { data: goalStats } = useQuery({
        queryKey: ['monthly-goal-stats'],
        queryFn: () => goalsApi.getSummary().then(res => res.data)
    });

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    if (error) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                    <TrendingDown className="text-red-400" size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700">Ops! Ocorreu um erro</h3>
                <p className="text-slate-400 font-medium text-center max-w-xs">Não conseguimos carregar seus dados financeiros. Verifique sua conexão.</p>
                <button 
                    onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['dashboard-real'] });
                        queryClient.invalidateQueries({ queryKey: ['financial-daily-evolution'] });
                        queryClient.invalidateQueries({ queryKey: ['financial-evolution'] });
                    }}
                    className="mt-4 px-6 py-2 bg-[#8A9A5B] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#697D58] transition-all"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando inteligência financeira...</p>
            </div>
        );
    }

    // --- Lógica de Metas e Produtividade (Somente após carregar) ---
    // Usando dados dinâmicos do novo GoalService se disponíveis
    const meta = goalStats?.revenueTarget || dashboard?.goal || 600000;
    const realizado = goalStats?.currentRevenue !== undefined ? goalStats.currentRevenue : (dashboard?.receivedRevenue || 0);
    const bruto = dashboard?.grossRevenue || 0;
    const pendenteReceber = dashboard?.pendingReceivables || 0;
    const gapMeta = goalStats?.gap !== undefined ? goalStats.gap : Math.max(meta - realizado, 0);

    // Indicadores Dinâmicos do Backend
    const ritmoNecessario = goalStats?.requiredPace || 0;
    const ticketMedioDia = goalStats?.ticketMedioDia || 0;
    const ticketMedioPaciente = goalStats?.ticketPorPaciente || 0;
    const projecaoPacientes = goalStats?.pacientesFaltantes || 0;
    const progressoMeta = goalStats?.progress !== undefined ? goalStats.progress : (meta > 0 ? Math.min(Math.round((realizado / meta) * 100), 100) : 0);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-[#697D58]">
                        Olá, <span className="text-[#8A9A5B]">{user?.name?.split(' ')[0] || 'Gestor'}</span>!
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-slate-500 font-medium">Sua visão estratégica de faturamento hoje.</p>
                        {isSyncing && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#8A9A5B]/10 border border-[#8A9A5B]/20 rounded-full animate-pulse">
                                <RefreshCw className="w-3 h-3 text-[#8A9A5B] animate-spin" />
                                <span className="text-[10px] font-black text-[#697D58] uppercase tracking-widest">Sincronizando...</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Filtros de Período */}
                <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                    {(['diário', 'semanal', 'mensal', 'semestral', 'anual'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                period === p 
                                ? 'bg-white text-[#697D58] shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

            </div>

            {/* SEÇÃO 1: O "Termômetro" do Mês */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">O Termômetro do Mês</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KPICard
                        title="Faturamento Bruto"
                        value={`R$ ${bruto.toLocaleString('pt-BR')}`}
                        description="Total de vendas realizadas"
                        icon={<DollarSign size={20} />}
                    />
                    <KPICard
                        title="Faturamento Líquido"
                        value={`R$ ${realizado.toLocaleString('pt-BR')}`}
                        description="Pós taxas e antecipações"
                        trend="up"
                        icon={<Wallet size={20} />}
                    />
                    <KPICard
                        title="Pendências"
                        value={`R$ ${pendenteReceber.toLocaleString('pt-BR')}`}
                        description="Vendas não recebidas"
                        trend="down"
                        icon={<TrendingDown size={20} />}
                    />
                </div>
            </section>

            {/* SEÇÃO 2: Gestão de Saídas */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Gestão de Saídas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MetricCard
                        title="Despesas Pagas"
                        value={`R$ ${(dashboard?.expenses || 0).toLocaleString('pt-BR')}`}
                        description="Custos liquidados no período"
                        icon={<TrendingDown size={18} className="text-red-400" />}
                    />
                    <MetricCard
                        title="Despesas Pendentes"
                        value={`R$ ${(dashboard?.pendingPayables || 0).toLocaleString('pt-BR')}`}
                        description="Boletos e parcelas a vencer"
                        icon={<PieChart size={18} className="text-[#DEB587]" />}
                    />
                </div>
            </section>

            {/* SEÇÃO 3: O Dashboard de Metas (Destaque Central) */}
            <div id="ritmo-meta" className="bg-[#697D58] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-12">
                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-[#F0EAD6]/10 rounded-2xl flex items-center justify-center">
                                    <Target size={24} className="text-[#DEB587]" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <h4 className="text-3xl font-black">Meta de Faturamento</h4>
                                    <button 
                                        onClick={() => setIsGoalModalOpen(true)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-all text-[#DEB587] group"
                                    >
                                        <Edit2 size={16} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[#F0EAD6]/70 font-medium text-lg">
                                Meta do Mês: <span className="text-white font-bold">R$ {meta.toLocaleString('pt-BR')}</span>
                                {goalStats?.workingDays && (
                                    <span className="ml-3 text-[10px] text-[#DEB587] font-black uppercase tracking-widest">({goalStats.workingDays} dias úteis)</span>
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="p-6 bg-black/10 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-[#DEB587] uppercase tracking-widest mb-2">Ritmo Necessário</p>
                                <h5 className="text-3xl font-black">R$ {ritmoNecessario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                                <p className="text-[10px] text-[#F0EAD6]/50 mt-1">Por dia útil para bater a meta</p>
                            </div>
                            <div className="p-6 bg-black/10 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-[#DEB587] uppercase tracking-widest mb-2">Gap da Meta</p>
                                <h5 className="text-3xl font-black">R$ {gapMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                                <p className="text-[10px] text-[#F0EAD6]/50 mt-1">Faltam para o objetivo</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black uppercase tracking-widest text-[#F0EAD6]/60">Progresso Mensal</span>
                                <span className="text-2xl font-black">{progressoMeta}%</span>
                            </div>
                            <div className="h-4 bg-black/20 rounded-full overflow-hidden p-1 shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressoMeta}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[#DEB587] to-[#F0EAD6] rounded-full shadow-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-80 flex flex-col gap-6">
                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10">
                            <h6 className="text-xs font-black text-[#DEB587] uppercase tracking-widest mb-6">Produtividade</h6>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] text-[#F0EAD6]/60 font-bold uppercase mb-1">Ticket Médio / Dia</p>
                                    <p className="text-xl font-black">R$ {ticketMedioDia.toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="h-px bg-white/5"></div>
                                <div>
                                    <p className="text-[10px] text-[#F0EAD6]/60 font-bold uppercase mb-1">Ticket / Paciente</p>
                                    <p className="text-xl font-black">R$ {ticketMedioPaciente.toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="h-px bg-white/5"></div>
                                <div>
                                    <p className="text-[10px] text-[#F0EAD6]/60 font-bold uppercase mb-1">Faltam p/ Meta</p>
                                    <p className="text-xl font-black text-[#DEB587]">{projecaoPacientes} pacientes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 4: Gráficos de Evolução */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico 1: Evolução Diária Acumulada vs Meta */}
                <div className="bg-white p-10 rounded-[3rem] border border-[#8A9A5B]/10 shadow-sm relative overflow-hidden">
                    <div className="mb-10">
                        <h3 className="font-extrabold text-2xl text-[#697D58]">Evolução Acumulada</h3>
                        <p className="text-sm text-slate-400 font-medium">Faturamento real vs. linha da meta</p>
                    </div>
                    <div className="h-64 flex items-end gap-1.5 px-4 relative">
                        {Array.isArray(dailyEvolution) && dailyEvolution.length > 0 ? (
                            dailyEvolution.map((day: any, i: number) => {
                                const maxVal = Math.max(...dailyEvolution.map((d: any) => d.target), 600000);
                                const heightReal = (day.accumulated / maxVal) * 100;
                                const heightTarget = (day.target / maxVal) * 100;
                                
                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                        <div 
                                            className="w-full bg-[#8A9A5B]/30 rounded-t-sm absolute bottom-0 transition-all duration-500" 
                                            style={{ height: `${heightTarget}%`, zIndex: 1 }}
                                        />
                                        <div 
                                            className="w-full bg-[#697D58] rounded-t-sm absolute bottom-0 transition-all duration-700" 
                                            style={{ height: `${heightReal}%`, zIndex: 2 }}
                                        />
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-[#1A202C] text-white text-[9px] p-2 rounded-lg z-20 whitespace-nowrap shadow-xl">
                                            {day.date || `Dia ${day.day}`}: R$ {day.accumulated.toLocaleString('pt-BR')}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Aguardando dados de faturamento...</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-center gap-10">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#697D58] rounded-full"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Realizado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#8A9A5B]/30 rounded-full"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Projeção Meta</span>
                        </div>
                    </div>
                </div>

                {/* Gráfico 2: Receita vs Despesa */}
                <div className="bg-white p-10 rounded-[3rem] border border-[#8A9A5B]/10 shadow-sm relative overflow-hidden">
                    <div className="mb-10">
                        <h3 className="font-extrabold text-2xl text-[#697D58]">Histórico Mensal</h3>
                        <p className="text-sm text-slate-400 font-medium">Comparativo de Receita vs Despesa (7 meses)</p>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-3 px-4">
                        {Array.isArray(evolution) && evolution.length > 0 ? (
                            evolution.map((month: any, i: number) => {
                                const maxVal = Math.max(...evolution.map((m: any) => Math.max(m.income, m.expenses)), 1000);
                                const hIncome = (month.income / maxVal) * 100;
                                const hExpense = (month.expenses / maxVal) * 100;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group px-1">
                                        <div className="w-full flex items-end justify-center gap-[2px] h-full">
                                            <div 
                                                className="w-full bg-[#8A9A5B] rounded-t-sm transition-all duration-500 group-hover:brightness-110" 
                                                style={{ height: `${hIncome}%` }}
                                            />
                                            <div 
                                                className="w-full bg-red-400/30 rounded-t-sm transition-all duration-700 group-hover:brightness-110" 
                                                style={{ height: `${hExpense}%` }}
                                            />
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{month.month}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Aguardando dados históricos...</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-[#8A9A5B] rounded-full"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receitas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-red-400/30 rounded-full"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Despesas</span>
                        </div>
                    </div>
                </div>
            </div>

            <GoalModal 
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                currentGoal={meta}
                currentWorkingDays={goalStats?.workingDays || 22}
            />
        </div>
    );
};

const KPICard = ({ title, value, description, trend, icon }: any) => (
    <div className="bg-white p-10 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-500 group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all group-hover:scale-125">
            {icon}
        </div>
        <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{title}</p>
            <h4 className="text-4xl font-black text-[#1A202C] mb-2 tracking-tight">{value}</h4>
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">{description}</span>
                {trend && (
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${trend === 'up' ? 'bg-[#8A9A5B]/10 text-[#8A9A5B]' : 'bg-[#DEB587]/10 text-[#DEB587]'}`}>
                        {trend === 'up' ? 'Consistente' : 'Atenção'}
                    </div>
                )}
            </div>
        </div>
    </div>
);

const MetricCard = ({ title, value, description, icon }: any) => (
    <div className="bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border border-[#8A9A5B]/5 flex items-center gap-6 hover:bg-white transition-all duration-500 group shadow-sm">
        <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-sm border border-[#8A9A5B]/10 flex items-center justify-center transition-transform group-hover:scale-110">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h5 className="text-2xl font-black text-[#697D58]">{value}</h5>
            <p className="text-[10px] text-slate-400 font-medium">{description}</p>
        </div>
    </div>
);

export default Dashboard;
