import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Loader2, X } from 'lucide-react';

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    icon?: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    isPending?: boolean;
    variant?: 'danger' | 'success' | 'warning' | 'info';
}

const AlertDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    icon: Icon,
    iconColor = 'text-amber-500',
    iconBg = 'bg-amber-50',
    isPending = false,
    variant = 'warning'
}: AlertDialogProps) => {
    
    const variantStyles = {
        danger: {
            confirm: 'bg-red-600 hover:bg-red-700 shadow-red-200',
            icon: 'text-red-500',
            iconBg: 'bg-red-50'
        },
        success: {
            confirm: 'bg-[#697D58] hover:bg-[#5a6b4b] shadow-[#697D58]/20',
            icon: 'text-[#697D58]',
            iconBg: 'bg-[#697D58]/10'
        },
        warning: {
            confirm: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
            icon: 'text-amber-500',
            iconBg: 'bg-amber-50'
        },
        info: {
            confirm: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
            icon: 'text-blue-500',
            iconBg: 'bg-blue-50'
        }
    };

    const currentVariant = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isPending ? onClose : undefined}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] bg-[#FDFCFB] rounded-[2.5rem] shadow-2xl z-[110] overflow-hidden border border-slate-100"
                    >
                        {/* Close Button */}
                        {!isPending && (
                            <button 
                                onClick={onClose}
                                className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full text-slate-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <div className="p-10 flex flex-col items-center text-center">
                            {/* Icon Container */}
                            {Icon && (
                                <div className={`w-20 h-20 ${iconBg || currentVariant.iconBg} rounded-3xl flex items-center justify-center ${iconColor || currentVariant.icon} mb-8 border border-white/50 shadow-sm`}>
                                    <Icon size={40} strokeWidth={1.5} />
                                </div>
                            )}

                            {/* Content */}
                            <h3 className="text-2xl font-black text-[#1A202C] tracking-tight mb-4 leading-tight">
                                {title}
                            </h3>
                            <div className="text-sm text-slate-500 font-medium leading-relaxed mb-10 max-w-[340px] mx-auto">
                                {description}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <button
                                    onClick={onClose}
                                    disabled={isPending}
                                    className="flex-1 px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-white hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isPending}
                                    className={`flex-[1.5] px-8 py-4 rounded-2xl text-white font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 whitespace-nowrap ${currentVariant.confirm}`}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Processando...</span>
                                        </>
                                    ) : (
                                        <span>{confirmText}</span>
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

export default AlertDialog;
