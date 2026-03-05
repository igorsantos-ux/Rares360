import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '../../services/api';
import {
    Activity,
    TrendingUp,
    ArrowRightLeft,
    Download,
    Wallet,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

const DFCPage = () => {
    const clinicId = "default-clinic-id";

    // Dados Fictícios para Visualização (DFC Mock)
    const dfc = {
        initialBalance: 45000,
        finalBalance: 72000,
        netChange: 27000,
        operational: {
            total: 35000,
            inflow: 90000,
            outflow: 55000,
            details: [
                { category: 'Recebimento de Clientes', value: 90000, type: 'inflow' },
                { category: 'Pagamento de Fornecedores', value: 30000, type: 'outflow' },
                { category: 'Folha de Pagamento', value: 25000, type: 'outflow' }
            ]
        },
        investing: {
            total: -8000,
            inflow: 0,
            outflow: 8000,
            details: [
                { category: 'Compra de Equipamento Laser', value: 8000, type: 'outflow' }
            ]
        }
    };

    /*
    const { data: realDfc, isLoading } = useQuery({ ... });
    */
    const isLoading = false;

    // Reutilizando lógica de reports para DFC
    // const { data: dre, isLoading } = useQuery({
    //     queryKey: ['dre', clinicId],
    //     queryFn: async () => {
    //         const response = await reportingApi.getDRE(clinicId);
    //         return response.data;
    //     }
    // });

    if (isLoading) return <div className="p-10 text-[#697D58] font-bold">Gerando relatório DFC...</div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity size={24} className="text-[#DEB587]" />
                        <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Relatório DFC</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-9">Demonstração de Fluxo de Caixa - Método Direto.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/20 rounded-2xl font-bold text-sm text-[#697D58] hover:bg-[#8A9A5B]/5 transition-all shadow-sm">
                        <Download size={18} /> Exportar Excel
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Calendar size={20} /> Período
                    </button>
                </div>
            </div>

            {/* Cash KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CashStatCard
                    label="Saldo Inicial"
                    value="R$ 145.200,00"
                    icon={<Wallet size={20} />}
                />
                <CashStatCard
                    label="Geração de Caixa"
                    value={`R$ ${dfc.operational.total.toLocaleString()}`}
                    icon={<TrendingUp size={20} />}
                    positive
                />
                <CashStatCard
                    label="Saldo Final (Projetado)"
                    value={`R$ ${dfc.finalBalance.toLocaleString()}`}
                    icon={<ArrowRightLeft size={20} />}
                />
            </div>

            {/* DFC Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Entradas e Saídas */}
                <div className="bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm">
                    <h3 className="font-extrabold text-2xl text-[#697D58] mb-8">Atividades Operacionais</h3>
                    <div className="space-y-4">
                        {dfc.operational.details.map((item, idx) => (
                            <DFCRow key={idx} label={item.category} value={item.value} type={item.type === 'inflow' ? 'in' : 'out'} />
                        ))}
                        <div className="pt-4 border-t border-[#8A9A5B]/10 mt-6 font-black flex justify-between text-[#697D58]">
                            <span>(=) Fluxo Operacional Líquido</span>
                            <span>R$ {dfc.operational.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Atividades de Investimento e Financiamento */}
                <div className="space-y-8">
                    <div className="bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm">
                        <h3 className="font-extrabold text-2xl text-[#697D58] mb-8">Atividades de Investimento</h3>
                        <div className="space-y-4">
                            {dfc.investing.details.map((item, idx) => (
                                <DFCRow key={idx} label={item.category} value={item.value} type={item.type === 'inflow' ? 'in' : 'out'} />
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#697D58] text-white p-10 rounded-[2.5rem] shadow-2xl">
                        <h3 className="text-2xl font-black mb-6">Conciliação de Caixa</h3>
                        <p className="text-[#F0EAD6]/80 text-sm mb-8 leading-relaxed">
                            O fluxo de caixa operacional demonstra que o modelo de negócio é auto-sustentável e gera liquidez imediata para novos investimentos tecnológicos.
                        </p>
                        <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl border border-white/10">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-[#DEB587]">
                                <ArrowUpRight size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#F0EAD6]/60">Disponibilidade</p>
                                <p className="text-xl font-black">94.2% do Planejado</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CashStatCard = ({ label, value, icon, positive }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-[#8A9A5B]/10 shadow-sm flex items-center gap-5 group">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#8A9A5B] transition-transform group-hover:scale-110">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h5 className="text-2xl font-black text-[#697D58]">{value}</h5>
            {positive && <p className="text-[10px] font-bold text-[#8A9A5B]">+4.2% vs mês ant.</p>}
        </div>
    </div>
);

const DFCRow = ({ label, value, type }: any) => (
    <div className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-xl transition-all">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-3">
            <span className={`text-sm font-black ${type === 'in' ? 'text-[#8A9A5B]' : 'text-[#DEB587]'}`}>
                {type === 'in' ? '+' : '-'} R$ {(value || 0).toLocaleString()}
            </span>
            {type === 'in' ? <ArrowUpRight size={14} className="text-[#8A9A5B]" /> : <ArrowDownRight size={14} className="text-[#DEB587]" />}
        </div>
    </div>
);

export default DFCPage;
