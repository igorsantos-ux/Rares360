import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { configuracoesApi } from '../../services/api';
import { toast } from 'react-hot-toast';

export default function ComissoesTab() {
    const [regras, setRegras] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    // Form
    const [gatilho, setGatilho] = useState('VENDA');
    const [tipoValor, setTipoValor] = useState('PERCENTUAL');
    const [valor, setValor] = useState('');

    const loadRegras = async () => {
        try {
            setLoading(true);
            const { data } = await configuracoesApi.getRegrasComissao();
            setRegras(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRegras();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta regra?')) return;
        try {
            await configuracoesApi.deleteRegraComissao(id);
            toast.success('Regra excluída');
            loadRegras();
        } catch (error) {
            toast.error('Erro ao excluir');
        }
    };

    const handleCreate = async () => {
        if (!valor) return toast.error('Preencha o valor');
        try {
            await configuracoesApi.createRegraComissao({
                gatilho,
                tipoValor,
                valor: Number(valor)
            });
            toast.success('Regra criada com sucesso');
            setOpenDialog(false);
            loadRegras();
        } catch (error) {
            toast.error('Erro ao criar regra');
        }
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#DEB587]/20 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="font-extrabold text-xl text-slate-800">Comissões da Equipe</h3>
                    <p className="text-sm font-bold text-slate-400">Gerencie as regras de comissão para fechamento de orçamentos e vendas.</p>
                </div>
                <button 
                    onClick={() => setOpenDialog(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all w-fit"
                >
                    <Plus size={20} /> Nova Regra
                </button>
            </div>

            <div className="bg-slate-50/50 rounded-[2rem] border border-[#8A9A5B]/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-100/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Escopo</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gatilho</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-8"><div className="w-6 h-6 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                        ) : regras.length === 0 ? (
                            <tr><td colSpan={4} className="text-center text-slate-400 py-8 font-bold">Nenhuma regra cadastrada.</td></tr>
                        ) : regras.map(r => (
                            <tr key={r.id} className="hover:bg-white transition-colors group">
                                <td className="px-6 py-4 font-bold text-sm text-slate-700">
                                    {r.userId ? `Usuário: ${r.user?.name}` : r.procedimentoId ? `Procedimento: ${r.procedimento?.name}` : r.categoriaId ? `Categoria: ${r.categoria?.nome}` : 'Regra Global (Todos)'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        {r.gatilho}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-black text-slate-700">
                                    {r.tipoValor === 'PERCENTUAL' ? `${r.valor}%` : `R$ ${r.valor}`}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(r.id)} 
                                        className="p-2 bg-white rounded-xl shadow-sm border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {openDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative">
                        <button onClick={() => setOpenDialog(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-black text-[#697D58] mb-6">Nova Regra de Comissão</h3>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gatilho</label>
                                <select 
                                    value={gatilho} 
                                    onChange={e => setGatilho(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                >
                                    <option value="VENDA">Venda (Aprovação de Orçamento)</option>
                                    <option value="META">Meta Batida</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Valor</label>
                                <select 
                                    value={tipoValor} 
                                    onChange={e => setTipoValor(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                >
                                    <option value="PERCENTUAL">Percentual (%)</option>
                                    <option value="FIXO">Valor Fixo (R$)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={valor} 
                                    onChange={e => setValor(e.target.value)} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm"
                                />
                            </div>
                            <button 
                                onClick={handleCreate}
                                className="w-full py-3.5 mt-2 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Salvar Regra
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
