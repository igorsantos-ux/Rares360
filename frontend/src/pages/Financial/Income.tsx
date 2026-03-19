import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialApi } from '../../services/api';
import {
    Wallet,
    Search,
    ArrowRightLeft,
    CheckCircle2,
    Filter,
    Plus,
    MoreVertical,
    TrendingUp,
    Briefcase,
    Loader2
} from 'lucide-react';

const IncomePage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: summaryResponse, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['financial-summary'],
        queryFn: () => financialApi.getSummary()
    });

    const summary = summaryResponse?.data;

    const { data: transactionsResponse, isLoading: isTransactionsLoading } = useQuery({
        queryKey: ['financial-transactions'],
        queryFn: () => financialApi.getTransactions()
    });

    const transactions = transactionsResponse?.data || [];

    // Filtrar apenas receitas (INCOME) para o caixa
    const displayIncome = transactions
        .filter((t: any) => t.type === 'INCOME')
        .filter((i: any) => i.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const isLoading = isSummaryLoading || isTransactionsLoading;

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando recebimentos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Recebimentos (Caixa)</h2>
                    <p className="text-slate-500 font-medium mt-1">Controle de entradas imediatas e fluxo de caixa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20} />
                        Lançar Recebimento
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <IncomeStatCard
                    title="Saldo em Caixa"
                    value={`R$ ${summary?.netProfit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
                    icon={<Wallet size={20} />}
                />
                <IncomeStatCard
                    title="Entradas Hoje"
                    value={`R$ ${summary?.revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
                    icon={<TrendingUp size={20} />}
                />
                <IncomeStatCard
                    title="Fechamento Anterior"
                    value="R$ 0,00"
                    icon={<Briefcase size={20} />}
                />
            </div>

            {/* List Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar lançamento..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                        <Filter size={16} /> Filtrar
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {displayIncome.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-8 animate-in fade-in zoom-in duration-1000">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#8A9A5B]/20 blur-3xl rounded-full scale-150" />
                                <div className="relative w-24 h-24 bg-white border border-[#8A9A5B]/10 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#8A9A5B]/20">
                                    <TrendingUp size={40} className="text-[#8A9A5B]" />
                                </div>
                            </div>
                            <div className="text-center max-w-sm space-y-2">
                                <h3 className="text-2xl font-black text-[#697D58]">O começo da sua clareza</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">
                                    Sua jornada estratégica começa aqui. Realize seu primeiro faturamento para ver a mágica da metodologia Rares acontecer.
                                </p>
                            </div>
                            <button className="flex items-center gap-2 px-8 py-4 bg-[#8A9A5B] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.05] active:scale-95 transition-all">
                                <Plus size={20} />
                                Lançar Meu Primeiro Recebimento
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#8A9A5B]/5">
                                {displayIncome.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#8A9A5B]/10 text-[#697D58] rounded-xl flex items-center justify-center font-black text-xs">
                                                    <ArrowRightLeft size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-700 text-sm">{item.description}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category || 'Entrada de Caixa'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-slate-600">
                                                {new Date(item.date).toLocaleDateString('pt-BR')}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-emerald-600">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            {item.category || 'Dinheiro'}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#8A9A5B]/10 text-[#697D58] rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
                                                <CheckCircle2 size={12} /> Confirmado
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-[#8A9A5B]">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const IncomeStatCard = ({ title, value, icon }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-[#8A9A5B]/10 shadow-sm flex items-center gap-5 group">
        <div className="w-12 h-12 bg-[#8A9A5B]/10 text-[#8A9A5B] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h5 className="text-2xl font-black text-[#1A202C]">{value}</h5>
        </div>
    </div>
);

export default IncomePage;
