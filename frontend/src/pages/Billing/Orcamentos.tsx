/**
 * Orcamentos.tsx — Lista de orçamentos com KPIs, filtros e ações rápidas
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orcamentoApi } from '../../services/api';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    Plus, FileText, Loader2, Search, Send, CheckCircle2, XCircle,
    TrendingUp, Clock, AlertTriangle, Eye
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    RASCUNHO: { label: 'Rascunho', color: 'text-slate-500', bg: 'bg-slate-100' },
    ENVIADO: { label: 'Enviado', color: 'text-blue-600', bg: 'bg-blue-50' },
    APROVADO: { label: 'Aprovado', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    REJEITADO: { label: 'Rejeitado', color: 'text-red-500', bg: 'bg-red-50' },
    EXPIRADO: { label: 'Expirado', color: 'text-amber-600', bg: 'bg-amber-50' },
    CONVERTIDO: { label: 'Convertido', color: 'text-purple-600', bg: 'bg-purple-50' },
};

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function Orcamentos() {
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: kpis } = useQuery({
        queryKey: ['orcamentos-kpis'],
        queryFn: () => orcamentoApi.kpis().then(r => r.data),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['orcamentos', statusFilter],
        queryFn: () => orcamentoApi.list({ status: statusFilter || undefined }).then(r => r.data),
    });

    const enviarMutation = useMutation({
        mutationFn: (id: string) => orcamentoApi.enviar(id),
        onSuccess: () => { toast.success('Orçamento enviado!'); queryClient.invalidateQueries({ queryKey: ['orcamentos'] }); queryClient.invalidateQueries({ queryKey: ['orcamentos-kpis'] }); },
        onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao enviar'),
    });

    const aprovarMutation = useMutation({
        mutationFn: (id: string) => orcamentoApi.aprovar(id),
        onSuccess: () => { toast.success('Orçamento aprovado! Contrato e conta gerados.'); queryClient.invalidateQueries({ queryKey: ['orcamentos'] }); queryClient.invalidateQueries({ queryKey: ['orcamentos-kpis'] }); },
        onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao aprovar'),
    });

    const rejeitarMutation = useMutation({
        mutationFn: (id: string) => orcamentoApi.rejeitar(id),
        onSuccess: () => { toast.success('Orçamento rejeitado.'); queryClient.invalidateQueries({ queryKey: ['orcamentos'] }); queryClient.invalidateQueries({ queryKey: ['orcamentos-kpis'] }); },
        onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao rejeitar'),
    });

    const filteredItems = (data?.items || []).filter((o: any) =>
        !search || o.paciente?.fullName?.toLowerCase().includes(search.toLowerCase()) || o.numero.includes(search)
    );

    if (isLoading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#8A9A5B] animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 p-8 max-w-[1600px] mx-auto">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Orçamentos</h2>
                    <p className="text-slate-500 font-medium mt-1">Gerencie propostas comerciais e acompanhe conversões.</p>
                </div>
                <button
                    onClick={() => navigate('/orcamentos/novo')}
                    className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all w-fit"
                >
                    <Plus size={20} /> Novo Orçamento
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: kpis?.total || 0, icon: <FileText size={20} />, color: 'text-slate-600' },
                    { label: 'Aguardando', value: (kpis?.rascunhos || 0) + (kpis?.enviados || 0), icon: <Clock size={20} />, color: 'text-blue-500' },
                    { label: 'Aprovados', value: kpis?.aprovados || 0, icon: <CheckCircle2 size={20} />, color: 'text-emerald-500' },
                    { label: 'Conversão', value: `${kpis?.taxaConversao || 0}%`, icon: <TrendingUp size={20} />, color: 'text-[#BA7517]' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-[#8A9A5B]/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`${kpi.color}`}>{kpi.icon}</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                        </div>
                        <h4 className="text-2xl font-black text-[#1A202C]">{kpi.value}</h4>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        placeholder="Buscar por paciente ou número..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#8A9A5B]/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none"
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['', 'RASCUNHO', 'ENVIADO', 'APROVADO', 'REJEITADO'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400'}`}
                        >{s || 'Todos'}</button>
                    ))}
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white/70 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Número</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Itens</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pagamento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8A9A5B]/5">
                            {filteredItems.map((orc: any) => {
                                const st = STATUS_MAP[orc.status] || STATUS_MAP.RASCUNHO;
                                return (
                                    <tr key={orc.id} className="hover:bg-[#8A9A5B]/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-black text-xs text-[#697D58]">{orc.numero}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm text-slate-700">{orc.paciente?.fullName}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-500">{orc._count?.itens || orc.itens?.length || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{orc.formaPagamento?.nome}</span>
                                            {orc.parcelas > 1 && <span className="text-[10px] text-blue-500 font-bold ml-1">{orc.parcelas}x</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-black text-sm text-slate-800">{formatCurrency(Number(orc.valorFinal))}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${st.bg} ${st.color}`}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => navigate(`/orcamentos/${orc.id}`)}
                                                    className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-[#8A9A5B] hover:border-[#8A9A5B]/30 transition-all" title="Detalhes">
                                                    <Eye size={14} />
                                                </button>
                                                {orc.status === 'RASCUNHO' && (
                                                    <button onClick={() => enviarMutation.mutate(orc.id)}
                                                        className="p-2 bg-blue-50 rounded-lg text-blue-500 hover:bg-blue-100 transition-all" title="Enviar">
                                                        <Send size={14} />
                                                    </button>
                                                )}
                                                {['RASCUNHO', 'ENVIADO'].includes(orc.status) && (
                                                    <>
                                                        <button onClick={() => { if (confirm('Aprovar orçamento? Será gerado contrato e conta.')) aprovarMutation.mutate(orc.id); }}
                                                            className="p-2 bg-emerald-50 rounded-lg text-emerald-500 hover:bg-emerald-100 transition-all" title="Aprovar">
                                                            <CheckCircle2 size={14} />
                                                        </button>
                                                        <button onClick={() => { if (confirm('Rejeitar orçamento?')) rejeitarMutation.mutate(orc.id); }}
                                                            className="p-2 bg-red-50 rounded-lg text-red-400 hover:bg-red-100 transition-all" title="Rejeitar">
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <FileText className="text-slate-200" size={48} strokeWidth={1} />
                            <p className="text-slate-400 font-bold text-sm">Nenhum orçamento encontrado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer KPI: Valor total aprovado */}
            {(kpis?.valorTotalAprovado || 0) > 0 && (
                <div className="bg-gradient-to-r from-[#8A9A5B]/10 to-[#DEB587]/10 p-6 rounded-[2rem] border border-[#8A9A5B]/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-[#BA7517]" />
                        <span className="text-sm font-bold text-slate-600">Total Aprovado no Período</span>
                    </div>
                    <span className="text-2xl font-black text-[#3B6D11]">{formatCurrency(kpis?.valorTotalAprovado)}</span>
                </div>
            )}
        </div>
    );
}
