import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../services/api';
import {
    Brain,
    ShoppingCart,
    AlertTriangle,
    CheckCircle2,
    Package,
    Loader2,
    TrendingDown,
    DollarSign,
    Clock,
    Search,
    Download,
    Minus
} from 'lucide-react';
import { motion } from 'framer-motion';

const PurchaseIntelligence = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPRAR' | 'OK' | 'SEM_CONSUMO'>('ALL');

    const { data, isLoading, error } = useQuery({
        queryKey: ['pge'],
        queryFn: () => inventoryApi.getPGE().then(res => res.data),
    });

    const items = data?.items || [];
    const kpis = data?.kpis || { totalItems: 0, criticalItems: 0, noConsumptionItems: 0, estimatedCost: 0 };

    const filteredItems = items.filter((item: any) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || item.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const handleExportCSV = () => {
        if (filteredItems.length === 0) return;
        const headers = ['Produto', 'Código', 'Categoria', 'Estoque', 'Consumo Médio/dia', 'Dias Restantes', 'Previsão Fim', 'Status', 'Qtd Compra', 'Custo Estimado'];
        const rows = filteredItems.map((item: any) => [
            item.name,
            item.code || '-',
            item.category,
            item.currentStock,
            item.consumoMedio,
            item.diasRestantes ?? '-',
            item.dataRuptura ? new Date(item.dataRuptura).toLocaleDateString('pt-BR') : '-',
            item.status,
            item.qtdCompra,
            (item.qtdCompra * item.unitCost).toFixed(2)
        ]);
        const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pge_inteligencia_compras_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={40} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Calculando inteligência de estoque...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <AlertTriangle className="text-red-400" size={40} />
                <p className="text-slate-500 font-bold text-sm">Erro ao carregar dados PGE.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#8A9A5B] to-[#697D58] rounded-2xl text-white shadow-lg">
                            <Brain size={28} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Inteligência de Compras</h2>
                            <p className="text-slate-500 font-medium mt-1">PGE — Previsão de Giro de Estoque</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-600 hover:bg-[#8A9A5B]/5 hover:border-[#8A9A5B]/30 hover:text-[#697D58] transition-all shadow-sm"
                >
                    <Download size={16} />
                    Exportar CSV
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPI
                    title="Itens Monitorados"
                    value={kpis.totalItems}
                    icon={<Package size={24} />}
                    color="bg-slate-50"
                    textColor="text-[#1A202C]"
                />
                <KPI
                    title="Alerta de Compra"
                    value={kpis.criticalItems}
                    icon={<AlertTriangle size={24} />}
                    color="bg-red-50"
                    textColor="text-red-600"
                    iconColor="text-red-500"
                />
                <KPI
                    title="Sem Consumo (30d)"
                    value={kpis.noConsumptionItems}
                    icon={<Minus size={24} />}
                    color="bg-amber-50"
                    textColor="text-amber-700"
                    iconColor="text-amber-500"
                />
                <KPI
                    title="Custo Estimado"
                    value={`R$ ${kpis.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign size={24} />}
                    color="bg-emerald-50"
                    textColor="text-emerald-700"
                    iconColor="text-emerald-500"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar produto, código ou categoria..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['ALL', 'COMPRAR', 'OK', 'SEM_CONSUMO'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filterStatus === status
                                    ? 'bg-[#8A9A5B] text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {status === 'ALL' ? 'Todos' : status === 'COMPRAR' ? '🔴 Comprar' : status === 'OK' ? '🟢 OK' : '⚪ Sem Consumo'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estoque</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Média/Dia</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[180px]">Cobertura</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Prev. Fim</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd Compra</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <Package size={32} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-sm font-bold text-slate-400">Nenhum produto encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item: any) => {
                                    const isCritical = item.status === 'COMPRAR' && item.diasRestantes !== null && item.diasRestantes <= item.leadTime;
                                    const coveragePercent = item.diasRestantes !== null
                                        ? Math.min((item.diasRestantes / item.desiredCoverage) * 100, 100)
                                        : 0;

                                    return (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`hover:bg-slate-50/50 transition-colors ${isCritical ? 'bg-red-50/50' : ''}`}
                                        >
                                            {/* Produto */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 text-sm truncate max-w-[200px]">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                        {item.code && `${item.code} • `}{item.category}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Estoque Atual */}
                                            <td className="px-4 py-4 text-center">
                                                <span className={`font-black text-base ${item.currentStock <= 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                                    {item.currentStock}
                                                </span>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.unit}</p>
                                            </td>

                                            {/* Média Diária */}
                                            <td className="px-4 py-4 text-center">
                                                {item.consumoMedio > 0 ? (
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {item.consumoMedio} <span className="text-[9px] text-slate-400">un/dia</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">—</span>
                                                )}
                                            </td>

                                            {/* Cobertura (Barra de Progresso) */}
                                            <td className="px-4 py-4">
                                                {item.diasRestantes !== null ? (
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className={`text-xs font-black ${item.diasRestantes <= item.leadTime ? 'text-red-500' :
                                                                    item.diasRestantes <= item.desiredCoverage * 0.5 ? 'text-amber-500' :
                                                                        'text-emerald-600'
                                                                }`}>
                                                                {item.diasRestantes} dias
                                                            </span>
                                                            <Clock size={12} className="text-slate-300" />
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${coveragePercent <= 25 ? 'bg-red-400' :
                                                                        coveragePercent <= 50 ? 'bg-amber-400' :
                                                                            'bg-emerald-400'
                                                                    }`}
                                                                style={{ width: `${Math.max(coveragePercent, 3)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Previsão de Fim */}
                                            <td className="px-4 py-4 text-center">
                                                {item.dataRuptura ? (
                                                    <span className={`text-xs font-black ${item.diasRestantes <= item.leadTime ? 'text-red-500' : 'text-slate-600'
                                                        }`}>
                                                        {new Date(item.dataRuptura).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-4 text-center">
                                                {item.status === 'COMPRAR' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider border border-red-100">
                                                        <TrendingDown size={12} />
                                                        Risco de Ruptura
                                                    </span>
                                                ) : item.status === 'OK' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                                                        <CheckCircle2 size={12} />
                                                        Estoque OK
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-wider border border-slate-100">
                                                        <Minus size={12} />
                                                        Sem Consumo
                                                    </span>
                                                )}
                                            </td>

                                            {/* Qtd Recomendada */}
                                            <td className="px-4 py-4 text-center">
                                                {item.qtdCompra > 0 ? (
                                                    <div>
                                                        <span className="text-lg font-black text-red-600">{item.qtdCompra}</span>
                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                            ≈ R$ {(item.qtdCompra * item.unitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Botão Ação */}
                                            <td className="px-4 py-4 text-right">
                                                {item.status === 'COMPRAR' ? (
                                                    <button className="flex items-center gap-1.5 ml-auto px-4 py-2.5 bg-gradient-to-r from-[#8A9A5B] to-[#697D58] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[#8A9A5B]/20 hover:scale-105 transition-all">
                                                        <ShoppingCart size={14} />
                                                        Gerar Pedido
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300">—</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Info */}
            <div className="flex items-center gap-3 p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                <Brain size={18} className="text-[#8A9A5B]" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Análise baseada nas saídas dos últimos 30 dias. Lead Time e Cobertura Desejada são configuráveis por produto. O custo estimado utiliza o valor unitário cadastrado.
                </p>
            </div>
        </div>
    );
};

const KPI = ({ title, value, icon, color, textColor, iconColor = 'text-[#8A9A5B]' }: any) => (
    <div className={`${color} p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300`}>
        <div className={`w-14 h-14 bg-white/80 rounded-2xl flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h5 className={`text-2xl font-black ${textColor}`}>{value}</h5>
        </div>
    </div>
);

export default PurchaseIntelligence;
