import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, Loader2, X } from 'lucide-react';

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
                    {/* Overlay com Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isPending ? onClose : undefined}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] bg-white rounded-[2.5rem] shadow-2xl z-[70] overflow-hidden border border-slate-100"
                    >
                        {/* Botão Fechar (X) */}
                        {!isPending && (
                            <button 
                                onClick={onClose}
                                className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <div className="p-12 flex flex-col items-center text-center">
                            {/* Ícone de Alerta */}
                            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-8 border border-amber-100/50">
                                <AlertTriangle size={40} strokeWidth={1.5} />
                            </div>

                            {/* Textos */}
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-4">
                                Encerrar Caixa Diário
                            </h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-10 max-w-[340px] mx-auto">
                                Você está prestes a finalizar o dia. Esta ação é <span className="text-red-500 font-black uppercase tracking-widest text-[10px]">irreversível</span>: após confirmada, nenhuma transação deste dia poderá ser editada ou excluída.
                            </p>

                            {/* Botões de Ação */}
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <button
                                    onClick={onClose}
                                    disabled={isPending}
                                    className="flex-1 px-8 py-4 rounded-2xl border border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
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
                                        <>
                                            <Lock size={18} />
                                            <span>Sim, Encerrar Caixa</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>


                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmClosureModal;
