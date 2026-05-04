import { X, TrendingUp, Box, Package, Phone } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function ItemDetalhesDrawer({ item, onClose }: { item: any, onClose: () => void }) {
    if (!item) return null;

    // Mock para gráfico
    const dataMock = [
        { name: 'Dez', consumo: Math.max(0, item.giroMensal - 5) },
        { name: 'Jan', consumo: item.giroMensal + 2 },
        { name: 'Fev', consumo: item.giroMensal - 1 },
        { name: 'Mar', consumo: item.giroMensal + 4 },
        { name: 'Abr', consumo: item.giroMensal },
        { name: 'Mai', consumo: item.giroMensal + 1 },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded
                                ${item.classificacao === 'CRITICO' ? 'bg-red-100 text-red-600' : 
                                  item.classificacao === 'URGENTE' ? 'bg-orange-100 text-orange-600' :
                                  item.classificacao === 'ATENCAO' ? 'bg-amber-100 text-amber-600' : 
                                  'bg-slate-200 text-slate-500'}`}>
                                {item.classificacao} (Score: {item.scoreCriticidade})
                            </span>
                            {item.setor && (
                                <span className="px-2 py-1 bg-white border border-slate-200 text-slate-500 text-[9px] font-black uppercase rounded shadow-sm">
                                    {item.setor.nome}
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">{item.nome}</h2>
                        <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-1">
                            <Box size={14} /> Atual: {item.qtdAtual} / Mín: {item.qtdMinima}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-xl transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Resumo da Compra */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-3xl border border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Sugestão de Compra</h4>
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-4xl font-black text-[#8A9A5B]">{item.qtdSugerida}</span>
                                <span className="text-sm font-bold text-slate-500 ml-1">unidades</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Custo Unit: R$ {item.ultimoCusto.toFixed(2)}</p>
                                <p className="text-xl font-black text-slate-800">Total: R$ {item.investimentoEstimado.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico Consumo */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp size={14} /> Histórico de Consumo (6 meses)
                        </h4>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dataMock} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8A9A5B" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8A9A5B" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="consumo" stroke="#8A9A5B" strokeWidth={3} fillOpacity={1} fill="url(#colorConsumo)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Fornecedor */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Package size={14} /> Fornecedor Padrão
                        </h4>
                        {item.fornecedorPadrao ? (
                            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{item.fornecedorPadrao.nome}</p>
                                    <p className="text-xs text-slate-400 font-medium">Última compra: {item.ultimaCompra ? new Date(item.ultimaCompra).toLocaleDateString('pt-BR') : 'N/D'}</p>
                                </div>
                                <button className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                                    <Phone size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                                <p className="text-xs font-bold text-slate-400">Nenhum fornecedor vinculado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Fix */}
                <div className="p-6 border-t border-slate-100 bg-white">
                    <div className="grid grid-cols-2 gap-3">
                        <button className="py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
                            Ajustar Qtd
                        </button>
                        <button className="py-3 px-4 bg-[#8A9A5B] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                            Add ao Pedido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
