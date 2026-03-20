import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2, X } from 'lucide-react';

interface ConfirmClosureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isPending: boolean;
}

const ConfirmClosureModal = ({ isOpen, onClose, onConfirm, isPending }: ConfirmClosureModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop com Blur Suave */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isPending ? onClose : undefined}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    />

                    {/* Modal Wrapper para Centralização Perfeita */}
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-[480px] bg-[#FDFCFB] rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden pointer-events-auto"
                        >
                            {/* Botão Fechar (X) */}
                            {!isPending && (
                                <button 
                                    onClick={onClose}
                                    className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full text-slate-300 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}

                            <div className="p-10 flex flex-col items-center text-center">
                                {/* Ícone de Cadeado (Segurança/Fechamento) */}
                                <div className="w-20 h-20 bg-[#697D58]/10 rounded-3xl flex items-center justify-center text-[#697D58] mb-8 border border-white/50 shadow-sm">
                                    <Lock size={40} strokeWidth={1.5} />
                                </div>

                                {/* Conteúdo */}
                                <h3 className="text-2xl font-black text-[#1A202C] tracking-tight mb-4 leading-tight">
                                    Encerrar Caixa Diário
                                </h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-10 max-w-[340px] mx-auto">
                                    Você está prestes a finalizar o dia. Esta ação é <span className="text-[#697D58] font-black uppercase tracking-widest text-[10px]">irreversível</span>: após confirmada, nenhuma transação deste dia poderá ser editada ou excluída. Deseja prosseguir?
                                </p>

                                {/* Botões de Ação */}
                                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                    <button
                                        onClick={onClose}
                                        disabled={isPending}
                                        className="flex-1 px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-white hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        disabled={isPending}
                                        className="flex-[1.5] px-8 py-4 rounded-2xl bg-[#697D58] text-white font-black text-sm shadow-xl shadow-[#697D58]/20 hover:bg-[#5a6b4b] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Encerrando...</span>
                                            </>
                                        ) : (
                                            <span>Sim, Encerrar Caixa</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmClosureModal;
