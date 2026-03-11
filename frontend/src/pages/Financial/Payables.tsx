import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { financialApi, payablesApi } from '../../services/api';
import { AccountPayableSheet } from '../../components/Financial/AccountPayableSheet';
import {
    ArrowDownCircle,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Plus,
    Search,
    MoreVertical,
    DollarSign,
    Loader2
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useMemo } from 'react';

const PayablesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const queryClient = useQueryClient();

    const { isLoading: isLoadingSummary } = useQuery({
        queryKey: ['financial-summary'],
        queryFn: () => financialApi.getSummary().then(res => res.data)
    });

    const { data: payablesResponse, isLoading: isLoadingPayables } = useQuery({
        queryKey: ['payables-list'],
        queryFn: () => payablesApi.getPayables().then(res => res.data)
    });

    const isLoading = isLoadingSummary || isLoadingPayables;

    const handleSaveAccount = async (data: any) => {
        try {
            await payablesApi.createPayable(data);
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            queryClient.invalidateQueries({ queryKey: ['payables-list'] });
            
            toast.success("Conta a pagar salva com sucesso!", {
                duration: 4000,
                position: 'top-right'
            });
            setIsSheetOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao salvar a conta.", {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando contas a pagar...</p>
            </div>
        );
    }

    const payablesData = payablesResponse?.items || [];
    const payablesSummary = payablesResponse?.summary || { totalPending: 0, totalOverdue: 0, totalDueToday: 0 };
    
    // Achatar contas -> parcelas para exibir em forma de tabela
    const displayPayables = useMemo(() => {
        if (!payablesData) return [];
        
        const flattened = payablesData.flatMap((account: any) => 
            account.installments.map((inst: any) => ({
                id: inst.id,
                accountId: account.id,
                description: account.description + (account.isInstallment ? ` (Parcela ${inst.installmentNumber}/${account.installmentsCount})` : ''),
                category: account.documentNumber ? `NF: ${account.documentNumber}` : 'Despesa',
                amount: inst.amount,
                date: inst.dueDate,
                status: inst.status,
                paymentMethod: inst.paymentMethod || account.paymentMethod
            }))
        );

        return flattened.filter((t: any) =>
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [payablesData, searchTerm]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Toaster />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Contas a Pagar</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de compromissos financeiros e fornecedores.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSheetOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20} />
                        Nova Conta
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Pendente"
                    value={`R$ ${payablesSummary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign size={20} />}
                    color="moss"
                />
                <StatCard
                    title="Atrasados"
                    value={`R$ ${payablesSummary.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<AlertCircle size={20} />}
                    color="dun"
                    alert={payablesSummary.totalOverdue > 0}
                />
                <StatCard
                    title="Vencendo Hoje"
                    value={`R$ ${payablesSummary.totalDueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<Calendar size={20} />}
                    color="moss"
                />
            </div>

            {/* List Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden text-center py-10">
                {displayPayables.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma conta a pagar encontrada</p>
                    </div>
                ) : (
                    <>
                        <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar conta ou fornecedor..."
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto text-left">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#8A9A5B]/5">
                                    {displayPayables.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'OVERDUE' ? 'bg-[#DEB587]/20 text-[#DEB587]' : 'bg-[#8A9A5B]/10 text-[#697D58]'
                                                        }`}>
                                                        <ArrowDownCircle size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-700 text-sm">{item.description}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
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
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'PAID' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                            <CheckCircle2 size={12} /> Pago
                                                        </span>
                                                    ) : item.status === 'OVERDUE' ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-[#DEB587]/10 text-[#DEB587] rounded-full text-[10px] font-black uppercase tracking-widest">
                                                            <AlertCircle size={12} /> Atrasado
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                            <Calendar size={12} /> Pendente
                                                        </span>
                                                    )}
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
                        </div>
                    </>
                )}
            </div>
            
            {/* Sheet Lateral */}
            <AccountPayableSheet 
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSave={handleSaveAccount}
            />
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

export default PayablesPage;
