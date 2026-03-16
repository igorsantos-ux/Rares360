import { useState } from 'react';
import { Filter, Plus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateFilterProps {
    selectedPeriod: string;
    setSelectedPeriod: (period: string) => void;
    customStartDate: string;
    setCustomStartDate: (date: string) => void;
    customEndDate: string;
    setCustomEndDate: (date: string) => void;
    onApply: () => void;
}

const DateFilter = ({
    selectedPeriod,
    setSelectedPeriod,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    onApply
}: DateFilterProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const periods = ['Hoje', 'Últimos 7 dias', 'Este Mês', 'Últimos 30 dias', 'Este Ano', 'Personalizado'];

    return (
        <div className="relative">
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/20 rounded-2xl font-bold text-sm text-[#697D58] hover:bg-[#8A9A5B]/5 transition-all shadow-sm"
            >
                <Filter size={18} />
                {selectedPeriod}
            </button>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-[#697D58]">Filtrar Período</h3>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                                >
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {periods.map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => {
                                            setSelectedPeriod(period);
                                            if (period !== 'Personalizado') {
                                                // setIsModalOpen(false); // Mantém aberto para clicar em Aplicar se preferir, ou fecha direto
                                            }
                                        }}
                                        className={`w-full py-4 px-6 rounded-2xl font-bold text-left transition-all flex justify-between items-center ${selectedPeriod === period
                                            ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20 translate-x-1'
                                            : 'bg-slate-50 text-slate-600 hover:bg-[#8A9A5B]/10 hover:text-[#697D58]'
                                            }`}
                                    >
                                        {period}
                                        {selectedPeriod === period && <ArrowRight size={18} />}
                                    </button>
                                ))}
                            </div>

                            {selectedPeriod === 'Personalizado' && (
                                <div className="mt-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Data Início</label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold outline-none focus:border-[#8A9A5B] transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Data Fim</label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold outline-none focus:border-[#8A9A5B] transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    onApply();
                                    setIsModalOpen(false);
                                }}
                                className="w-full mt-8 py-4 bg-[#697D58] text-white rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all"
                            >
                                Aplicar Filtro
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DateFilter;
