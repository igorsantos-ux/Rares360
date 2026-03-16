import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    Loader2,
    Calendar,
    Truck,
    ArrowUpCircle,
    ArrowDownCircle,
    History,
    Clock
} from 'lucide-react';
import { InventorySheet } from '../components/Inventory/InventorySheet';
import { StockMovementModal } from '../components/Inventory/StockMovementModal';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'items' | 'history'>('items');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const { data: response, isLoading: isLoadingItems } = useQuery({
        queryKey: ['stock-items'],
        queryFn: () => coreApi.getStock()
    });

    const { data: historyResponse, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['stock-history'],
        queryFn: () => coreApi.getStockHistory(),
        enabled: activeTab === 'history'
    });

    const stockItems = Array.isArray(response?.data) ? response.data : [];
    const historyItems = Array.isArray(historyResponse?.data) ? historyResponse.data : [];

    const stats = {
        totalItems: stockItems.length,
        lowStock: stockItems.filter((i: any) => i.quantity <= i.minQuantity).length,
        totalValue: stockItems.reduce((acc: number, cur: any) => acc + (cur.quantity * (cur.unitCost || 0)), 0)
    };

    const filteredItems = stockItems.filter((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenSheet = (item?: any) => {
        setSelectedItem(item || null);
        setIsSheetOpen(true);
    };

    const handleOpenMovement = (type: 'ENTRADA' | 'SAIDA') => {
        setMovementType(type);
        setIsMovementModalOpen(true);
    };

    if (isLoadingItems && !stockItems.length) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#697D58]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando estoque real...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <InventorySheet 
                isOpen={isSheetOpen} 
                onClose={() => setIsSheetOpen(false)} 
                onSave={() => queryClient.invalidateQueries({ queryKey: ['stock-items'] })}
                item={selectedItem}
            />

            <StockMovementModal 
                isOpen={isMovementModalOpen}
                onClose={() => setIsMovementModalOpen(false)}
                stockItems={stockItems}
                initialType={movementType}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Estoque de Insumos</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de materiais e suprimentos da clínica.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleOpenMovement('ENTRADA')}
                        className="flex items-center gap-2 px-5 py-3 bg-green-50 text-green-700 border border-green-100 rounded-2xl font-bold text-sm hover:bg-green-100 transition-all shadow-sm"
                    >
                        <ArrowUpCircle size={18} />
                        Entrada
                    </button>
                    <button 
                        onClick={() => handleOpenMovement('SAIDA')}
                        className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all shadow-sm"
                    >
                        <ArrowDownCircle size={18} />
                        Saída
                    </button>
                    <button 
                        onClick={() => handleOpenSheet()}
                        className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all ml-2"
                    >
                        <Plus size={20} />
                        Novo Item
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InventoryStatCard label="Total de Itens" value={stats.totalItems.toString()} icon={<Package size={20} />} />
                <InventoryStatCard label="Abaixo do Mínimo" value={stats.lowStock.toString()} icon={<AlertTriangle size={20} />} alert={stats.lowStock > 0} />
                <InventoryStatCard label="Valor em Estoque" value={`R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<BarChart2 size={20} />} />
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-[2rem] w-full md:w-fit border border-[#8A9A5B]/10">
                <button
                    onClick={() => setActiveTab('items')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-sm font-black transition-all ${
                        activeTab === 'items' 
                        ? 'bg-[#8A9A5B] text-white shadow-xl shadow-[#8A9A5B]/20' 
                        : 'text-slate-500 hover:text-[#697D58]'
                    }`}
                >
                    <Package size={18} />
                    Lista de Itens
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-sm font-black transition-all ${
                        activeTab === 'history' 
                        ? 'bg-[#8A9A5B] text-white shadow-xl shadow-[#8A9A5B]/20' 
                        : 'text-slate-500 hover:text-[#697D58]'
                    }`}
                >
                    <History size={18} />
                    Histórico de Movimentações
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'items' ? (
                    <motion.div 
                        key="items"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]"
                    >
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
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                                    <Filter size={16} /> Filtro
                                </button>
                                <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                                    <Download size={16} /> Exportar
                                </button>
                            </div>
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
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria / Unid.</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldos</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rastreabilidade</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#8A9A5B]/5">
                                        {filteredItems.map((item: any) => {
                                            const isLowStock = item.quantity <= item.minQuantity;
                                            return (
                                                <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer" onClick={() => handleOpenSheet(item)}>
                                                    <td className="px-8 py-6">
                                                        <div>
                                                            <p className="font-black text-slate-700 text-sm">{item.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lote: {item.batch || '---'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-[#697D58] uppercase tracking-widest bg-[#8A9A5B]/10 px-3 py-1 rounded-full w-fit">{item.category}</span>
                                                            <span className="text-[9px] text-slate-400 font-black ml-2">{item.unit}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-center rounded-xl px-4 py-2 border transition-colors ${isLowStock ? 'bg-red-50 border-red-100' : 'bg-white border-[#8A9A5B]/5'}`}>
                                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isLowStock ? 'text-red-400' : 'text-slate-400'}`}>Atual</p>
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <p className={`text-lg font-black ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>{item.quantity}</p>
                                                                    {isLowStock && <AlertTriangle size={14} className="text-red-500" />}
                                                                </div>
                                                            </div>
                                                            <ArrowUpDown size={14} className="text-slate-300" />
                                                            <div className="text-center text-slate-400">
                                                                <p className="text-[10px] font-bold uppercase tracking-widest">Mín</p>
                                                                <p className="text-xs font-black">{item.minQuantity}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {item.expirationDate ? (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                                    <Calendar size={12} className="text-[#8A9A5B]" />
                                                                    {new Date(item.expirationDate).toLocaleDateString()}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300 font-bold uppercase">Sem expiração</span>
                                                            )}
                                                            {item.supplier && (
                                                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium">
                                                                    <Truck size={10} /> {item.supplier}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-[#8A9A5B]">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]"
                    >
                        <div className="p-8 border-b border-[#8A9A5B]/5">
                            <h4 className="text-lg font-black text-slate-700">Últimas Movimentações</h4>
                            <p className="text-xs text-slate-400 font-medium">Registro de auditoria de consumo e abastecimento.</p>
                        </div>

                        <div className="overflow-x-auto">
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-[#8A9A5B]" size={32} />
                                </div>
                            ) : historyItems.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <History size={48} className="text-slate-200" />
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest text-center">
                                        Nenhuma movimentação registrada ate o momento
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Quantidade</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#8A9A5B]/5">
                                        {historyItems.map((move: any) => (
                                            <tr key={move.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-slate-300" />
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {new Date(move.createdAt).toLocaleString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="font-bold text-sm text-slate-700">{move.item?.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase">{move.item?.unit}</p>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                        move.type === 'ENTRADA' 
                                                        ? 'bg-green-50 text-green-600 border-green-100' 
                                                        : 'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                        {move.type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <p className={`font-black text-sm ${move.type === 'ENTRADA' ? 'text-green-600' : 'text-red-500'}`}>
                                                        {move.type === 'ENTRADA' ? '+' : '-'}{move.quantity}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-xs font-medium text-slate-500">{move.reason || '---'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
