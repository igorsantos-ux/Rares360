import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { 
    X, 
    Save, 
    Loader2, 
    Calculator,
    Plus,
    Trash2,
    DollarSign,
    Clock,
    Percent,
    TrendingUp
} from 'lucide-react';
import { pricingApi } from '../../services/api';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Supply {
    name: string;
    quantity: number;
    cost: number;
}

interface ProcedureFormData {
    id?: string;
    name: string;
    durationMinutes: number;
    currentPrice: number;
    targetMargin: number;
    cardFeePercentage: number;
    taxPercentage: number;
    fixedCost: number;
    commission: number;
    supplies: Supply[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    procedure?: any;
}

export function ProcedurePricingSheet({ isOpen, onClose, onSave, procedure }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, control, handleSubmit, reset } = useForm<ProcedureFormData>({
        defaultValues: {
            name: '',
            durationMinutes: 0,
            currentPrice: 0,
            targetMargin: 50,
            cardFeePercentage: 0,
            taxPercentage: 0,
            fixedCost: 0,
            commission: 0,
            supplies: [{ name: '', quantity: 1, cost: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "supplies"
    });

    const watchedValues = useWatch({ control });
    const supplies = watchedValues.supplies || [];

    // Lógica Financeira Reativa
    const financialSummary = useMemo(() => {
        const currentPrice = Number(watchedValues.currentPrice) || 0;
        const targetMargin = Number(watchedValues.targetMargin) || 50;
        
        // 1. Custo de Insumos
        const suppliesCost = supplies.reduce((acc, s) => acc + ((Number(s.quantity) || 0) * (Number(s.cost) || 0)), 0);
        
        // 2. Custos Variáveis (Taxas e Impostos sobre o Preço Praticado)
        const totalFees = (Number(watchedValues.cardFeePercentage) || 0) + (Number(watchedValues.taxPercentage) || 0);
        const feesAmount = (currentPrice * totalFees) / 100;
        
        // 3. Custos Fixos e Comissão
        const otherCosts = (Number(watchedValues.fixedCost) || 0) + (Number(watchedValues.commission) || 0);
        
        // 4. Custo Total Consolidado
        const totalCost = suppliesCost + feesAmount + otherCosts;
        
        // 5. Lucro e Margem Atual
        const netProfit = currentPrice - totalCost;
        const currentMargin = currentPrice > 0 ? (netProfit / currentPrice) * 100 : 0;
        
        // 6. Preço Sugerido (Markup Divisor)
        // Preço = Custo Base / (1 - (Margem Alvo + Taxas%) / 100)
        // Nota: Para simplificar e ser preciso, o custo base aqui inclui Insumos + Fixo + Comissão.
        const baseCost = suppliesCost + otherCosts;
        const divisor = 1 - ((targetMargin + totalFees) / 100);
        const suggestedPrice = divisor > 0 ? baseCost / divisor : baseCost;

        return {
            totalCost,
            netProfit,
            currentMargin,
            suggestedPrice,
            suppliesCost
        };
    }, [watchedValues, supplies]);

    useEffect(() => {
        if (isOpen) {
            if (procedure) {
                reset({
                    ...procedure,
                    supplies: procedure.supplies?.length > 0 ? procedure.supplies : [{ name: '', quantity: 1, cost: 0 }]
                });
            } else {
                reset({
                    name: '',
                    durationMinutes: 0,
                    currentPrice: 0,
                    targetMargin: 50,
                    cardFeePercentage: 0,
                    taxPercentage: 0,
                    fixedCost: 0,
                    commission: 0,
                    supplies: [{ name: '', quantity: 1, cost: 0 }]
                });
            }
        }
    }, [procedure, isOpen, reset]);

    const onSubmit = async (data: ProcedureFormData) => {
        try {
            setIsSubmitting(true);
            
            // Enviamos o totalCost calculado para o banco
            const payload = {
                ...data,
                totalCost: financialSummary.totalCost
            };

            await pricingApi.upsertProcedure(payload);
            toast.success('Procedimento salvo com sucesso!');
            onSave();
            onClose();
        } catch (error: any) {
            toast.error('Erro ao salvar procedimento');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-3xl bg-[#FDFBF7] shadow-2xl z-50 flex flex-col border-l border-[#8A9A5B]/20"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 bg-[#8A9A5B] text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                    <Calculator size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">{procedure ? 'Editar Procedimento' : 'Novo Procedimento'}</h2>
                                    <p className="text-white/80 text-xs font-medium">Detalhamento técnico e financeiro</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                            <form id="procedureForm" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                                
                                {/* Dados Básicos */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-[#8A9A5B]/10 rounded-lg flex items-center justify-center text-[#8A9A5B]">
                                            <TrendingUp size={16} />
                                        </div>
                                        <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">Identificação e Tempo</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#697D58] uppercase tracking-[0.1em]">Nome do Procedimento</label>
                                            <input
                                                {...register('name')}
                                                placeholder="Ex: Botox, Preenchimento..."
                                                className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#697D58] uppercase tracking-[0.1em]">Tempo Médio (Minutos)</label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="number"
                                                    {...register('durationMinutes')}
                                                    className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Insumos */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-[#8A9A5B]/10 rounded-lg flex items-center justify-center text-[#8A9A5B]">
                                                <Plus size={16} />
                                            </div>
                                            <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">Insumos Utilizados</h3>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => append({ name: '', quantity: 1, cost: 0 })}
                                            className="text-[10px] font-black text-[#8A9A5B] uppercase hover:underline"
                                        >
                                            + Adicionar Item
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex gap-3 bg-white p-3 rounded-2xl border border-[#8A9A5B]/10 shadow-sm animate-in fade-in slide-in-from-right-2">
                                                <div className="flex-1">
                                                    <input
                                                        {...register(`supplies.${index}.name` as const)}
                                                        placeholder="Item"
                                                        className="w-full border-none focus:ring-0 text-xs font-bold text-slate-600 bg-transparent"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`supplies.${index}.quantity` as const)}
                                                        placeholder="Qtd"
                                                        className="w-full border-none focus:ring-0 text-xs font-bold text-slate-600 text-center bg-transparent"
                                                    />
                                                </div>
                                                <div className="w-32 flex items-center bg-slate-50 px-3 rounded-xl">
                                                    <span className="text-[10px] font-bold text-slate-400 mr-1">R$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`supplies.${index}.cost` as const)}
                                                        className="w-full border-none focus:ring-0 text-xs font-black text-slate-700 bg-transparent"
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => remove(index)}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Taxas e Margem */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-[#8A9A5B]/10 rounded-lg flex items-center justify-center text-[#8A9A5B]">
                                            <Percent size={16} />
                                        </div>
                                        <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">Custos Operacionais e Meta</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6 bg-white/50 p-6 rounded-[2rem] border border-[#8A9A5B]/10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preço Praticado Atual (R$)</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9A5B]" size={18} />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register('currentPrice')}
                                                        className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl pl-12 pr-4 py-4 text-xl font-black text-slate-700 focus:ring-4 focus:ring-[#8A9A5B]/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Margem Alvo Desejada (%)</label>
                                                <div className="relative">
                                                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9A5B]" size={18} />
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('targetMargin')}
                                                        className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl pl-12 pr-4 py-4 text-xl font-black text-slate-700 focus:ring-4 focus:ring-[#8A9A5B]/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400">Sugestão mínima: 40%</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Máquina (%)</label>
                                                <input type="number" step="0.01" {...register('cardFeePercentage')} className="w-full bg-white border border-[#8A9A5B]/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#8A9A5B]/20 shadow-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Imposto (%)</label>
                                                <input type="number" step="0.01" {...register('taxPercentage')} className="w-full bg-white border border-[#8A9A5B]/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#8A9A5B]/20 shadow-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custo Fixo (R$)</label>
                                                <input type="number" step="0.01" {...register('fixedCost')} className="w-full bg-white border border-[#8A9A5B]/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#8A9A5B]/20 shadow-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comissão (R$)</label>
                                                <input type="number" step="0.01" {...register('commission')} className="w-full bg-white border border-[#8A9A5B]/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#8A9A5B]/20 shadow-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </form>
                        </div>

                        {/* Resumo Financeiro Bottom */}
                        <div className="bg-[#F0EAD6]/50 backdrop-blur-md p-6 border-t border-[#8A9A5B]/10">
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-white/80 p-4 rounded-2xl border border-[#8A9A5B]/10">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Custo Total</p>
                                    <p className="text-sm font-black text-slate-700">R$ {financialSummary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-white/80 p-4 rounded-2xl border border-[#8A9A5B]/10 text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Margem Real</p>
                                    <p className={`text-sm font-black ${financialSummary.currentMargin < 20 ? 'text-red-500' : 'text-[#697D58]'}`}>
                                        {financialSummary.currentMargin.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="bg-[#8A9A5B]/10 p-4 rounded-2xl border border-[#8A9A5B]/20 col-span-2 text-right">
                                    <p className="text-[10px] font-black text-[#697D58] uppercase tracking-widest">Preço Sugerido (venda)</p>
                                    <p className="text-xl font-black text-[#697D58]">R$ {financialSummary.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-slate-500 uppercase tracking-widest text-xs hover:bg-slate-200/50 rounded-2xl transition-all">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="procedureForm"
                                    disabled={isSubmitting}
                                    className="flex-[2] flex items-center justify-center gap-3 py-4 bg-[#8A9A5B] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#8A9A5B]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Salvar Procedimento
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
