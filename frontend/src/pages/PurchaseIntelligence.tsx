/**
 * Inteligência de Compras Otimizada - Módulo Rares360
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inteligenciaComprasApi, setoresApi } from '../services/api';
import { toast, Toaster } from 'react-hot-toast';
import {
    Brain, Download, AlertTriangle, CheckCircle2,
    Loader2, Search, FileText, ShoppingCart, Box,
    HeartPulse, Sparkles, Coffee, SprayCan
} from 'lucide-react';
import ItemDetalhesDrawer from '../components/InteligenciaCompras/ItemDetalhesDrawer';

const ICONS_MAP: Record<string, any> = {
    HeartPulse, Sparkles, FileText, Coffee, SprayCan, Brain
};

export default function PurchaseIntelligence() {
    const [setorFilter, setSetorFilter] = useState<string | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const { data: inteligenciaData, isLoading: loadingInteligencia } = useQuery({
        queryKey: ['inteligencia-compras', setorFilter],
        queryFn: () => inteligenciaComprasApi.getPrioridade({ setorId: setorFilter }).then(r => r.data),
    });

    const { data: setores } = useQuery({
        queryKey: ['setores'],
        queryFn: () => setoresApi.list().then(r => r.data)
    });

    const handleExport = async (formato: 'PDF' | 'EXCEL') => {
        const promise = inteligenciaComprasApi.exportar({ formato, setorIds: setorFilter ? [setorFilter] : [] });
        toast.promise(promise, {
            loading: `Gerando ${formato}...`,
            success: (r) => r.data.message || 'Exportado com sucesso!',
            error: 'Erro ao exportar'
        });
    };

    if (loadingInteligencia) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={40} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Calculando prioridades...</p>
            </div>
        );
    }

    const { resumo, itens } = inteligenciaData || { resumo: {}, itens: [] };

    const filteredItems = itens.filter((item: any) =>
        !searchTerm || item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 p-8 max-w-[1600px] mx-auto relative">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#8A9A5B] to-[#697D58] rounded-2xl flex items-center justify-center shadow-lg shadow-[#8A9A5B]/20">
                        <Brain className="text-white" size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Prioridade de Compra</h2>
                        <p className="text-slate-500 font-medium mt-1">{resumo.totalItens || 0} itens precisam de reposição</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => handleExport('EXCEL')} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                        <Download size={14} /> Excel
                    </button>
                    <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <FileText size={14} /> PDF
                    </button>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-[2rem] border border-emerald-200">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Investimento Total</p>
                    <h4 className="text-3xl font-black text-emerald-800">
                        R$ {(resumo.investimentoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h4>
                    <p className="text-xs font-bold text-emerald-600/70 mt-1">para reposição completa</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-red-100 shadow-sm">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Críticos</p>
                    <h4 className="text-3xl font-black text-red-600">{resumo.distribuicaoCriticidade?.critico || 0}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">ruptura iminente</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Urgentes</p>
                    <h4 className="text-3xl font-black text-orange-500">{resumo.distribuicaoCriticidade?.urgente || 0}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">abaixo do mínimo</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Setores Afetados</p>
                    <h4 className="text-3xl font-black text-slate-700">{resumo.porSetor?.length || 0}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">com pendências</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col space-y-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        placeholder="Buscar produto..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none shadow-sm"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Chips de Setor */}
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setSetorFilter(undefined)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${!setorFilter ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        Todos ({resumo.totalItens || 0})
                    </button>
                    {setores?.map((s: any) => {
                        const Icon = ICONS_MAP[s.icone] || Box;
                        const count = resumo.porSetor?.find((ps: any) => ps.setorId === s.id)?.totalItens || 0;
                        const isSelected = setorFilter === s.id;
                        return (
                            <button 
                                key={s.id}
                                onClick={() => setSetorFilter(s.id)}
                                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all border ${isSelected ? 'shadow-md' : 'hover:bg-slate-50'}`}
                                style={{
                                    backgroundColor: isSelected ? s.cor : '#ffffff',
                                    color: isSelected ? '#ffffff' : s.cor,
                                    borderColor: isSelected ? s.cor : '#e2e8f0'
                                }}
                            >
                                <Icon size={14} /> {s.nome} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Lista Densa */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Atual / Mínimo</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Giro</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sugerido</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Investimento</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${
                                            item.classificacao === 'CRITICO' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                            item.classificacao === 'URGENTE' ? 'bg-orange-500' : 'bg-amber-400'
                                        }`} />
                                        <div>
                                            <span className="font-black text-slate-800 text-sm">{item.nome}</span>
                                            {item.setor && (
                                                <span className="ml-2 px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-slate-100 text-slate-500">
                                                    {item.setor.nome}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`font-black text-base ${item.qtdAtual <= 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                        {item.qtdAtual}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 ml-1">/ {item.qtdMinima}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <p className={`text-xs font-black ${item.diasAteRuptura <= 3 ? 'text-red-500' : 'text-slate-600'}`}>
                                        {item.diasAteRuptura <= 0 ? 'RUPTURA' : `${item.diasAteRuptura} dias`}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400">giro {item.giroMensal}/mês</p>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="text-lg font-black text-[#8A9A5B]">{item.qtdSugerida}</span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <p className="text-sm font-black text-slate-800">
                                        R$ {item.investimentoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400">R$ {item.ultimoCusto.toFixed(2)}/un</p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button 
                                        onClick={() => setSelectedItem(item)}
                                        className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase hover:text-[#8A9A5B] transition-all"
                                    >
                                        Detalhes
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredItems.length === 0 && (
                    <div className="py-20 flex flex-col items-center">
                        <CheckCircle2 size={48} className="text-emerald-200 mb-4" />
                        <h4 className="text-lg font-black text-slate-700">Tudo em dia!</h4>
                        <p className="text-sm font-bold text-slate-400">Nenhum item abaixo do mínimo.</p>
                    </div>
                )}
            </div>

            {/* Rodapé Fixo */}
            {filteredItems.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-slate-900 text-white rounded-3xl p-4 flex items-center justify-between shadow-2xl z-50">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                            <ShoppingCart size={18} className="text-slate-300" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{resumo.totalItens} itens selecionados</p>
                            <p className="text-lg font-black">Investimento Total: R$ {(resumo.investimentoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-[#8A9A5B] hover:bg-[#697D58] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                        Gerar Pedido de Compra
                    </button>
                </div>
            )}

            {/* Drawer de Detalhes */}
            {selectedItem && (
                <ItemDetalhesDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    );
}
