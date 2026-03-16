import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receivablesApi } from '../../services/api';
import { AccountReceivableSheet } from '../../components/Financial/AccountReceivableSheet';
import {
    ArrowUpCircle,
    AlertCircle,
    Plus,
    DollarSign,
    Loader2,
    Search,
    CheckCircle2,
    MoreVertical,
    Paperclip
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { DeleteConfirmationModal } from '../../components/Financial/DeleteConfirmationModal';
import DateFilter from '../../components/DateFilter';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip, 
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

const StatusBadge = ({ status, dueDate }: { status: string; dueDate: string | null }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = dueDate ? new Date(dueDate) : null;
    const normalizedDate = date ? new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) : null;

    const isOverdue = status !== 'RECEBIDO' && normalizedDate && normalizedDate < today;
    const currentStatus = isOverdue ? 'ATRASADO' : status;

    const styles: any = {
        'RECEBIDO': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'PENDENTE': 'bg-amber-100 text-amber-700 border-amber-200',
        'ATRASADO': 'bg-rose-100 text-rose-700 border-rose-200',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[currentStatus] || styles['PENDENTE']}`}>
            {currentStatus === 'ATRASADO' ? 'PENDÊNCIAS' : currentStatus}
        </span>
    );
};

const ProcedureDistributionChart = ({ data }: { data: any[] }) => {
    const COLORS = ['#8A9A5B', '#DEB587', '#E5A988', '#64748B', '#F43F5E', '#F59E0B', '#10B981'];

    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-white/50 rounded-[2.5rem] border border-dashed border-[#8A9A5B]/20">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dados analíticos insuficientes</p>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex flex-col items-center h-full min-h-[300px]">
            <h3 className="text-[10px] font-black text-[#697D58] uppercase tracking-[0.2em] mb-6">Distribuição por Procedimento</h3>
            <div className="w-full h-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '1.5rem', 
                                border: 'none', 
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                fontWeight: '900',
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                padding: '12px 16px'
                            }}
                            formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR')}`, 'Total']}
                        />
                        <Legend 
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            formatter={(value, entry: any) => (
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-2">
                                    {value}: {entry.payload.percentage}%
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const MonthlyEvolutionChart = ({ data }: { data: any[] }) => {
    const COLORS = ['#8A9A5B', '#DEB587', '#E5A988', '#64748B', '#F43F5E', '#F59E0B', '#10B981'];

    const procedures = useMemo(() => {
        try {
            const keys = new Set<string>();
            data.forEach(item => {
                Object.keys(item).forEach(key => {
                    if (key !== 'month') keys.add(key);
                });
            });
            return Array.from(keys);
        } catch {
            return [];
        }
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-white/50 rounded-[2.5rem] border border-dashed border-[#8A9A5B]/20">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sem dados para o comparativo mensal</p>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex flex-col h-full min-h-[300px]">
            <h3 className="text-[10px] font-black text-[#697D58] uppercase tracking-[0.2em] mb-6">Evolução Mensal (Faturamento)</h3>
            <div className="w-full h-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8A9A5B20" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }}
                            tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(0)+'k' : value}`}
                        />
                        <Tooltip 
                            cursor={{ fill: '#8A9A5B05' }}
                            contentStyle={{ 
                                borderRadius: '1.5rem', 
                                border: 'none', 
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                fontWeight: '900',
                                fontSize: '10px',
                                textTransform: 'uppercase'
                            }}
                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
                        {procedures.map((proc, index) => (
                            <Bar 
                                key={proc} 
                                dataKey={proc} 
                                stackId="a" 
                                fill={COLORS[index % COLORS.length]} 
                                radius={index === procedures.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, alert }: any) => (
    <div className={`bg-white p-6 rounded-3xl border ${alert ? 'border-[#DEB587]/30 shadow-lg shadow-[#DEB587]/5' : 'border-[#8A9A5B]/10 shadow-sm'} flex items-center gap-5 group transition-all hover:shadow-md`}>
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

const PendenciaisPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const itemsPerPage = 20;

    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });

    // Estados para Filtro de Data
    const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: receivablesResponse, isLoading } = useQuery({
        queryKey: ['receivables-list', currentPage, activeFilter, searchTerm, selectedPeriod, customStartDate, customEndDate],
        queryFn: () => receivablesApi.getReceivables({
            page: currentPage,
            limit: itemsPerPage,
            filter: activeFilter !== 'all' ? activeFilter : undefined,
            search: searchTerm,
            startDate: selectedPeriod === 'Personalizado' ? customStartDate : undefined,
            endDate: selectedPeriod === 'Personalizado' ? customEndDate : undefined
        }).then(res => res.data),
        staleTime: 60000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => receivablesApi.updateReceivableStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['receivables-list'] });
            toast.success('Status atualizado!');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => receivablesApi.deleteReceivable(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['receivables-list'] });
            toast.success('Excluído com sucesso!');
            setDeleteModal({ open: false, item: null });
        }
    });

    const summary = useMemo(() => ({
        totalPending: receivablesResponse?.summary?.totalPending ?? 0,
        totalOverdue: receivablesResponse?.summary?.totalOverdue ?? 0,
        totalReceived: receivablesResponse?.summary?.totalReceived ?? 0,
        procedureDistribution: receivablesResponse?.summary?.procedureDistribution ?? [],
        monthlyComparison: receivablesResponse?.summary?.monthlyComparison ?? []
    }), [receivablesResponse]);

    const handleSave = async (data: any) => {
        try {
            await receivablesApi.createReceivable(data);
            toast.success('Recebimento salvo!');
            queryClient.invalidateQueries({ queryKey: ['receivables-list'] });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao salvar');
        }
    };

    const formatDate = (dateStr: any) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.getUTCDate().toString().padStart(2, '0') + '/' + 
               (d.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + 
               d.getUTCFullYear();
    };

    const totalPages = receivablesResponse?.totalPages || 1;

    return (
        <div className="space-y-10 pb-12 animate-in fade-in duration-500">
            <Toaster position="top-right" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Contas a Receber (Pendências)</h2>
                    <p className="text-slate-500 font-medium mt-1">Acompanhamento de faturamento e pagamentos de clientes. (v1.1)</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateFilter 
                        selectedPeriod={selectedPeriod}
                        setSelectedPeriod={setSelectedPeriod}
                        customStartDate={customStartDate}
                        setCustomStartDate={setCustomStartDate}
                        customEndDate={customEndDate}
                        setCustomEndDate={setCustomEndDate}
                        onApply={() => queryClient.invalidateQueries({ queryKey: ['receivables-list'] })}
                    />
                    <button 
                        onClick={() => setIsSheetOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20} />
                        Novo Recebimento
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Total Pendente" 
                        value={`R$ ${summary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                        icon={<DollarSign size={20} />} 
                        color="moss" 
                    />
                    <StatCard 
                        title="Recebido no Mês" 
                        value={`R$ ${summary.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                        icon={<CheckCircle2 size={20} />} 
                        color="moss" 
                    />
                    <StatCard 
                        title="Pendências" 
                        value={`R$ ${summary.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                        icon={<AlertCircle size={20} />} 
                        color="dun" 
                        alert={summary.totalOverdue > 0} 
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <MonthlyEvolutionChart data={summary.monthlyComparison} />
                    </div>
                    <div className="lg:col-span-1">
                        <ProcedureDistributionChart data={summary.procedureDistribution} />
                    </div>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden py-2">
                <div className="p-6 border-b border-[#8A9A5B]/5 flex flex-col xl:flex-row md:items-center justify-between gap-6">
                    <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                        {[
                            { id: 'all', label: 'Todas' },
                            { id: 'overdue', label: 'Vencidas' },
                            { id: 'today', label: 'Hoje' },
                            { id: 'pending', label: 'Pendentes' },
                            { id: 'recebidos', label: 'Recebidas' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => { setActiveFilter(btn.id); setCurrentPage(1); }}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === btn.id ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400 hover:text-[#697D58]'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por descrição, paciente ou procedimento..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4 animate-pulse">
                        <Loader2 className="animate-spin text-[#8A9A5B]" size={32} />
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Carregando...</p>
                    </div>
                ) : (receivablesResponse?.items?.length || 0) === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest text-center">Nenhum recebimento encontrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição / Procedimento</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vencimento</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Valor</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#8A9A5B]/5">
                                {receivablesResponse.items.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#8A9A5B]/10 text-[#697D58] flex items-center justify-center">
                                                    <ArrowUpCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-700 text-sm leading-tight">{item.description}</p>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.procedureName || item.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-slate-600">{item.patient?.fullName || '-'}</td>
                                        <td className="px-8 py-6 text-xs font-bold text-slate-600 text-center">{formatDate(item.dueDate)}</td>
                                        <td className="px-8 py-6 text-sm font-black text-slate-800 text-center">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-8 py-6 text-center">
                                            <StatusBadge status={item.status} dueDate={item.dueDate} />
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 text-slate-400">
                                                {item.status !== 'RECEBIDO' && (
                                                    <button 
                                                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'RECEBIDO' })}
                                                        className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Dar Baixa (Receber)"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                )}
                                                {item.fileUrl && (
                                                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="p-2.5 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                        <Paperclip size={18} />
                                                    </a>
                                                )}
                                                <div className="relative group/menu">
                                                    <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all pointer-events-none group-hover/menu:pointer-events-auto">
                                                        <button 
                                                            onClick={() => setDeleteModal({ open: true, item })}
                                                            className="w-full text-left px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="p-6 bg-slate-50/50 border-t border-[#8A9A5B]/5 flex items-center justify-between gap-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Página <span className="text-[#697D58]">{currentPage}</span> de {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-4 py-2 bg-white border border-[#8A9A5B]/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-4 py-2 bg-white border border-[#8A9A5B]/10 rounded-xl text-xs font-black uppercase tracking-widest text-[#8A9A5B] hover:bg-[#8A9A5B]/5 disabled:opacity-30 transition-all"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AccountReceivableSheet 
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSave={handleSave}
            />

            <DeleteConfirmationModal 
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, item: null })}
                description={deleteModal.item?.description}
                onConfirmSingle={() => deleteMutation.mutate(deleteModal.item.id)}
            />
        </div>
    );
};

export default PendenciaisPage;
