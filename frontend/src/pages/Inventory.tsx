import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../services/api';
import {
    addDays,
    isBefore,
    startOfDay
} from 'date-fns';
import {
    Package,
    Search,
    AlertTriangle,
    Plus,
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
import { ImportInventoryModal } from '../components/Inventory/ImportInventoryModal';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'items' | 'history'>('items');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [filterType, setFilterType] = useState<'all' | 'low' | 'expiration'>('all');

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

    // Protocolo de Inteligência: Cálculos e KPIs
    const today = startOfDay(new Date());
    const thirtyDaysFromNow = addDays(today, 30);

    const stats = {
        totalItems: stockItems.length,
        toBuyCount: stockItems.filter((i: any) => i.currentStock <= i.minQuantity && i.minQuantity > 0).length,
        expiringCount: stockItems.filter((i: any) => {
            if (!i.expirationDate) return false;
            const exp = new Date(i.expirationDate);
            return isBefore(exp, thirtyDaysFromNow);
        }).length,
        replenishmentInvestment: stockItems.reduce((acc: number, cur: any) => {
            if (cur.currentStock <= cur.minQuantity && cur.minQuantity > 0) {
                const targetQty = cur.minQuantity * 2;
                const neededQty = targetQty - cur.currentStock;
                return acc + (neededQty * (cur.unitCost || 0));
            }
            return acc;
        }, 0)
    };

    const filteredItems = stockItems.filter((item: any) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterType === 'low') return item.currentStock <= item.minQuantity;
        if (filterType === 'expiration') {
            if (!item.expirationDate) return false;
            const exp = new Date(item.expirationDate);
            return isBefore(exp, thirtyDaysFromNow);
        }

        return true;
    });

    const handleOpenSheet = (item?: any) => {
        setSelectedItem(item || null);
        setIsSheetOpen(true);
    };

    const handleOpenMovement = (type: 'IN' | 'OUT') => {
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
                        onClick={() => handleOpenMovement('IN')}
                        className="flex items-center gap-2 px-5 py-3 bg-green-50 text-green-700 border border-green-100 rounded-2xl font-bold text-sm hover:bg-green-100 transition-all shadow-sm"
                    >
                        <ArrowUpCircle size={18} />
                        Entrada
                    </button>
                    <button
                        onClick={() => handleOpenMovement('OUT')}
                        className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all shadow-sm"
                    >
                        <ArrowDownCircle size={18} />
                        Saída
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all shadow-sm"
                    >
                        <Download size={18} />
                        Importar
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

            <ImportInventoryModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['stock-items'] })}
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InventoryStatCard
                    label="Itens p/ Comprar"
                    value={stats.toBuyCount.toString()}
                    icon={<Truck size={20} />}
                    alert={stats.toBuyCount > 0}
                    color="red"
                />
                <InventoryStatCard
                    label="Vencendo (30 dias)"
                    value={stats.expiringCount.toString()}
                    icon={<Clock size={20} />}
                    alert={stats.expiringCount > 0}
                    color="amber"
                />
                <InventoryStatCard
                    label="Investimento p/ Reposição"
                    value={`R$ ${stats.replenishmentInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<BarChart2 size={20} />}
                />
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-[2rem] w-full md:w-fit border border-[#8A9A5B]/10">
                <button
                    onClick={() => setActiveTab('items')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-sm font-black transition-all ${activeTab === 'items'
                        ? 'bg-[#8A9A5B] text-white shadow-xl shadow-[#8A9A5B]/20'
                        : 'text-slate-500 hover:text-[#697D58]'
                        }`}
                >
                    <Package size={18} />
                    Lista de Itens
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-sm font-black transition-all ${activeTab === 'history'
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
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-white text-[#697D58] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    > Todos </button>
                                    <button
                                        onClick={() => setFilterType('low')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterType === 'low' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'text-slate-400 hover:text-red-500'}`}
                                    > Compra Urgente </button>
                                    <button
                                        onClick={() => setFilterType('expiration')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterType === 'expiration' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-slate-400 hover:text-amber-600'}`}
                                    > Vencendo </button>
                                </div>
                                <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                                    <Download size={16} /> Exportar
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {filteredItems.length === 0 ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-8 animate-in fade-in zoom-in duration-1000">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-[#8A9A5B]/20 blur-3xl rounded-full scale-150" />
                                        <div className="relative w-24 h-24 bg-white border border-[#8A9A5B]/10 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#8A9A5B]/20">
                                            <Package size={40} className="text-[#8A9A5B]" />
                                        </div>
                                    </div>
                                    <div className="text-center max-w-sm space-y-2">
                                        <h3 className="text-2xl font-black text-[#697D58]">Seu estoque, sua inteligência</h3>
                                        <p className="text-slate-400 font-medium leading-relaxed">
                                            Cadastre seu primeiro item para começar a monitorar níveis críticos, validades e otimizar seus custos operacionais.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenSheet()}
                                        className="flex items-center gap-2 px-8 py-4 bg-[#8A9A5B] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.05] active:scale-95 transition-all"
                                    >
                                        <Plus size={20} />
                                        Cadastrar Primeiro Insumo
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Início / Atual</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Custo Unit / Total</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mín / A Comprar</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#8A9A5B]/5">
                                        {filteredItems.map((item: any) => {
                                            const isLowStock = item.currentStock <= item.minQuantity;
                                            const toBuyQty = Math.max(0, item.minQuantity - item.currentStock);
                                            const totalValue = item.currentStock * item.unitCost;

                                            // Lógica de Validade com date-fns
                                            let expStatus: 'ok' | 'warning' | 'critical' = 'ok';
                                            if (item.expirationDate) {
                                                const exp = new Date(item.expirationDate);
                                                if (isBefore(exp, today)) expStatus = 'critical';
                                                else if (isBefore(exp, thirtyDaysFromNow)) expStatus = 'warning';
                                            }

                                            return (
                                                <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer" onClick={() => handleOpenSheet(item)}>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-slate-700 text-sm">{item.name}</p>
                                                                {!item.isActive && <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase">Inativo</span>}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] font-bold text-[#697D58] uppercase tracking-widest bg-[#8A9A5B]/10 px-2 py-0.5 rounded-full">{item.category}</span>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CÓD: {item.code || '---'}</p>
                                                            </div>
                                                            {item.manufacturer && (
                                                                <p className="text-[9px] text-slate-400 font-medium mt-0.5 italic">Fab: {item.manufacturer}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`px-4 py-2 rounded-2xl border ${isLowStock ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                                                <p className="text-xl font-black text-slate-800">{item.currentStock}</p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{item.unit}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <p className="text-sm font-black text-slate-700">R$ {item.unitCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                            <p className="text-[10px] font-bold text-[#8A9A5B] mt-1">Total: R$ {totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                        </div>
                                                    </td>

                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <p className="text-xs font-bold text-slate-500">Mín: {item.minQuantity}</p>
                                                            {toBuyQty > 0 ? (
                                                                <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg border border-red-100 italic">
                                                                    + {toBuyQty} {item.unit}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Suprido</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {item.expirationDate ? (
                                                                <div className={`flex items-center gap-1.5 text-[10px] font-bold ${expStatus === 'critical' ? 'text-red-600' :
                                                                    expStatus === 'warning' ? 'text-amber-600' : 'text-slate-500'
                                                                    }`}>
                                                                    {expStatus === 'critical' && <AlertTriangle size={12} className="text-red-600 animate-bounce" />}
                                                                    {expStatus === 'warning' && <Clock size={12} className="text-amber-500" />}
                                                                    {expStatus === 'ok' && <Calendar size={12} className="text-[#8A9A5B]" />}
                                                                    {new Date(item.expirationDate).toLocaleDateString()}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">---</span>
                                                            )}
                                                            {item.supplier && (
                                                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium">
                                                                    <Truck size={10} /> {item.supplier}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            {item.currentStock === 0 ? (
                                                                <span className="text-[8px] font-black uppercase tracking-widest bg-red-600 text-white px-3 py-1 rounded-lg shadow-sm">Esgotado</span>
                                                            ) : item.currentStock <= item.minQuantity ? (
                                                                <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500 text-white px-3 py-1 rounded-lg shadow-sm">Estoque Baixo</span>
                                                            ) : (
                                                                <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-3 py-1 rounded-lg shadow-sm">Normal</span>
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
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${move.type === 'ENTRADA'
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

const InventoryStatCard = ({ label, value, icon, alert, color }: any) => (
    <div className={`bg-white p-6 rounded-3xl border transition-all duration-500 ${alert
        ? (color === 'red' ? 'border-red-200 shadow-xl shadow-red-50 ring-1 ring-red-100' : 'border-amber-200 shadow-xl shadow-amber-50 ring-1 ring-amber-100')
        : 'border-[#8A9A5B]/10 shadow-sm'
        } flex items-center gap-5 group overflow-hidden relative`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 relative z-10 ${alert
            ? (color === 'red' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')
            : 'bg-slate-50 text-[#8A9A5B]'
            }`}>
            {icon}
        </div>
        <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h5 className={`text-2xl font-black ${alert
                ? (color === 'red' ? 'text-red-600' : 'text-amber-600')
                : 'text-[#1A202C]'
                }`}>{value}</h5>
        </div>

        {alert && (
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.05] pointer-events-none ${color === 'red' ? 'text-red-500' : 'text-amber-500'}`}>
                {icon}
            </div>
        )}
    </div>
);

export default Inventory;
