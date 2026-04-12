import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from './ui/Dialog';
import { 
    Save, 
    Loader2, 
    Calculator
} from 'lucide-react';
import { proceduresApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const procedureSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    category: z.string().min(1, 'Selecione uma categoria'),
    durationMinutes: z.number().min(0),
    productName: z.string().optional(),
    taskCount: z.number().min(0),
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
        reset,
        formState: { errors }
    } = useForm<ProcedureFormValues>({
        resolver: zodResolver(procedureSchema),
        defaultValues: {
            name: '',
            category: 'Geral',
            durationMinutes: 30,
            productName: '',
            taskCount: 0,
        }
    });

    useEffect(() => {
        if (procedureId && isOpen) {
            loadProcedure();
        } else {
            reset({
              name: '',
              category: 'Geral',
              durationMinutes: 30,
              productName: '',
              taskCount: 0,
            });
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none shadow-2xl">
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
                        <p className="text-gray-500 font-medium">Carregando dados...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Descrição do Procedimento</label>
                                <input 
                                    {...register('name')}
                                    className="w-full px-4 py-3 rounded-2xl border bg-white border-gray-200 focus:ring-2 focus:ring-olive-600/20 transition-all outline-none font-medium"
                                    placeholder="Ex: Toxina Botulínica"
                                />
                                {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-tight">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Tipo (Categoria)</label>
                                <select 
                                    {...register('category')}
                                    className="w-full px-4 py-3 rounded-2xl border bg-white border-gray-200 focus:ring-2 focus:ring-olive-600/20 transition-all outline-none font-medium"
                                >
                                    <option value="Avaliação">Avaliação</option>
                                    <option value="Tratamento">Tratamento</option>
                                    <option value="Injetáveis">Injetáveis</option>
                                    <option value="Equipamentos">Equipamentos</option>
                                    <option value="Retorno">Retorno</option>
                                    <option value="Geral">Geral</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Duração (Minutos)</label>
                                <input 
                                    type="number"
                                    {...register('durationMinutes', { valueAsNumber: true })}
                                    className="w-full px-4 py-3 rounded-2xl border bg-white border-gray-200 focus:ring-2 focus:ring-olive-600/20 transition-all outline-none font-medium"
                                    placeholder="30"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Produto Relacionado</label>
                                <input 
                                    {...register('productName')}
                                    className="w-full px-4 py-3 rounded-2xl border bg-white border-gray-200 focus:ring-2 focus:ring-olive-600/20 transition-all outline-none font-medium"
                                    placeholder="Ex: Frasco Botox 100U"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">Quantidade de Tarefas</label>
                                <input 
                                    type="number"
                                    {...register('taskCount', { valueAsNumber: true })}
                                    className="w-full px-4 py-3 rounded-2xl border bg-white border-gray-200 focus:ring-2 focus:ring-olive-600/20 transition-all outline-none font-medium"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 mt-8 border-top border-gray-100">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-[#8A9A5B] text-white px-10 py-2.5 rounded-xl hover:bg-[#697D58] transition-all shadow-lg shadow-[#8A9A5B]/20 text-sm font-bold disabled:opacity-50"
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
