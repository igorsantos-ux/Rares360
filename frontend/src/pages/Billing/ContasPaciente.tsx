/**
 * ContasPaciente.tsx — Lista de contas com KPIs e pagamento de parcelas
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contaPacienteApi } from '../../services/api';
import { toast, Toaster } from 'react-hot-toast';
import {
    Loader2, Search, FileText, DollarSign, AlertCircle, CheckCircle2, Eye, X, CreditCard
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    ABERTA: { label: 'Aberta', color: 'text-blue-600', bg: 'bg-blue-50' },
    PAGA: { label: 'Paga', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    CANCELADA: { label: 'Cancelada', color: 'text-red-500', bg: 'bg-red-50' },
};

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function ContasPaciente() {
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [detailId, setDetailId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: kpis } = useQuery({
        queryKey: ['contas-kpis'],
        queryFn: () => contaPacienteApi.kpis().then(r => r.data),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['contas-paciente', statusFilter],
        queryFn: () => contaPacienteApi.list({ status: statusFilter || undefined }).then(r => r.data),
    });

    const { data: detail } = useQuery({
        queryKey: ['conta-detalhe', detailId],
        queryFn: () => detailId ? contaPacienteApi.getById(detailId).then(r => r.data) : null,
        enabled: !!detailId,
    });

    const pagarMutation = useMutation({
        mutationFn: ({ contaId, parcelaId }: { contaId: string; parcelaId: string }) =>
            contaPacienteApi.pagarParcela(contaId, parcelaId),
        onSuccess: () => {
            toast.success('Parcela paga!');
            queryClient.invalidateQueries({ queryKey: ['contas-paciente'] });
            queryClient.invalidateQueries({ queryKey: ['contas-kpis'] });
            queryClient.invalidateQueries({ queryKey: ['conta-detalhe', detailId] });
        },
        onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao pagar parcela'),
    });

    const filteredItems = (data?.items || []).filter((c: any) =>
        !search || c.paciente?.fullName?.toLowerCase().includes(search.toLowerCase()) || c.numero.includes(search)
    );

    if (isLoading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#8A9A5B] animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 p-8 max-w-[1600px] mx-auto">
            <Toaster position="top-right" />

            <div>
                <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Contas de Pacientes</h2>
                <p className="text-slate-500 font-medium mt-1">Acompanhe parcelas, recebimentos e saldos devedores.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Abertas', value: kpis?.abertas || 0, sub: formatCurrency(kpis?.saldoAReceber || 0), icon: <FileText size={20} />, color: 'text-blue-500' },
                    { label: 'Recebido', value: formatCurrency(kpis?.totalRecebido || 0), icon: <DollarSign size={20} />, color: 'text-emerald-500' },
                    { label: 'Pagas', value: kpis?.pagas || 0, icon: <CheckCircle2 size={20} />, color: 'text-emerald-500' },
                    { label: 'Parcelas Vencidas', value: kpis?.parcelasVencidas || 0, icon: <AlertCircle size={20} />, color: 'text-red-500' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-[#8A9A5B]/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={kpi.color}>{kpi.icon}</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                        </div>
                        <h4 className="text-2xl font-black text-[#1A202C]">{kpi.value}</h4>
                        {kpi.sub && <p className="text-xs font-bold text-slate-400 mt-1">{kpi.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input placeholder="Buscar por paciente ou número..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#8A9A5B]/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['', 'ABERTA', 'PAGA', 'CANCELADA'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400'}`}
                        >{s || 'Todas'}</button>
                    ))}
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white/70 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Número</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Forma</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pago</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8A9A5B]/5">
                        {filteredItems.map((c: any) => {
                            const st = STATUS_MAP[c.status] || STATUS_MAP.ABERTA;
                            return (
                                <tr key={c.id} className="hover:bg-[#8A9A5B]/5 transition-colors group">
                                    <td className="px-6 py-4"><span className="font-black text-xs text-[#697D58]">{c.numero}</span></td>
                                    <td className="px-6 py-4"><span className="font-bold text-sm text-slate-700">{c.paciente?.fullName}</span></td>
                                    <td className="px-6 py-4 text-center"><span className="text-[10px] font-bold text-slate-400 uppercase">{c.formaPagamento?.nome}</span></td>
                                    <td className="px-6 py-4 text-right font-bold text-sm text-slate-700">{formatCurrency(Number(c.valorTotal))}</td>
                                    <td className="px-6 py-4 text-right font-bold text-sm text-emerald-600">{formatCurrency(Number(c.valorPago))}</td>
                                    <td className="px-6 py-4 text-right font-black text-sm text-red-500">{formatCurrency(Number(c.saldoDevedor))}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${st.bg} ${st.color}`}>{st.label}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setDetailId(c.id)}
                                            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-[#8A9A5B] transition-all opacity-0 group-hover:opacity-100">
                                            <Eye size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredItems.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <CreditCard className="text-slate-200" size={48} strokeWidth={1} />
                        <p className="text-slate-400 font-bold text-sm">Nenhuma conta encontrada</p>
                    </div>
                )}
            </div>

            {/* Modal Detalhes + Parcelas */}
            {detailId && detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 relative">
                        <button onClick={() => setDetailId(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                        <h3 className="text-2xl font-black text-[#697D58] mb-1">{detail.numero}</h3>
                        <p className="text-sm text-slate-500 font-bold mb-6">{detail.paciente?.fullName}</p>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
                                <p className="text-lg font-black text-slate-800">{formatCurrency(Number(detail.valorTotal))}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-emerald-500 uppercase">Pago</p>
                                <p className="text-lg font-black text-emerald-600">{formatCurrency(Number(detail.valorPago))}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl">
                                <p className="text-[10px] font-black text-red-400 uppercase">Saldo</p>
                                <p className="text-lg font-black text-red-500">{formatCurrency(Number(detail.saldoDevedor))}</p>
                            </div>
                        </div>

                        {/* Parcelas */}
                        <h4 className="font-black text-sm text-slate-600 uppercase tracking-widest mb-3">Parcelas</h4>
                        <div className="space-y-2 mb-6">
                            {detail.parcelasFinanc?.map((p: any) => (
                                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.pago ? 'bg-emerald-50/50 border-emerald-100' : new Date(p.vencimento) < new Date() ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-400">{p.numeroParcela}ª</span>
                                        <span className="text-xs font-bold text-slate-600">{new Date(p.vencimento).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-sm text-slate-700">{formatCurrency(Number(p.valorParcela))}</span>
                                        {p.pago ? (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[9px] font-black">PAGO</span>
                                        ) : (
                                            <button
                                                onClick={() => { if (confirm(`Confirmar pagamento da parcela ${p.numeroParcela}?`)) pagarMutation.mutate({ contaId: detail.id, parcelaId: p.id }); }}
                                                disabled={pagarMutation.isPending}
                                                className="px-3 py-1 bg-[#8A9A5B] text-white rounded-lg text-[10px] font-black hover:bg-[#697D58] transition-all disabled:opacity-50"
                                            >Pagar</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Procedimentos */}
                        <h4 className="font-black text-sm text-slate-600 uppercase tracking-widest mb-3">Procedimentos</h4>
                        <div className="space-y-2">
                            {detail.itens?.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-sm text-slate-700">{item.procedimento?.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{item.quantidade}x · Exec: {item.quantidadeExecutada}/{item.quantidade}</p>
                                    </div>
                                    <span className="font-black text-sm text-slate-700">{formatCurrency(Number(item.valorTotal))}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
