import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportingApi } from '../../services/api';
import { useState } from 'react';
import DateFilter from '../../components/DateFilter';
import {
    Activity,
    TrendingUp,
    ArrowRightLeft,
    Download,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';

const DFCPage = () => {
    const queryClient = useQueryClient();

    // Estados para Filtro de Data
    const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Busca os dados reais do DFC (reutilizando motor do DRE se necessário ou endpoint específico)
    const { data: response, isLoading } = useQuery({
        queryKey: ['dfc-report', selectedPeriod, customStartDate, customEndDate],
        queryFn: () => reportingApi.getDRE({
            startDate: selectedPeriod === 'Personalizado' ? customStartDate : undefined,
            endDate: selectedPeriod === 'Personalizado' ? customEndDate : undefined
        }) // O DRE já processa entradas e saídas de forma similar ao DFC direto
    });

    const dreData = response?.data;

    // Adaptar dados do DRE para a visualização do DFC
    const dfc = {
        initialBalance: dreData?.summary?.initialBalance || 0,
        finalBalance: dreData?.summary?.netProfit || 0,
        netChange: dreData?.summary?.netProfit || 0,
        operational: {
            total: dreData?.summary?.netProfit || 0,
            inflow: dreData?.summary?.revenue || 0,
            outflow: dreData?.summary?.expenses || 0,
            details: (dreData?.categories || [])
                .filter((cat: any) => cat.total !== 0)
                .map((cat: any) => ({
                    category: cat.name,
                    value: Math.abs(cat.total),
                    type: cat.total >= 0 ? 'inflow' : 'outflow'
                }))
        },
        investing: {
            total: 0,
            inflow: 0,
            outflow: 0,
            details: []
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#697D58]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Gerando relatório DFC real...</p>
            </div>
        );
    }

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
                    <DateFilter 
                        selectedPeriod={selectedPeriod}
                        setSelectedPeriod={setSelectedPeriod}
                        customStartDate={customStartDate}
                        setCustomStartDate={setCustomStartDate}
                        customEndDate={customEndDate}
                        setCustomEndDate={setCustomEndDate}
                        onApply={() => queryClient.invalidateQueries({ queryKey: ['dfc-report'] })}
                    />
                </div>
            </div>

            {/* Cash KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CashStatCard
                    label="Saldo Inicial"
                    value={`R$ ${dfc.initialBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<Wallet size={20} />}
                />
                <CashStatCard
                    label="Geração de Caixa"
                    value={`R$ ${dfc.operational.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<TrendingUp size={20} />}
                    positive={dfc.operational.total > 0}
                />
                <CashStatCard
                    label="Saldo Final (Real)"
                    value={`R$ ${dfc.finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<ArrowRightLeft size={20} />}
                />
            </div>

            {/* DFC Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Entradas e Saídas */}
                <div className="bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm min-h-[400px]">
                    <h3 className="font-extrabold text-2xl text-[#697D58] mb-8">Atividades Operacionais</h3>
                    <div className="space-y-4">
                        {dfc.operational.details.length === 0 ? (
                            <p className="text-slate-400 text-sm italic py-10 text-center">Nenhuma atividade operacional registrada no período.</p>
                        ) : (
                            dfc.operational.details.map((item: any, idx: number) => (
                                <DFCRow key={idx} label={item.category} value={item.value} type={item.type === 'inflow' ? 'in' : 'out'} />
                            ))
                        )}
                        <div className="pt-4 border-t border-[#8A9A5B]/10 mt-6 font-black flex justify-between text-[#697D58]">
                            <span>(=) Fluxo Operacional Líquido</span>
                            <span>R$ {dfc.operational.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Atividades de Investimento e Financiamento */}
                <div className="space-y-8">
                    <div className="bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm">
                        <h3 className="font-extrabold text-2xl text-[#697D58] mb-8">Atividades de Investimento</h3>
                        <div className="space-y-4">
                            {dfc.investing.details.length === 0 ? (
                                <p className="text-slate-400 text-sm italic py-4">Nenhum investimento registrado.</p>
                            ) : (
                                dfc.investing.details.map((item: any, idx: number) => (
                                    <DFCRow key={idx} label={item.category} value={item.value} type={item.type === 'inflow' ? 'in' : 'out'} />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-[#697D58] text-white p-10 rounded-[2.5rem] shadow-2xl">
                        <h3 className="text-2xl font-black mb-6">Conciliação de Caixa</h3>
                        <p className="text-[#F0EAD6]/80 text-sm mb-8 leading-relaxed">
                            O fluxo de caixa operacional demonstra a saúde financeira real da clínica baseada em recebimentos e pagamentos efetivados.
                        </p>
                        <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl border border-white/10">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-[#DEB587]">
                                <ArrowUpRight size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#F0EAD6]/60">Disponibilidade</p>
                                <p className="text-xl font-black">Fluxo Consolidado</p>
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
            {positive !== undefined && (
                <p className={`text-[10px] font-bold ${positive ? 'text-[#8A9A5B]' : 'text-[#DEB587]'}`}>
                    {positive ? 'Fluxo Positivo' : 'Fluxo Negativo'}
                </p>
            )}
        </div>
    </div>
);

const DFCRow = ({ label, value, type }: any) => (
    <div className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-xl transition-all">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-3">
            <span className={`text-sm font-black ${type === 'in' ? 'text-[#8A9A5B]' : 'text-[#DEB587]'}`}>
                {type === 'in' ? '+' : '-'} R$ {(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {type === 'in' ? <ArrowUpRight size={14} className="text-[#8A9A5B]" /> : <ArrowDownRight size={14} className="text-[#DEB587]" />}
        </div>
    </div>
);

export default DFCPage;
