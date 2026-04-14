import React, { useState } from 'react';
import {
    X,
    ArrowUpCircle,
    ArrowDownCircle,
    Save,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../../services/api';
import { toast } from 'react-hot-toast';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockItems: any[];
    initialType?: 'ENTRADA' | 'SAIDA';
}

export const StockMovementModal = ({ isOpen, onClose, stockItems, initialType = 'ENTRADA' }: StockMovementModalProps) => {
    const queryClient = useQueryClient();
    const [type, setType] = useState<'ENTRADA' | 'SAIDA'>(initialType);
    const [itemId, setItemId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');

    // Sincroniza o tipo quando o modal abre
    React.useEffect(() => {
        if (isOpen) {
            setType(initialType);
            resetForm();
        }
    }, [isOpen, initialType]);

    const selectedItem = stockItems.find(i => i.id === itemId);

    const mutation = useMutation({
        mutationFn: (data: any) => coreApi.registerStockMovement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-items'] });
            queryClient.invalidateQueries({ queryKey: ['stock-history'] });
            toast.success('Movimentação registrada com sucesso!');
            resetForm();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao registrar movimentação');
        }
    });

    const resetForm = () => {
        setItemId('');
        setQuantity('');
        setReason('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!itemId || !quantity || !type) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        const qtyValue = parseFloat(quantity);
        if (type === 'SAIDA' && selectedItem && selectedItem.currentStock < qtyValue) {
            toast.error(`Saldo insuficiente! Estoque atual: ${selectedItem.currentStock}`);
            return;
        }

        mutation.mutate({
            itemId,
            type,
            quantity: qtyValue,
            reason
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden"
                    >
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl ${type === 'ENTRADA' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {type === 'ENTRADA' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-700 tracking-tight">
                                        {type === 'ENTRADA' ? 'Entrada de Material' : 'Saída / Consumo'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registrar movimentação real</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setType('ENTRADA')}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${type === 'ENTRADA' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    ENTRADA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('SAIDA')}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${type === 'SAIDA' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    SAÍDA
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecionar Insumo</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm text-slate-700 appearance-none"
                                        value={itemId}
                                        onChange={(e) => setItemId(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione um item...</option>
                                        {stockItems.map(item => (
                                            <option key={item.id} value={item.id}>{item.name} (Atual: {item.currentStock} {item.unit})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="0.00"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo / Tipo</label>
                                        <select
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm text-slate-700"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {type === 'ENTRADA' ? (
                                                <>
                                                    <option value="Compra">Compra / Reposição</option>
                                                    <option value="Ajuste de Saldo">Ajuste de Saldo (Inventário)</option>
                                                    <option value="Devolução">Devolução</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Uso em Procedimento">Uso em Procedimento</option>
                                                    <option value="Perda / Validade">Perda / Validade</option>
                                                    <option value="Ajuste de Saldo">Ajuste de Saldo (Inventário)</option>
                                                    <option value="Consumo Interno">Consumo Interno</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {type === 'SAIDA' && selectedItem && parseFloat(quantity) > selectedItem.currentStock && (
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                                    <p className="text-xs font-bold text-red-600 leading-relaxed">
                                        Atenção: A quantidade de saída é maior que o saldo atual ({selectedItem.currentStock}). A operação será bloqueada por segurança.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutation.isPending || (type === 'SAIDA' && selectedItem && parseFloat(quantity) > selectedItem.currentStock)}
                                    className={`flex-[2] py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${type === 'ENTRADA'
                                            ? 'bg-[#8A9A5B] text-white shadow-[#8A9A5B]/20'
                                            : 'bg-red-500 text-white shadow-red-500/20'
                                        } hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100`}
                                >
                                    {mutation.isPending ? 'Registrando...' : (
                                        <>
                                            <Save size={18} />
                                            {type === 'ENTRADA' ? 'Confirmar Entrada' : 'Confirmar Saída'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
