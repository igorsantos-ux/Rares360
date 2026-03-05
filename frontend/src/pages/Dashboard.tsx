import React, { useState } from 'react';
import {
    Bell,
    Search,
    Target,
    ChevronRight,
    Plus,
    X,
    CreditCard,
    Loader2,
    Sparkles,
    TrendingUp
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialApi, reportingApi } from '../services/api';

const Dashboard = () => {
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch summary data
    const { data: summary } = useQuery({
        queryKey: ['financial-summary'],
        queryFn: async () => {
            const response = await financialApi.getSummary();
            return response.data;
        }
    });

    // Fetch current goal
    const { data: goals } = useQuery({
        queryKey: ['financial-goals'],
        queryFn: async () => {
            const response = await reportingApi.getGoals();
            return response.data;
        }
    });

    // Fetch evolution data for the chart
    const { data: evolution } = useQuery({
        queryKey: ['financial-evolution'],
        queryFn: async () => {
            const response = await financialApi.getEvolution();
            return response.data;
        }
    });

    const currentGoal = goals?.find((g: any) => g.type === 'PROFIT') || goals?.[0];

    // Create transaction mutation
    const createTransactionMutation = useMutation({
        mutationFn: (newTransaction: any) => financialApi.createTransaction(newTransaction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
            setIsTransactionModalOpen(false);
        }
    });

    // Update goal mutation
    const updateGoalMutation = useMutation({
        mutationFn: (target: number) => reportingApi.postSmartGoal(target),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
            setIsGoalModalOpen(false);
        }
    });

    const handleCreateTransaction = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            description: formData.get('description'),
            amount: Number(formData.get('amount')),
            type: formData.get('type'),
            category: formData.get('category'),
        };
        createTransactionMutation.mutate(data);
    };

    const handleUpdateGoal = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        updateGoalMutation.mutate(Number(formData.get('target')));
    };

    const goalProgress = currentGoal ? Math.min((currentGoal.achieved / currentGoal.target) * 100, 100) : 0;

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4 bg-slate-100 px-3 py-1.5 rounded-lg w-96">
                    <Search size={18} className="text-slate-400" />
                    <input type="text" placeholder="Buscar relatório ou transação..." className="bg-transparent border-none text-sm w-full focus:outline-none" />
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="flex items-center gap-3 border-l pl-4 ml-2">
                        <div className="text-right">
                            <p className="text-sm font-semibold">Dr. Marcelo Silva</p>
                            <p className="text-xs text-slate-500">Administrador</p>
                        </div>
                        <div className="w-10 h-10 bg-[#10b981]/10 text-[#10b981] flex items-center justify-center rounded-full font-bold border border-[#10b981]/20 shadow-sm">
                            MS
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Grid */}
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
                        <p className="text-slate-500 mt-1">Bem-vindo ao centro de controle financeiro da sua clínica.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">Exportar PDF</button>
                        <button
                            onClick={() => setIsTransactionModalOpen(true)}
                            className="px-6 py-2 bg-[#10b981] text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Nova Transação
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KPICard title="Faturamento Bruto" value={`R$ ${summary?.revenue?.toLocaleString() || '0'}`} change="+12.5%" type="positive" />
                    <KPICard title="Despesas Totais" value={`R$ ${summary?.expenses?.toLocaleString() || '0'}`} change="-2.1%" type="positive" />
                    <KPICard title="Margem Líquida" value={`${summary?.margin?.toFixed(1) || '0'}%`} change="+5.4%" type="positive" />
                    <KPICard title="Lucro Líquido" value={`R$ ${summary?.netProfit?.toLocaleString() || '0'}`} change="+3.2%" type="positive" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Chart Card */}
                    <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-xl text-slate-800">Evolução Mensal</h3>
                            <select className="text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none cursor-pointer hover:border-emerald-500/50 transition-all">
                                <option>Últimos 6 meses</option>
                                <option>Último ano</option>
                            </select>
                        </div>
                        <div className="h-72 mt-auto flex items-end gap-3 px-2">
                            {evolution?.map((item: any, i: number) => {
                                const maxVal = Math.max(...evolution.map((e: any) => e.income), 100);
                                const h = (item.income / maxVal) * 100;
                                const profitH = item.income > 0 ? (item.profit / item.income) * 100 : 0;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer">
                                        <div className="w-full bg-slate-100 rounded-2xl relative overflow-hidden transition-all duration-300 h-full flex flex-col justify-end">
                                            <div
                                                className="w-full bg-slate-200/50 rounded-2xl absolute group-hover:bg-slate-200 transition-all duration-300"
                                                style={{ height: `${h}%` }}
                                            >
                                                <div
                                                    className="absolute inset-x-0 bottom-0 bg-[#0f172a] rounded-2xl group-hover:bg-[#10b981] transition-all duration-300"
                                                    style={{ height: `${Math.max(profitH, 0)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{item.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Side Card - Smart Meta */}
                    <div className="bg-[#0f172a] text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>

                        <div>
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <Target className="text-emerald-400" size={30} />
                            </div>
                            <h3 className="font-bold text-2xl mb-2">Meta Inteligente</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">Próximo objetivo: R$ {currentGoal?.target?.toLocaleString() || '200.000'} de lucro líquido mensal consolidado.</p>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-300 font-medium">Progresso do Mês</span>
                                    <span className="font-bold text-emerald-400 text-lg">R$ {summary?.netProfit?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                    <div
                                        className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-1000"
                                        style={{ width: `${goalProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={() => setIsGoalModalOpen(true)}
                                className="w-full bg-[#10b981] hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 group-hover:translate-y-[-1px]"
                            >
                                Ajustar Planejamento <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Nova Transação */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">Nova Transação</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lançamento Financeiro</p>
                                </div>
                            </div>
                            <button onClick={() => setIsTransactionModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTransaction} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                                    <input name="description" required placeholder="Ex: Pagamento Fornecedor X" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:border-emerald-500 focus:outline-none font-semibold transition-all" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                                        <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:border-emerald-500 focus:outline-none font-semibold transition-all" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                        <select name="type" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:border-emerald-500 focus:outline-none font-semibold transition-all appearance-none cursor-pointer">
                                            <option value="INCOME">Entrada (+)</option>
                                            <option value="EXPENSE">Saída (-)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                                    <input name="category" required placeholder="Ex: Aluguel, Suprimentos, Folha" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:border-emerald-500 focus:outline-none font-semibold transition-all" />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsTransactionModalOpen(false)}
                                    className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={createTransactionMutation.isPending}
                                    className="flex-1 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {createTransactionMutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Lançamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Ajustar Planejamento (Meta) */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">Definir Meta</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Objetivo de Lucro</p>
                                </div>
                            </div>
                            <button onClick={() => setIsGoalModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateGoal} className="p-8 space-y-6">
                            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-3">
                                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                    <TrendingUp size={18} />
                                    <span className="text-xs font-black uppercase tracking-widest">Performance Atual</span>
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                    Seu lucro médio dos últimos meses é de <span className="text-slate-900 font-bold">R$ {summary?.netProfit?.toLocaleString() || '0'}</span>. Estabeleça uma meta desafiadora mas atingível.
                                </p>
                            </div>

                            <div className="flex flex-col gap-1.5 px-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta de Lucro Líquido (R$)</label>
                                <div className="relative">
                                    <input
                                        name="target"
                                        type="number"
                                        required
                                        defaultValue={currentGoal?.target}
                                        placeholder="Ex: 200000"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 focus:border-indigo-500 focus:outline-none font-black text-xl transition-all"
                                    />
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">R$</span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsGoalModalOpen(false)}
                                    className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={updateGoalMutation.isPending}
                                    className="flex-1 px-8 py-4 bg-[#0f172a] hover:bg-black text-white rounded-2xl font-black shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {updateGoalMutation.isPending ? <Loader2 className="animate-spin" /> : 'Salvar Objetivo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const KPICard = ({ title, value, change, type }: { title: string, value: string, change: string, type: 'positive' | 'negative' }) => (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all group cursor-pointer">
        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-3">{title}</p>
        <div className="flex items-baseline justify-between">
            <h4 className="text-3xl font-bold text-slate-800 group-hover:text-[#0f172a] transition-colors">{value}</h4>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${type === 'positive' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {change}
            </span>
        </div>
    </div>
);

export default Dashboard;
