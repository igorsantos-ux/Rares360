import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import type { DfcTransaction } from '../../types/Dfc';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    dateContext?: string;
    typeContext?: string;
}

export const DrillDownDfcDrawer: React.FC<Props> = ({ isOpen, onClose, title, dateContext }) => {

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
    }, [isOpen]);

    if (!isOpen) return null;

    // Fake transactions for DFC Drilldown context
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const mockTransactions: DfcTransaction[] = [
        { id: '1', date: '2026-05-15', description: 'Folha de Pagamento - Médicos', amount: 35000, category: 'Pessoal', status: 'PENDING', type: 'OUTFLOW', counterparty: 'Corpo Clínico' },
        { id: '2', date: '2026-05-15', description: 'Recebimento Convênio Bradesco', amount: 80000, category: 'Consultas', status: 'PENDING', type: 'INFLOW', counterparty: 'Bradesco Saúde' },
        { id: '3', date: '2026-05-16', description: 'Compra Equipamentos', amount: 15000, category: 'Imobilizado', status: 'PENDING', type: 'OUTFLOW', counterparty: 'MedTech Brasil' },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[200]"
                onClick={onClose}
            />

            <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#F8FAFC] shadow-2xl z-[201] flex flex-col rounded-l-[2rem] border-l border-slate-200"
            >
                <div className="px-8 py-6 bg-white border-b border-slate-100 rounded-tl-[2rem] flex justify-between items-center">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Extrato Detalhado {dateContext && `- ${dateContext}`}
                        </span>
                        <h2 className="text-xl font-black text-[#1E293B] truncate">{title}</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="space-y-4">
                        {mockTransactions.map(tx => (
                            <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'INFLOW' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{tx.description}</p>
                                        <p className="text-xs text-slate-400 font-medium">{tx.counterparty} • {tx.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black ${tx.type === 'INFLOW' ? 'text-green-700' : 'text-red-700'}`}>
                                        {tx.type === 'INFLOW' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </p>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
