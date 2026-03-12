import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payablesApi } from '../../services/api';
import { AccountPayableSheet } from '../../components/Financial/AccountPayableSheet';
import {
    ArrowDownCircle,
    Calendar,
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
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip, 
    Legend 
} from 'recharts';

const StatusBadge = ({ status, dueDate }: { status: string; dueDate: string }) => {
    // Para comparação de status dinâmico (Atrasado), usamos a data atual no fuso do usuário
    // mas normalizada para 00:00:00 para comparar apenas o 'dia'.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Convertemos a data do banco (UTC 00:00) para um objeto Date.
    // Como o banco envia YYYY-MM-DDTHH:mm:ss.sssZ, o JS lê como UTC.
    // Para evitar que o fuso local subtraia horas (ex: 12/03 virar 11/03), 
    // criamos o objeto e ignoramos o fuso local na lógica de exibição/comparação.
    const date = dueDate ? new Date(dueDate) : new Date();
    
    // Se a data do banco é "2026-03-12T00:00:00Z", queremos compará-la como "12/03".
    // Criamos um objeto local representando o "Dia UTC" para comparar com o "Hoje Local".
    const normalizedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

    // Lógica dinâmica: Se não estiver Pago e o dia for anterior a hoje
    const isOverdue = status !== 'PAGO' && normalizedDate < today;
    const currentStatus = isOverdue ? 'ATRASADO' : status;

    const styles: any = {
        'PAGO': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'PENDENTE': 'bg-amber-100 text-amber-700 border-amber-200',
        'ATRASADO': 'bg-rose-100 text-rose-700 border-rose-200',
        'CANCELADO': 'bg-slate-100 text-slate-500 border-slate-200'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[currentStatus] || styles['PENDENTE']}`}>
            {currentStatus === 'PENDING' ? 'PENDENTE' : currentStatus}
        </span>
    );
};

const CostCenterChart = ({ data }: { data: any[] }) => {
    // Paleta Premium: Sage, Sand, Soft Orange, Slate, Rose, Amber
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
            <h3 className="text-[10px] font-black text-[#697D58] uppercase tracking-[0.2em] mb-6">Distribuição por Centro de Custo</h3>
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
                            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Total']}
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
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    // Estados para Paginação e Filtros
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const itemsPerPage = 20;

    // Estado para Modal de Exclusão
    const [deleteModal, setDeleteModal] = useState<{ 
        open: boolean; 
        item: any | null;
        isSeries: boolean;
    }>({ 
        open: false, 
        item: null,
        isSeries: false
    });

    // Mutação para atualizar status
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => payablesApi.updatePayableStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payables-list-v4'] });
            toast.success('Status atualizado com sucesso!');
        },
        onError: (err: any) => {
            toast.error('Erro ao atualizar status: ' + (err.response?.data?.message || err.message));
        }
    });

    // Mutação para excluir
    const deleteMutation = useMutation({
        mutationFn: ({ id, isSeries }: { id: string; isSeries: boolean }) => 
            isSeries ? payablesApi.deletePayableSeries(id) : payablesApi.deletePayable(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payables-list-v4'] });
            toast.success('Exclusão realizada com sucesso!');
            setDeleteModal({ open: false, item: null, isSeries: false });
        },
        onError: (err: any) => {
            toast.error('Erro ao excluir: ' + (err.response?.data?.message || err.message));
        }
    });

    const { data: payablesResponse, isLoading } = useQuery({
        queryKey: ['payables-list-v4', currentPage, activeFilter, searchTerm],
        queryFn: async () => {
            const res = await payablesApi.getPayables({
                page: currentPage,
                limit: itemsPerPage,
                filter: activeFilter !== 'all' ? activeFilter : undefined,
                search: searchTerm
            });
            return res.data;
        },
        staleTime: 60000,
    });

    const payablesSummary = useMemo(() => {
        return {
            totalPending: payablesResponse?.summary?.totalPending ?? 0,
            totalOverdue: payablesResponse?.summary?.totalOverdue ?? 0,
            totalDueToday: payablesResponse?.summary?.totalDueToday ?? 0,
            costCenterDistribution: payablesResponse?.summary?.costCenterDistribution ?? []
        };
    }, [payablesResponse]);

    const displayPayables = useMemo(() => {
        try {
            const rawItems = Array.isArray(payablesResponse?.items) ? payablesResponse.items : [];
            
            // O backend agora já retorna parcelas individuais com accountPayable incluso
            return rawItems.map((inst: any) => {
                if (!inst) return null;
                const account = inst.accountPayable || {};
                const status = String(inst.status || 'PENDENTE').toUpperCase();
                
                return {
                    id: inst.id,
                    accountPayableId: account.id, // ID da conta pai
                    description: String(account.description || 'Despesa') + 
                        (account.isInstallment ? ` (Parcela ${inst.installmentNumber}/${account.installmentsCount})` : ''),
                    category: String(account.documentNumber ? `NF: ${account.documentNumber}` : (account.supplierName ? `${account.supplierName}` : 'Despesa')),
                    amount: Number(inst.amount || 0),
                    date: inst.dueDate || new Date().toISOString(),
                    dueDate: inst.dueDate, // Mantemos o campo original para o StatusBadge
                    status: status === 'PENDING' ? 'PENDENTE' : status,
                    fileUrl: account.fileUrl, 
                    supplierName: account.supplierName,
                    costCenter: account.costCenter,
                    costType: account.costType,
                    isInstallment: account.isInstallment
                };
            }).filter(Boolean);
        } catch (error) {
            console.error('❌ Error mapping payables:', error);
            return [];
        }
    }, [payablesResponse]);

    const handleSaveAccount = async (data: any) => {
        try {
            await payablesApi.createPayable(data);
            toast.success('Conta salva com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['payables-list-v4'] });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao salvar conta');
        }
    };

    const formatDateSafe = (dateStr: any) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'Data Inválida';
            // Ignoramos fuso local e usamos UTC para garantir que o 'Dia' lido seja o 'Dia' salvo.
            return d.getUTCDate().toString().padStart(2, '0') + '/' + 
                   (d.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + 
                   d.getUTCFullYear();
        } catch {
            return 'Data Inválida';
        }
    };

    const totalPages = payablesResponse?.totalPages || 1;

    // Loader SPA amigável: Não bloqueia a tela inteira se já temos dados (isFetching)
    const showSkeleton = isLoading && !payablesResponse;

    return (
        <div className="space-y-10 pb-12 animate-in fade-in duration-500">
            <Toaster position="top-right" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Contas a Pagar</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de fornecedores e compromissos financeiros.</p>
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

            {/* Dashboard Analítico Superior */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Métricas Principais */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <StatCard 
                        title="Total Pendente" 
                        value={`R$ ${Number(payablesSummary.totalPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                        icon={<DollarSign size={20} />} 
                        color="moss" 
                    />
                    <StatCard 
                        title="Vencendo Hoje" 
                        value={`R$ ${Number(payablesSummary.totalDueToday).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                        icon={<Calendar size={20} />} 
                        color="moss" 
                    />
                    <StatCard 
                        title="Atrasados" 
                        value={`R$ ${Number(payablesSummary.totalOverdue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                        icon={<AlertCircle size={20} />} 
                        color="dun" 
                        alert={payablesSummary.totalOverdue > 0} 
                    />
                </div>

                {/* Gráfico de Distribuição */}
                <CostCenterChart data={payablesSummary.costCenterDistribution || []} />
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden py-2">
                <div className="p-6 border-b border-[#8A9A5B]/5 flex flex-col xl:flex-row md:items-center justify-between gap-6">
                    {/* Filtros de Vencimento */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                        {[
                            { id: 'all', label: 'Todas' },
                            { id: 'overdue', label: 'Vencidas' },
                            { id: 'today', label: 'Hoje' },
                            { id: 'upcoming', label: 'A Vencer' },
                            { id: 'pagas', label: 'Pagas' }
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
                            placeholder="Buscar por descrição ou fornecedor..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                {showSkeleton ? (
                    <div className="py-20 flex flex-col items-center gap-4 animate-pulse">
                        <Loader2 className="animate-spin text-[#8A9A5B]" size={32} />
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Carregando dados...</p>
                    </div>
                ) : displayPayables.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <CheckCircle2 className="text-slate-300" size={32} />
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma conta encontrada</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição / Custo</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vencimento</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Valor</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#8A9A5B]/5">
                                {displayPayables.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    (item.status === 'ATRASADO' || (item.status !== 'PAGO' && new Date(item.dueDate) < new Date(new Date().setHours(0,0,0,0)))) 
                                                    ? 'bg-[#DEB587]/20 text-[#DEB587]' 
                                                    : 'bg-[#8A9A5B]/10 text-[#697D58]'
                                                }`}>
                                                    <ArrowDownCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-700 text-sm leading-tight">{item.description}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</span>
                                                       {(item.costCenter || item.costType) && (
                                                           <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">
                                                               {item.costCenter || 'Geral'} • {item.costType || 'Variável'}
                                                           </span>
                                                       )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-slate-600">{item.supplierName || '-'}</td>
                                        <td className="px-8 py-6 text-xs font-bold text-slate-600 text-center">{formatDateSafe(item.date)}</td>
                                        <td className="px-8 py-6 text-sm font-black text-slate-800 text-center">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-8 py-6 text-center">
                                            <StatusBadge status={item.status} dueDate={item.dueDate} />
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Ação Rápida: Dar Baixa (Check) - Agora posicionado primeiro */}
                                                {item.status !== 'PAGO' && (
                                                    <button 
                                                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'PAGO' })}
                                                        disabled={updateStatusMutation.isPending}
                                                        className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-30 border border-transparent hover:border-emerald-100"
                                                        title="Marcar como Pago"
                                                    >
                                                        {updateStatusMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                                    </button>
                                                )}

                                                {/* Ação Rápida: Visualizar Anexo (Clipe de Papel) */}
                                                {item.fileUrl && (
                                                    <a 
                                                        href={item.fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Visualizar Anexo"
                                                    >
                                                        <Paperclip size={18} />
                                                    </a>
                                                )}
                                                
                                                <div className="relative group/menu">
                                                    <button className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                    
                                                    {/* Custom DropdownMenu */}
                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all pointer-events-none group-hover/menu:pointer-events-auto">
                                                        {item.status !== 'PAGO' && (
                                                            <button 
                                                                onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'PAGO' })}
                                                                className="w-full text-left px-5 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                            >
                                                                Marcar como Pago
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => setDeleteModal({ open: true, item, isSeries: false })}
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

            <AccountPayableSheet 
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSave={handleSaveAccount}
            />

            <DeleteConfirmationModal 
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, item: null, isSeries: false })}
                description={deleteModal.item?.description}
                isInstallment={deleteModal.item?.isInstallment}
                isDeleting={deleteMutation.isPending}
                onConfirmSingle={() => deleteMutation.mutate({ id: deleteModal.item.id, isSeries: false })}
                onConfirmSeries={() => deleteMutation.mutate({ id: deleteModal.item.accountPayableId, isSeries: true })}
            />
        </div>
    );
};

export default PayablesPage;
