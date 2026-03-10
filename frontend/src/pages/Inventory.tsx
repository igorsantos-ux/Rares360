import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '../services/api';
import {
    Package,
    Search,
    AlertTriangle,
    Plus,
    Filter,
    ArrowUpDown,
    Download,
    MoreVertical,
    BarChart2,
    Loader2
} from 'lucide-react';

const Inventory = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['stock-items'],
        queryFn: () => coreApi.getStock()
    });

    const stockItems = response?.data || [];

    const stats = {
        totalItems: stockItems.length,
        lowStock: stockItems.filter((i: any) => i.currentStock <= i.minStock).length,
        totalValue: stockItems.reduce((acc: number, cur: any) => acc + (cur.currentStock * cur.averageCost), 0)
    };

    const filteredItems = stockItems.filter((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#697D58]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando estoque real...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Estoque de Insumos</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de materiais e suprimentos da clínica.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20} />
                        Novo Item
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                        <Download size={16} /> Exportar
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InventoryStatCard label="Total de Itens" value={stats.totalItems.toString()} icon={<Package size={20} />} />
                <InventoryStatCard label="Abaixo do Mínimo" value={stats.lowStock.toString()} icon={<AlertTriangle size={20} />} alert={stats.lowStock > 0} />
                <InventoryStatCard label="Valor em Estoque" value={`R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<BarChart2 size={20} />} />
            </div>

            {/* List */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar insumo ou categoria..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                        <Filter size={16} /> Filtro
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {filteredItems.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Package size={48} className="text-slate-200" />
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest text-center">
                                Nenhum material encontrado no estoque
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldos</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#8A9A5B]/5">
                                {filteredItems.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-black text-slate-700 text-sm">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SKU: {item.sku || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{item.category}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="text-center bg-white border border-[#8A9A5B]/5 rounded-xl px-4 py-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atual</p>
                                                    <p className={`text-lg font-black ${item.currentStock <= item.minStock ? 'text-[#DEB587]' : 'text-slate-700'}`}>{item.currentStock}</p>
                                                </div>
                                                <ArrowUpDown size={14} className="text-slate-300" />
                                                <div className="text-center text-slate-400">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Mín</p>
                                                    <p className="text-xs font-black">{item.minStock}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {item.currentStock <= item.minStock ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#DEB587]/10 text-[#DEB587] rounded-full text-[10px] font-black uppercase tracking-widest w-fit animate-pulse">
                                                    <AlertTriangle size={12} /> Reposição Necessária
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#8A9A5B]/10 text-[#697D58] rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
                                                    Abastecido
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-[#8A9A5B]">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const InventoryStatCard = ({ label, value, icon, alert }: any) => (
    <div className={`bg-white p-6 rounded-3xl border ${alert ? 'border-[#DEB587]/30 shadow-lg shadow-[#DEB587]/5' : 'border-[#8A9A5B]/10 shadow-sm'} flex items-center gap-5 group`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${alert ? 'bg-[#DEB587]/10 text-[#DEB587]' : 'bg-slate-50 text-[#8A9A5B]'
            }`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h5 className={`text-2xl font-black ${alert ? 'text-[#DEB587]' : 'text-[#1A202C]'}`}>{value}</h5>
        </div>
    </div>
);

export default Inventory;
