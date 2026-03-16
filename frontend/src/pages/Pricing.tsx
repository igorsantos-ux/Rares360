import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Calculator, 
    Plus, 
    Trash2, 
    Edit2,
    Search, 
    TrendingDown, 
    TrendingUp, 
    AlertTriangle,
    Loader2,
    Clock
} from 'lucide-react';
import { pricingApi } from '../services/api';
import toast from 'react-hot-toast';
import { ProcedurePricingSheet } from '../components/Pricing/ProcedurePricingSheet';
import DateFilter from '../components/DateFilter';

const Pricing = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState<any>(null);

    // Estados para Filtro de Data
    const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: procedures = [], isLoading } = useQuery({
        queryKey: ['pricing-diagnosis', selectedPeriod, customStartDate, customEndDate],
        queryFn: async () => {
            const response = await pricingApi.getDiagnosis({
                startDate: selectedPeriod === 'Personalizado' ? customStartDate : undefined,
                endDate: selectedPeriod === 'Personalizado' ? customEndDate : undefined
            });
            return response.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => pricingApi.deleteProcedure(id),
        onSuccess: () => {
            toast.success('Procedimento removido');
            queryClient.invalidateQueries({ queryKey: ['pricing-diagnosis'] });
        },
        onError: () => toast.error('Erro ao remover procedimento')
    });

    // Filtros e Cálculos de KPI localmente
    const filteredProcedures = procedures.filter((p: any) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: procedures.length,
        critical: procedures.filter((p: any) => p.currentMargin < 20).length,
        ideal: procedures.filter((p: any) => p.currentMargin >= 40).length
    };

    const handleEdit = (proc: any) => {
        setSelectedProcedure(proc);
        setIsSheetOpen(true);
    };

    const handleNew = () => {
        setSelectedProcedure(null);
        setIsSheetOpen(true);
    };

    const getMarginBadge = (margin: number) => {
        if (margin < 20) return { 
            color: 'bg-red-50 text-red-600 border-red-100', 
            label: 'Crítica',
            icon: <TrendingDown size={12} />
        };
        if (margin < 40) return { 
            color: 'bg-amber-50 text-amber-600 border-amber-100', 
            label: 'Alerta',
            icon: <AlertTriangle size={12} />
        };
        return { 
            color: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
            label: 'Ideal',
            icon: <TrendingUp size={12} />
        };
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Analisando margens da clínica...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Diagnóstico de Precificação</h2>
                    <p className="text-slate-500 font-medium mt-1">Análise comparativa de margens e lucro real por procedimento.</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateFilter 
                        selectedPeriod={selectedPeriod}
                        setSelectedPeriod={setSelectedPeriod}
                        customStartDate={customStartDate}
                        setCustomStartDate={setCustomStartDate}
                        customEndDate={customEndDate}
                        setCustomEndDate={setCustomEndDate}
                        onApply={() => queryClient.invalidateQueries({ queryKey: ['pricing-diagnosis'] })}
                    />
                    <button 
                        onClick={handleNew}
                        className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all w-fit"
                    >
                        <Plus size={20} />
                        Novo Procedimento
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Procedimentos Cadastrados" 
                    value={stats.total} 
                    icon={<Calculator size={20} />} 
                    trend="Base de dados ativa"
                />
                <StatCard 
                    title="Margem Crítica (<20%)" 
                    value={stats.critical} 
                    icon={<AlertTriangle size={20} />} 
                    trend="Urgência de revisão"
                    color="text-red-500"
                    bgColor="bg-red-50"
                />
                <StatCard 
                    title="Margem Ideal (>40%)" 
                    value={stats.ideal} 
                    icon={<TrendingUp size={20} />} 
                    trend="Excelente rentabilidade"
                    color="text-emerald-500"
                    bgColor="bg-emerald-50"
                />
            </div>

            {/* Tabela de Diagnóstico */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar procedimento..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Procedimento</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tempo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Total</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Atual</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Margem Real</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#8A9A5B] uppercase tracking-widest bg-[#8A9A5B]/5">Preço Sugerido</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8A9A5B]/5">
                            {filteredProcedures.map((proc: any) => {
                                const badge = getMarginBadge(proc.currentMargin);
                                return (
                                    <tr key={proc.id} className="hover:bg-[#8A9A5B]/5 transition-colors group">
                                        <td className="px-8 py-6 font-black text-slate-700 text-sm">
                                            {proc.name}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                                                <Clock size={12} />
                                                {proc.durationMinutes} min
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-600">
                                            R$ {proc.totalCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-slate-800">
                                            R$ {proc.currentPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${badge.color}`}>
                                                {badge.icon}
                                                {proc.currentMargin?.toFixed(1)}% {badge.label}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 bg-[#8A9A5B]/5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[#697D58]">
                                                    R$ {proc.suggestedPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[9px] text-[#8A9A5B] font-bold uppercase tracking-tight">
                                                    Alvo: {proc.targetMargin}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(proc)}
                                                    className="p-2.5 bg-white rounded-xl shadow-sm border border-[#8A9A5B]/10 text-slate-400 hover:text-[#8A9A5B] hover:border-[#8A9A5B]/30 transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (confirm('Deseja remover este diagnóstico?')) {
                                                            deleteMutation.mutate(proc.id);
                                                        }
                                                    }}
                                                    className="p-2.5 bg-white rounded-xl shadow-sm border border-red-100 text-red-300 hover:text-red-500 hover:border-red-200 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredProcedures.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Calculator size={48} className="text-slate-200" />
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest text-center">
                            Nenhum diagnóstico de procedimento encontrado
                        </p>
                    </div>
                )}
            </div>

            <ProcedurePricingSheet 
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSave={() => queryClient.invalidateQueries({ queryKey: ['pricing-diagnosis'] })}
                procedure={selectedProcedure}
            />
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, color = "text-[#8A9A5B]", bgColor = "bg-[#8A9A5B]/10" }: any) => (
    <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
        <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h5 className="text-2xl font-black text-[#1A202C]">{value}</h5>
            <p className="text-[10px] text-[#697D58] font-black uppercase tracking-tight">{trend}</p>
        </div>
    </div>
);

export default Pricing;
