import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { payablesApi } from '../../services/api';
import {
    Calendar,
    AlertCircle,
    Plus,
    DollarSign,
    Loader2
} from 'lucide-react';

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

const PayablesPage = () => {
    const [_isSheetOpen, _setIsSheetOpen] = useState(false);

    const { data: payablesResponse, isLoading } = useQuery({
        queryKey: ['payables-list-v1'],
        queryFn: async () => {
            const res = await payablesApi.getPayables();
            return res.data;
        },
        staleTime: 60000, 
    });

    const payablesSummary = useMemo(() => {
        return {
            totalPending: payablesResponse?.summary?.totalPending || 0,
            totalOverdue: payablesResponse?.summary?.totalOverdue || 0,
            totalDueToday: payablesResponse?.summary?.totalDueToday || 0
        };
    }, [payablesResponse]);

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-[#8A9A5B] font-black uppercase tracking-widest text-xs">Carregando dados financeiros...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Contas a Pagar</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de fornecedores (Etapa 1: Estabilidade).</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => _setIsSheetOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20} />
                        Nova Conta
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Pendente"
                    value={`R$ ${Number(payablesSummary.totalPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign size={20} />}
                    color="moss"
                />
                <StatCard
                    title="Atrasados"
                    value={`R$ ${Number(payablesSummary.totalOverdue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<AlertCircle size={20} />}
                    color="dun"
                    alert={payablesSummary.totalOverdue > 0}
                />
                <StatCard
                    title="Vencendo Hoje"
                    value={`R$ ${Number(payablesSummary.totalDueToday).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<Calendar size={20} />}
                    color="moss"
                />
            </div>

            <div className="p-20 text-center bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">A tabela será reintroduzida na próxima etapa.</p>
                <div className="mt-4 flex justify-center gap-2">
                    <div className="w-2 h-2 bg-[#8A9A5B] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#8A9A5B] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-[#8A9A5B] rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
            </div>
        </div>
    );
};

export default PayablesPage;
