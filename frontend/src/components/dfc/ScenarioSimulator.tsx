import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DfcSimulationInput } from '../../types/Dfc';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSimulate: (inputs: DfcSimulationInput) => void;
}

export const ScenarioSimulator: React.FC<Props> = ({ isOpen, onClose, onSimulate }) => {
    const [period, setPeriod] = useState<30 | 60 | 90 | 180>(90);
    const [inMultiplier, setInMultiplier] = useState(1.0);
    const [outMultiplier, setOutMultiplier] = useState(1.0);

    // Simulação visual mockada (em prod viria da response do useDfcSimulator)
    const mockSimulationData = [
        { name: 'Otimista', finalBalance: 250000, color: '#3B6D11' },
        { name: 'Realista', finalBalance: 170000, color: '#1E293B' },
        { name: 'Pessimista', finalBalance: 50000, color: '#A32D2D' }
    ];

    if (!isOpen) return null;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#F8FAFC]">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Simulador de Cenários</h2>
                            <p className="text-sm text-slate-500 font-medium">Projete o impacto no caixa em condições adversas ou favoráveis</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm border border-slate-200">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Controles Inputs */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Período de Projeção</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[30, 60, 90, 180].map(d => (
                                        <button
                                            key={d} onClick={() => setPeriod(d as any)}
                                            className={`py-2 rounded-xl text-sm font-bold border transition-colors ${period === d ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {d} dias
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Aceleração de Entradas ({Math.round(inMultiplier * 100)}%)
                                </label>
                                <input
                                    type="range" min="0.5" max="1.5" step="0.1"
                                    value={inMultiplier}
                                    onChange={(e) => setInMultiplier(Number(e.target.value))}
                                    className="w-full accent-green-600"
                                />
                                <div className="flex justify-between text-xs font-bold text-slate-400 mt-1">
                                    <span>Pessimista (-50%)</span>
                                    <span>Realista (0%)</span>
                                    <span>Otimista (+50%)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Crescimento de Saídas ({Math.round(outMultiplier * 100)}%)
                                </label>
                                <input
                                    type="range" min="0.5" max="1.5" step="0.1"
                                    value={outMultiplier}
                                    onChange={(e) => setOutMultiplier(Number(e.target.value))}
                                    className="w-full accent-red-600"
                                />
                                <div className="flex justify-between text-xs font-bold text-slate-400 mt-1">
                                    <span>Segurar (-50%)</span>
                                    <span>Realista (0%)</span>
                                    <span>Gastar (+50%)</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onSimulate({ inflowMultiplier: inMultiplier, outflowMultiplier: outMultiplier, periodDays: period, additionalEvents: [] })}
                                className="w-full py-4 bg-[#185FA5] hover:bg-[#124b82] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-colors mt-8"
                            >
                                <Play fill="currentColor" size={16} /> Rodar Simulação
                            </button>
                        </div>

                        {/* Chart Outputs */}
                        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-widest text-center">Impacto no Saldo em {period} dias</h3>

                            <div className="flex-1 min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mockSimulationData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
                                        <YAxis tickFormatter={(val) => `R$${val / 1000}k`} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']} />
                                        <Bar dataKey="finalBalance" radius={[8, 8, 0, 0]}>
                                            {mockSimulationData.map((d, i) => (
                                                <Cell key={i} fill={d.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-center gap-6">
                                {mockSimulationData.map((d, i) => (
                                    <div key={i} className="text-center">
                                        <p className="text-xs font-bold text-slate-400">{d.name}</p>
                                        <p className="text-sm font-black text-slate-800" style={{ color: d.color }}>{formatCurrency(d.finalBalance)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
