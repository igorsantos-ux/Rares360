import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialApi } from '../../services/api';
import {
    ArrowUpCircle,
    Search,
    CheckCircle2,
    AlertCircle,
    Clock,
    Filter,
    Plus,
    MoreVertical,
    TrendingUp,
    CreditCard,
    Loader2
} from 'lucide-react';

const ReceivablesPage = () => {
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

    // Filtrar apenas receitas (INCOME) que fazem sentido nesta aba
    const displayReceivables = transactions
        .filter((t: any) => t.type === 'INCOME')
        .filter((t: any) =>
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const isLoading = isSummaryLoading || isTransactionsLoading;

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando contas a receber...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Contas a Receber</h2>
                    <p className="text-slate-500 font-medium mt-1">Acompanhamento de faturamento e pagamentos de clientes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20} />
                        Novo Recebimento
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total a Receber"
                    value={`R$ ${summary?.pendingReceivables?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
                    icon={<TrendingUp size={20} />}
                    color="moss"
                />
                <StatCard
                    title="Vencidos"
                    value="R$ 0,00"
                    icon={<AlertCircle size={20} />}
                    color="dun"
                    alert={false}
                />
                <StatCard
                    title="Recebido (Mês)"
                    value={`R$ ${summary?.revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
                    icon={<CheckCircle2 size={20} />}
                    color="moss"
                />
            </div>

            {/* List Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por paciente ou procedimento..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all">
                            Todos
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#8A9A5B]/10 rounded-xl text-xs font-bold text-[#697D58] hover:bg-[#8A9A5B]/5 transition-all">
                            <Filter size={14} /> Filtro
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {displayReceivables.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <ArrowUpCircle size={48} className="text-slate-200" />
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest text-center">
                                Nenhuma conta a receber encontrada
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente / Serviço</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#8A9A5B]/5">
                                {displayReceivables.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#DEB587]/10 text-[#697D58] rounded-xl flex items-center justify-center font-black text-xs">
                                                    <ArrowUpCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-700 text-sm">{item.customer?.name || 'Cliente Avulso'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-slate-600">
                                                {new Date(item.date).toLocaleDateString('pt-BR')}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-slate-800">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                                <CreditCard size={14} className="text-[#8A9A5B]" />
                                                {item.category || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#8A9A5B]/10 text-[#697D58] rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={12} /> Recebido
                                                </span>
                                            </div>
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

const StatCard = ({ title, value, icon, color, alert }: any) => (
    <div className={`bg-white p-6 rounded-3xl border ${alert ? 'border-[#DEB587]/30 shadow-lg shadow-[#DEB587]/5' : 'border-[#8A9A5B]/10 shadow-sm'} flex items-center gap-5 group`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color === 'moss' ? 'bg-[#8A9A5B]/10 text-[#8A9A5B]' : 'bg-[#DEB587]/10 text-[#DEB587]'
            }`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h5 className={`text-2xl font-black ${alert ? 'text-[#DEB587]' : 'text-[#1A202C]'}`}>{value}</h5>
        </div>
    </div>
);

export default ReceivablesPage;
