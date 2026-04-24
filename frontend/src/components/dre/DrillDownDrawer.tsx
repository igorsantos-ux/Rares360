import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Activity } from 'lucide-react';
import { DreRow } from '../../types/Dre';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    row: DreRow | null;
}

export const DrillDownDrawer: React.FC<Props> = ({ isOpen, onClose, row }) => {
    const navigate = useNavigate();

    // Bloquear scroll do body quando a gaveta abrir
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    if (!row) return null;

    // Mock dados do drill-down. Em prod isso seria fetch do hook passando o row.id
    const mockPieData = [
        { name: 'Fornecedor A', value: row.value * 0.4, color: '#3B6D11' },
        { name: 'Fornecedor B', value: row.value * 0.3, color: '#BA7517' },
        { name: 'Impostos', value: row.value * 0.2, color: '#8A9A5B' },
        { name: 'Outros', value: row.value * 0.1, color: '#CBD5E1' }
    ];

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop Escuro */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[99]"
                        onClick={onClose}
                    />

                    {/* Menu Lateral Right */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#F8FAFC] shadow-2xl z-[100] flex flex-col rounded-l-[2rem] border-l border-slate-200"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-100 rounded-tl-[2rem]">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                    Detalhamento de Conta
                                </span>
                                <h2 className="text-xl font-black text-[#697D58] truncate">{row.title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Resumo Card */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total do Período</p>
                                <h3 className="text-4xl font-black text-slate-800 mb-4">{formatCurrency(row.value)}</h3>
                                {row.benchmarkStatus && (
                                    <div className={`px-4 py-2 inline-flex items-center gap-2 rounded-xl text-sm font-bold border 
                    ${row.benchmarkStatus === 'OK' ? 'bg-green-50 text-green-700 border-green-200' :
                                            row.benchmarkStatus === 'ALERTA' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        <Activity size={16} />
                                        Status: {row.benchmarkStatus}
                                    </div>
                                )}
                            </div>

                            {/* Chart: Composição */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 mb-6">Composição de Gastos</h4>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={mockPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {mockPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Transactions List */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-slate-800">Lançamentos Recentes</h4>
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1">
                                        Ver todos <ChevronRight size={16} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">Lançamento {i}</p>
                                                <p className="text-xs text-slate-500">24/04/2026 - Conta Origem</p>
                                            </div>
                                            <span className="font-medium text-slate-800">{formatCurrency(row.value / 10 + i * 150)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Bottom Actions */}
                        <div className="p-6 bg-white border-t border-slate-100 rounded-bl-[2rem]">
                            <button
                                onClick={() => navigate('/cash-flow')}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-[#697D58] hover:bg-[#526343] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#697D58]/30"
                            >
                                <Search size={20} /> Explorar no Fluxo de Caixa
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
