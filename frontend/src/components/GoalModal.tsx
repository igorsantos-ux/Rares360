import React, { useState } from 'react';
import { Target, Calendar, Save, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { goalsApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentGoal: number;
    currentWorkingDays: number;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, currentGoal, currentWorkingDays }) => {
    const [revenueTarget, setRevenueTarget] = useState(currentGoal.toString());
    const [workingDays, setWorkingDays] = useState(currentWorkingDays.toString());
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await goalsApi.update({
                revenueTarget: parseFloat(revenueTarget),
                workingDays: parseInt(workingDays)
            });
            await queryClient.invalidateQueries({ queryKey: ['monthly-goal-stats'] });
            onClose();
        } catch (error) {
            console.error('Erro ao salvar meta:', error);
            alert('Erro ao salvar meta. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
                >
                    <div className="p-8 bg-[#697D58] text-white">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                <Target size={24} className="text-[#DEB587]" />
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <h3 className="text-2xl font-black">Meta Mensal</h3>
                        <p className="text-[#F0EAD6]/70 text-sm font-medium">Configure os objetivos de faturamento da clínica.</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Target size={12} />
                                Meta de Faturamento (R$)
                            </label>
                            <input 
                                type="number" 
                                value={revenueTarget}
                                onChange={(e) => setRevenueTarget(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 focus:border-[#8A9A5B] transition-all"
                                placeholder="Ex: 600000"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} />
                                Dias Úteis do Mês
                            </label>
                            <input 
                                type="number" 
                                value={workingDays}
                                onChange={(e) => setWorkingDays(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 focus:border-[#8A9A5B] transition-all"
                                placeholder="Ex: 22"
                            />
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-[#8A9A5B] hover:bg-[#697D58] text-white rounded-2xl p-4 font-black flex items-center justify-center gap-3 shadow-lg shadow-[#8A9A5B]/20 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    Salvar Configuração
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GoalModal;
