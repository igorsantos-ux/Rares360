import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from './ui/dialog';
import { 
    Save, 
    Loader2, 
    TrendingUp, 
    DollarSign, 
    Percent, 
    Calculator,
    AlertCircle,
    Info,
    Receipt
} from 'lucide-react';
import { proceduresApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import CurrencyInput from 'react-currency-input-field';
import { toast } from 'react-hot-toast';

const procedureSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    category: z.string().min(1, 'Selecione uma categoria'),
    fixedCost: z.number().min(0),
    variableCost: z.number().min(0),
    taxes: z.number().min(0).max(100),
    commission: z.number().min(0).max(100),
    basePrice: z.number().min(1, 'Preço de venda deve ser maior que zero'),
    durationMinutes: z.number().min(0),
});

type ProcedureFormValues = z.infer<typeof procedureSchema>;

interface ProcedureModalProps {
    isOpen: boolean;
    onClose: () => void;
    procedureId: string | null;
}

const ProcedureModal = ({ isOpen, onClose, procedureId }: ProcedureModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors }
    } = useForm<ProcedureFormValues>({
        resolver: zodResolver(procedureSchema),
        defaultValues: {
            name: '',
            category: 'Geral',
            fixedCost: 0,
            variableCost: 0,
            taxes: 0,
            commission: 0,
            basePrice: 0,
            durationMinutes: 60,
        }
    });

    // Watch fields for real-time calculation
    const watchedFields = useWatch({ control });

    const financeStats = useMemo(() => {
        const basePrice = watchedFields.basePrice || 0;
        const fixedCost = watchedFields.fixedCost || 0;
        const variableCost = watchedFields.variableCost || 0;
        const taxes = watchedFields.taxes || 0;
        const commission = watchedFields.commission || 0;

        const taxAmount = basePrice * (taxes / 100);
        const commissionAmount = basePrice * (commission / 100);
        const totalCost = fixedCost + variableCost + taxAmount + commissionAmount;
        
        const profit = basePrice - totalCost;
        const margin = basePrice > 0 ? (profit / basePrice) * 100 : 0;

        return {
            totalCost,
            profit,
            margin
        };
    }, [watchedFields]);

    useEffect(() => {
        if (procedureId && isOpen) {
            loadProcedure();
        } else {
            reset();
        }
    }, [procedureId, isOpen]);

    const loadProcedure = async () => {
        try {
            setIsLoading(true);
            const { data } = await proceduresApi.getById(procedureId!);
            reset(data);
        } catch (error) {
            toast.error('Erro ao carregar dados do procedimento');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: ProcedureFormValues) => {
        try {
            setIsSaving(true);
            if (procedureId) {
                await proceduresApi.update(procedureId, data);
                toast.success('Procedimento atualizado com sucesso');
            } else {
                await proceduresApi.create(data);
                toast.success('Procedimento criado com sucesso');
            }
            queryClient.invalidateQueries({ queryKey: ['procedures'] });
            onClose();
        } catch (error) {
            toast.error('Erro ao salvar procedimento');
        } finally {
            setIsSaving(false);
        }
    };

    const formatBRL = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none shadow-2xl">
                <DialogHeader className="p-8 bg-gray-50/50 border-b border-gray-100">
                    <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="bg-olive-600 p-2 rounded-xl text-white shadow-lg shadow-olive-600/30">
                            <Calculator size={20} />
                        </div>
                        {procedureId ? 'Editar Procedimento' : 'Novo Procedimento'}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-olive-600" size={40} />
                        <p className="text-gray-500 font-medium">Carregando dados financeiros...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Coluna 1: Dados e Custos */}
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Info size={14} /> Dados Básicos
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 ml-1">Descrição do Procedimento</label>
                                            <input 
                                                {...register('name')}
                                                className="w-full px-4 py-3 rounded-2xl border bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-olive-600/20 transition-all outline-none"
                                                placeholder="Ex: Toxina Botulínica - 50U"
                                            />
                                            {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-tight">{errors.name.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 ml-1">Categoria / Grupo</label>
                                            <select 
                                                {...register('category')}
                                                className="w-full px-4 py-3 rounded-2xl border bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-olive-600/20 transition-all outline-none"
                                            >
                                                <option value="Injetáveis">Injetáveis</option>
                                                <option value="Facial">Facial</option>
                                                <option value="Corporal">Corporal</option>
                                                <option value="Consulta">Consulta</option>
                                                <option value="Geral">Geral</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <DollarSign size={14} /> Estrutura de Custos
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 ml-1">Custo Fixo (Rateado)</label>
                                            <CurrencyInput
                                                value={watchedFields.fixedCost}
                                                onValueChange={(val) => setValue('fixedCost', Number(val) || 0)}
                                                prefix="R$ "
                                                className="w-full px-4 py-3 rounded-2xl border bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-olive-600/20 transition-all outline-none text-sm"
                                                intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 ml-1">Custo Insumos (Variável)</label>
                                            <CurrencyInput
                                                value={watchedFields.variableCost}
                                                onValueChange={(val) => setValue('variableCost', Number(val) || 0)}
                                                prefix="R$ "
                                                className="w-full px-4 py-3 rounded-2xl border bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-olive-600/20 transition-all outline-none text-sm"
                                                intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Coluna 2: Deduções e Venda */}
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Percent size={14} /> Impostos e Comissões
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 ml-1">Impostos (%)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    {...register('taxes', { valueAsNumber: true })}
                                                    className="w-full pl-4 pr-10 py-3 rounded-2xl border bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-olive-600/20 transition-all outline-none text-sm"
                                                />
                                                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 ml-1">Comissão (%)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    {...register('commission', { valueAsNumber: true })}
                                                    className="w-full pl-4 pr-10 py-3 rounded-2xl border bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-olive-600/20 transition-all outline-none text-sm"
                                                />
                                                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-4">
                                    <h3 className="text-sm font-bold text-olive-600 uppercase tracking-widest flex items-center gap-2">
                                        <Receipt size={14} /> Valor de Venda (Final)
                                    </h3>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 ml-1 text-olive-800">Preço de Venda Praticado</label>
                                        <CurrencyInput
                                            value={watchedFields.basePrice}
                                            onValueChange={(val) => setValue('basePrice', Number(val) || 0)}
                                            prefix="R$ "
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-olive-100 bg-olive-50/30 focus:bg-white focus:ring-4 focus:ring-olive-600/5 focus:border-olive-600 transition-all outline-none text-2xl font-black text-olive-900"
                                            intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                                        />
                                        {errors.basePrice && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase">{errors.basePrice.message}</p>}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Preview Financeiro (Premium Footer) */}
                        <div className="p-6 bg-gray-900 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <TrendingUp size={120} />
                            </div>
                            
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-olive-400 mb-6 flex items-center gap-2">
                                    <Calculator size={14} /> Preview de Lucratividade em Tempo Real
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                    <div>
                                        <p className="text-gray-400 text-xs font-medium mb-1">Custo Total (Deduções + Insumos)</p>
                                        <p className="text-2xl font-bold font-mono tracking-tight text-gray-200">
                                            {formatBRL(financeStats.totalCost)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs font-medium mb-1">Lucro Líquido p/ Procedimento</p>
                                        <p className={`text-2xl font-bold font-mono tracking-tight ${financeStats.profit < 0 ? 'text-rose-400' : 'text-olive-400'}`}>
                                            {formatBRL(financeStats.profit)}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center">
                                        <p className="text-white/60 text-[10px] font-bold uppercase mb-1 tracking-wider">Margem de Lucro %</p>
                                        <p className={`text-4xl font-black ${
                                            financeStats.margin < 20 ? 'text-rose-500' : financeStats.margin > 40 ? 'text-olive-500' : 'text-white'
                                        }`}>
                                            {financeStats.margin.toFixed(1)}%
                                        </p>
                                        {financeStats.margin < 20 && (
                                            <span className="text-[8px] text-rose-500 font-bold uppercase mt-1 flex items-center gap-1">
                                                <AlertCircle size={10} /> Margem Comercial Crítica
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-all text-sm"
                            >
                                Descartar
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-olive-600 text-white px-10 py-2.5 rounded-xl hover:bg-olive-700 transition-all shadow-lg shadow-olive-600/20 text-sm font-bold disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Salvar Procedimento
                            </button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ProcedureModal;
