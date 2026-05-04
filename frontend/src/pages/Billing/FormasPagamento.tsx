/**
 * FormasPagamento — Página CRUD completa de formas de pagamento
 * Inclui: tabela, modal de criação/edição, calculadora ao vivo, switch ativar/desativar
 */
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { formaPagamentoApi } from '../../services/api';
import { useFormaPagamentoCalculo } from '../../hooks/useFormaPagamentoCalculo';
import { toast, Toaster } from 'react-hot-toast';
import {
    Plus, CreditCard, Loader2, Trash2, Edit3, Calculator, ToggleLeft, ToggleRight, X
} from 'lucide-react';

const TIPOS = [
    { value: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
    { value: 'PIX', label: 'PIX', icon: '⚡' },
    { value: 'CREDITO', label: 'Crédito', icon: '💳' },
    { value: 'DEBITO', label: 'Débito', icon: '🏦' },
    { value: 'BOLETO', label: 'Boleto', icon: '📄' },
];

const defaultForm = {
    nome: '', tipo: 'PIX', taxaPercentual: 0, taxaFixa: 0, taxaAntecipacao: 0,
    prazoRecebimento: 0, permiteParcelamento: false, parcelasMaximas: 1,
    taxaPorParcela: {} as Record<string, number>, ordem: 0
};

export default function FormasPagamento() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm);
    const [calcValor, setCalcValor] = useState(1000);
    const [calcParcelas, setCalcParcelas] = useState(1);
    const [calcFormaId, setCalcFormaId] = useState('');

    const queryClient = useQueryClient();
    const { resultado, loading: calcLoading, calcular } = useFormaPagamentoCalculo();

    const { data: formas, isLoading } = useQuery({
        queryKey: ['formas-pagamento'],
        queryFn: () => formaPagamentoApi.list().then(r => r.data),
    });

    const saveMutation = useMutation({
        mutationFn: (data: any) => editingId
            ? formaPagamentoApi.update(editingId, data)
            : formaPagamentoApi.create(data),
        onSuccess: () => {
            toast.success(editingId ? 'Forma atualizada!' : 'Forma criada!');
            queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
            closeModal();
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao salvar'),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
            formaPagamentoApi.update(id, { ativo }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
            toast.success('Status atualizado');
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao atualizar status'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => formaPagamentoApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
            toast.success('Forma removida');
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao remover'),
    });

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setForm(defaultForm);
    };

    const openEdit = (f: any) => {
        setEditingId(f.id);
        setForm({
            nome: f.nome, tipo: f.tipo,
            taxaPercentual: Number(f.taxaPercentual), taxaFixa: Number(f.taxaFixa),
            taxaAntecipacao: Number(f.taxaAntecipacao), prazoRecebimento: f.prazoRecebimento,
            permiteParcelamento: f.permiteParcelamento, parcelasMaximas: f.parcelasMaximas,
            taxaPorParcela: f.taxaPorParcela || {}, ordem: f.ordem,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(form);
    };

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    if (isLoading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#8A9A5B] animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 p-8 max-w-[1400px] mx-auto">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Formas de Pagamento</h2>
                    <p className="text-slate-500 font-medium mt-1">Gerencie formas de recebimento, taxas e parcelamentos.</p>
                </div>
                <button
                    onClick={() => { setForm(defaultForm); setEditingId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all w-fit"
                >
                    <Plus size={20} /> Nova Forma
                </button>
            </div>

            {/* KPIs rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-[#8A9A5B]/10 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cadastradas</p>
                    <h4 className="text-3xl font-black text-[#1A202C] mt-2">{formas?.length || 0}</h4>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-[#8A9A5B]/10 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativas</p>
                    <h4 className="text-3xl font-black text-emerald-600 mt-2">{formas?.filter((f: any) => f.ativo).length || 0}</h4>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-[#8A9A5B]/10 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Com Parcelamento</p>
                    <h4 className="text-3xl font-black text-blue-600 mt-2">{formas?.filter((f: any) => f.permiteParcelamento).length || 0}</h4>
                </div>
            </div>

            {/* Calculadora ao vivo */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#DEB587]/20 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-[#DEB587]/10 rounded-xl text-[#DEB587]"><Calculator size={20} /></div>
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800">Calculadora de Taxas</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Simule quanto a clínica recebe</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                            value={calcFormaId}
                            onChange={e => { setCalcFormaId(e.target.value); calcular(e.target.value, calcValor, calcParcelas); }}
                        >
                            <option value="">Selecione...</option>
                            {formas?.filter((f: any) => f.ativo).map((f: any) => (
                                <option key={f.id} value={f.id}>{f.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor (R$)</label>
                        <input
                            type="number" step="0.01" min="0"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                            value={calcValor}
                            onChange={e => { const v = Number(e.target.value); setCalcValor(v); calcular(calcFormaId, v, calcParcelas); }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parcelas</label>
                        <input
                            type="number" min="1" max="24"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                            value={calcParcelas}
                            onChange={e => { const p = Number(e.target.value); setCalcParcelas(p); calcular(calcFormaId, calcValor, p); }}
                        />
                    </div>
                    <div>
                        {calcLoading ? (
                            <Loader2 className="animate-spin text-[#DEB587]" size={20} />
                        ) : resultado ? (
                            <div className="bg-[#8A9A5B]/10 p-4 rounded-2xl space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 font-bold">Taxas:</span>
                                    <span className="font-black text-red-500">-{formatCurrency(resultado.taxas.total)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 font-bold">Parcela:</span>
                                    <span className="font-black text-slate-700">{formatCurrency(resultado.valorParcela)}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-[#8A9A5B]/20 pt-1 mt-1">
                                    <span className="font-bold text-[#697D58]">Líquido:</span>
                                    <span className="font-black text-[#3B6D11] text-lg">{formatCurrency(resultado.valorLiquido)}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 font-bold">Selecione uma forma e valor</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Taxa %</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Taxa Fixa</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Antecipação</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Prazo</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Parcelamento</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8A9A5B]/5">
                            {formas?.map((f: any) => {
                                const tipoInfo = TIPOS.find(t => t.value === f.tipo);
                                return (
                                    <tr key={f.id} className="hover:bg-[#8A9A5B]/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">
                                                    {tipoInfo?.icon || '💳'}
                                                </div>
                                                <span className="font-black text-slate-700 text-sm">{f.nome}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                {tipoInfo?.label || f.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center text-xs font-bold text-slate-600">{Number(f.taxaPercentual)}%</td>
                                        <td className="px-6 py-5 text-center text-xs font-bold text-slate-600">{formatCurrency(Number(f.taxaFixa))}</td>
                                        <td className="px-6 py-5 text-center text-xs font-bold text-slate-600">{Number(f.taxaAntecipacao)}%</td>
                                        <td className="px-6 py-5 text-center text-xs font-bold text-slate-600">{f.prazoRecebimento}d</td>
                                        <td className="px-6 py-5 text-center">
                                            {f.permiteParcelamento ? (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black">
                                                    até {f.parcelasMaximas}x
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={() => toggleMutation.mutate({ id: f.id, ativo: !f.ativo })}
                                                className="transition-all hover:scale-110"
                                                title={f.ativo ? 'Desativar' : 'Ativar'}
                                            >
                                                {f.ativo ? (
                                                    <ToggleRight size={24} className="text-emerald-500" />
                                                ) : (
                                                    <ToggleLeft size={24} className="text-slate-300" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(f)}
                                                    className="p-2 bg-white rounded-xl shadow-sm border border-[#8A9A5B]/10 text-[#8A9A5B] hover:bg-[#8A9A5B] hover:text-white transition-all"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm('Excluir esta forma de pagamento?')) deleteMutation.mutate(f.id); }}
                                                    className="p-2 bg-white rounded-xl shadow-sm border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {(!formas || formas.length === 0) && (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <CreditCard className="text-slate-200" size={48} strokeWidth={1} />
                            <p className="text-slate-400 font-bold text-sm">Nenhuma forma de pagamento cadastrada</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 relative">
                        <button onClick={closeModal} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-black text-[#697D58] mb-6">
                            {editingId ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome *</label>
                                    <input
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm focus:ring-2 focus:ring-[#8A9A5B]/30 outline-none"
                                        value={form.nome}
                                        onChange={e => setForm({ ...form, nome: e.target.value })}
                                        placeholder="Ex: Crédito Rede"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo *</label>
                                    <select
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                        value={form.tipo}
                                        onChange={e => setForm({ ...form, tipo: e.target.value })}
                                    >
                                        {TIPOS.map(t => (
                                            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa %</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                        value={form.taxaPercentual}
                                        onChange={e => setForm({ ...form, taxaPercentual: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa Fixa (R$)</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                        value={form.taxaFixa}
                                        onChange={e => setForm({ ...form, taxaFixa: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antecipação %</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                        value={form.taxaAntecipacao}
                                        onChange={e => setForm({ ...form, taxaAntecipacao: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Recebimento (dias)</label>
                                    <input
                                        type="number" min="0"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                        value={form.prazoRecebimento}
                                        onChange={e => setForm({ ...form, prazoRecebimento: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordem</label>
                                    <input
                                        type="number" min="0"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                        value={form.ordem}
                                        onChange={e => setForm({ ...form, ordem: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Parcelamento */}
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.permiteParcelamento}
                                        onChange={e => setForm({ ...form, permiteParcelamento: e.target.checked })}
                                        className="w-4 h-4 rounded text-[#8A9A5B]"
                                    />
                                    <span className="text-sm font-bold text-slate-700">Permite parcelamento</span>
                                </label>

                                {form.permiteParcelamento && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Máx. Parcelas</label>
                                            <input
                                                type="number" min="2" max="24"
                                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                                value={form.parcelasMaximas}
                                                onChange={e => setForm({ ...form, parcelasMaximas: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa por Parcela (%)</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {Array.from({ length: Math.min(form.parcelasMaximas - 1, 11) }, (_, i) => i + 2).map(n => (
                                                    <div key={n} className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-black text-slate-400 w-6">{n}x</span>
                                                        <input
                                                            type="number" step="0.01" min="0"
                                                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 font-bold text-xs"
                                                            value={form.taxaPorParcela[String(n)] || ''}
                                                            onChange={e => setForm({
                                                                ...form,
                                                                taxaPorParcela: { ...form.taxaPorParcela, [String(n)]: Number(e.target.value) }
                                                            })}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={saveMutation.isPending}
                                className="w-full py-3.5 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saveMutation.isPending ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Forma de Pagamento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
