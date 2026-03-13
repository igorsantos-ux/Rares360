import React, { useState } from 'react';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Filter,
    Download,
    Plus,
    X,
    CreditCard,
    Loader2,
    ArrowRightLeft
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportingApi, financialApi } from '../services/api';

const CashFlow = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const queryClient = useQueryClient();

    // Consumo da nova API consolidada de Fluxo de Caixa
    const { data: cashFlowResponse, isLoading } = useQuery({
        queryKey: ['cash-flow-data'],
        queryFn: () => reportingApi.getCashFlow(),
        staleTime: 60000 // Protocolo de Segurança: Evitar re-fetch excessivo
    });

    const summary = cashFlowResponse?.data?.summary;
    const allTransactions = Array.isArray(cashFlowResponse?.data?.transactions) 
        ? cashFlowResponse.data.transactions 
        : [];

    // Filtro local (Protocolo de UI Dinâmica)
    const filteredTransactions = allTransactions.filter(t => {
        if (filter === 'ALL') return true;
        return t.type === filter;
    });

    // Create mutation (Mantido para compatibilidade de lançamento rápido se necessário)
    const createMutation = useMutation({
        mutationFn: (newTransaction: any) => financialApi.createTransaction(newTransaction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cash-flow-data'] });
            setIsModalOpen(false);
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
            date: new Date().toISOString()
        };
        createMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#10b981]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando fluxo de caixa...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Fluxo de Caixa</h2>
                    <p className="text-slate-500 mt-1">Controle de entradas e saídas mensais com projeção financeira.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2 bg-[#10b981] text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Nova Transação
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Download size={18} /> Exportar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FlowCard 
                    title="Saldo em Caixa" 
                    value={`R$ ${(summary?.balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                    icon={<Wallet className={summary?.balance < 0 ? "text-red-500" : "text-blue-500"} />} 
                    isNegative={summary?.balance < 0}
                />
                <FlowCard 
                    title="Entradas (Mês)" 
                    value={`R$ ${(summary?.totalIncomes ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                    icon={<ArrowUpCircle className="text-emerald-500" />} 
                />
                <FlowCard 
                    title="Saídas (Mês)" 
                    value={`R$ ${(summary?.totalExpenses ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                    icon={<ArrowDownCircle className="text-red-500" />} 
                />
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
                <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <h3 className="font-bold text-xl text-slate-800">Transações Recentes</h3>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setFilter('ALL')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Todas
                            </button>
                            <button 
                                onClick={() => setFilter('INCOME')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'INCOME' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}
                            >
                                Entradas
                            </button>
                            <button 
                                onClick={() => setFilter('EXPENSE')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'EXPENSE' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-red-600'}`}
                            >
                                Saídas
                            </button>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-all">
                        <Filter size={18} /> Filtrar Período
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {filteredTransactions.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <ArrowRightLeft size={48} className="text-slate-200" />
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest text-center">
                                Nenhuma transação encontrada no período
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((t: any) => {
                                    let displayDate = "--/--/----";
                                    try {
                                        if (t.date) {
                                            displayDate = new Date(t.date).toLocaleString('pt-BR', { 
                                                day: '2-digit', 
                                                month: 'short', 
                                                year: 'numeric'
                                            });
                                        }
                                    } catch (e) {
                                        console.error("Invalid date", t.date);
                                    }

                                    return (
                                        <TransactionRow
                                            key={t.id}
                                            date={displayDate}
                                            title={t.description || "Sem descrição"}
                                            category={t.category || "Geral"}
                                            amount={`${t.type === 'INCOME' ? '+' : '-'} R$ ${(t.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                            type={t.type?.toLowerCase() || 'expense'}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {filteredTransactions.length > 5 && (
                    <div className="p-6 border-t border-slate-200 text-center">
                        <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-all">Ver extrato completo</button>
                    </div>
                )}
            </div>

            {/* Modal Nova Transação (Opcional - Pode redirecionar para Contas a Pagar/Receber para manter consistência) */}
            {isModalOpen && (
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
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
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
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={createMutation.isPending}
                                    className="flex-1 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Lançamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const FlowCard = ({ title, value, icon, isNegative }: any) => (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-[#10b981]/30 transition-all">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:shadow-inner transition-all">
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</p>
            <h4 className={`text-2xl font-black ${isNegative ? 'text-red-500' : 'text-slate-900'}`}>{value}</h4>
        </div>
    </div>
);

const TransactionRow = ({ date, title, category, amount, type }: any) => (
    <tr className="hover:bg-slate-50/50 transition-all group">
        <td className="px-8 py-6">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'}`}>
                    {type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                </div>
                <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-black">{title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{category}</p>
                </div>
            </div>
        </td>
        <td className="px-8 py-6 text-slate-500 font-bold text-xs">{date}</td>
        <td className={`px-8 py-6 text-right font-black text-lg ${type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
            {amount}
        </td>
    </tr>
);

export default CashFlow;
