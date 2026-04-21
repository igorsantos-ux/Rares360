import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
    Dialog, 
    DialogContent, 
    DialogTitle 
} from "../../../ui/Dialog";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Badge } from "../../../ui/Badge";
import { Combobox } from "../../../ui/Combobox";
import { 
    Plus, 
    Trash2, 
    Calculator,
    ChevronRight,
    CheckCircle2,
    Printer,
    ArrowLeft
} from 'lucide-react';
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface TreatmentPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: any;
}

type ViewState = 'EDIT' | 'APPROVE';

const TreatmentPlanModal = ({ isOpen, onClose, patient }: TreatmentPlanModalProps) => {
    const queryClient = useQueryClient();
    const [view, setView] = useState<ViewState>('EDIT');
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<'VALUE' | 'PERCENT'>('VALUE');
    
    // Estados para Aprovação/Parcelamento
    const [numInstallments, setNumInstallments] = useState(1);
    const [selectedMethod, setSelectedMethod] = useState('Cartão de Crédito');

    // Fetch Procedimentos para o Combobox
    const { data: proceduresData, isLoading: isLoadingProcedures } = useQuery({
        queryKey: ['procedures-all'],
        queryFn: async () => {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/procedures`, {
                headers: { 'x-clinic-id': patient.clinicId }
            });
            // Dependendo da API, pode vir em response.data.items ou apenas response.data
            return response.data.items || response.data;
        }
    });

    const procedureOptions = useMemo(() => {
        if (!proceduresData) return [];
        return proceduresData.map((p: any) => ({
            value: p.id,
            label: p.name,
            rightLabel: p.basePrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'
        }));
    }, [proceduresData]);

    const addItem = (procedureId: string) => {
        const proc = proceduresData.find((p: any) => p.id === procedureId);
        if (!proc) return;
        
        if (selectedItems.find(item => item.procedureId === proc.id)) {
            toast.error("Este procedimento já foi adicionado.");
            return;
        }
        
        setSelectedItems([...selectedItems, {
            procedureId: proc.id,
            name: proc.name,
            unitValue: proc.basePrice || proc.currentPrice || 0,
            discount: 0,
            quantity: 1,
            finalValue: proc.basePrice || proc.currentPrice || 0,
        }]);
    };

    const removeItem = (id: string) => {
        setSelectedItems(selectedItems.filter(item => item.procedureId !== id));
    };

    const updateItem = (id: string, field: string, value: any) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.procedureId === id) {
                const newItem = { ...item, [field]: value };
                // Recalcular valor final do item
                newItem.finalValue = (newItem.unitValue * newItem.quantity) - newItem.discount;
                return newItem;
            }
            return item;
        }));
    };

    // Cálculos Financeiros
    const subtotal = selectedItems.reduce((acc, item) => acc + (item.unitValue * item.quantity), 0);
    const totalIndividualDiscounts = selectedItems.reduce((acc, item) => acc + item.discount, 0);
    
    const finalTotal = useMemo(() => {
        const afterIndiv = subtotal - totalIndividualDiscounts;
        const globalDiscValue = discountType === 'PERCENT' 
            ? (afterIndiv * (globalDiscount / 100)) 
            : globalDiscount;
        return Math.max(0, afterIndiv - globalDiscValue);
    }, [subtotal, totalIndividualDiscounts, globalDiscount, discountType]);

    // Lógica de Parcelas
    const installmentsList = useMemo(() => {
        return Array.from({ length: numInstallments }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            return {
                amount: (finalTotal / numInstallments).toFixed(2),
                dueDate: date,
                paymentMethod: selectedMethod
            };
        });
    }, [finalTotal, numInstallments, selectedMethod]);

    const createAndApproveMutation = useMutation({
        mutationFn: async ({ approve }: { approve: boolean }) => {
            // 1. Criar o Plano como DRAFT
            const planResponse = await axios.post(`${import.meta.env.VITE_API_URL}/api/treatment-plans`, {
                patientId: patient.id,
                totalAmount: finalTotal,
                notes,
                items: selectedItems.map(item => ({
                    ...item,
                    // Garante que o valor enviado é o proporcional pós desconto global (opcional dependendo da regra de negócio)
                }))
            }, { headers: { 'x-clinic-id': patient.clinicId } });

            const plan = planResponse.data;

            // 2. Se for para aprovar, gerar o financeiro
            if (approve) {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/treatment-plans/${plan.id}/approve`, {
                    installments: installmentsList
                }, { headers: { 'x-clinic-id': patient.clinicId } });
            }

            return plan;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
            toast.success(variables.approve ? "Plano aprovado e financeiro gerado!" : "Orçamento salvo como rascunho!");
            onClose();
            resetState();
        },
        onError: () => {
            toast.error("Erro ao processar plano de tratamento.");
        }
    });

    const resetState = () => {
        setSelectedItems([]);
        setNotes('');
        setGlobalDiscount(0);
        setView('EDIT');
        setNumInstallments(1);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl w-[95vw] h-[90vh] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
                {/* Header Premium */}
                <div className="bg-[#697D58] p-6 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Calculator size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black">
                                    {view === 'EDIT' ? 'Novo Plano de Tratamento' : 'Configurar Pagamento'}
                                </DialogTitle>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                                    Paciente: {patient.fullName}
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-[#F5F5DC] text-[#697D58] hover:bg-[#F5F5DC] border-none px-4 py-1.5 rounded-full font-black text-[10px]">
                            {view === 'EDIT' ? 'FASE DE ORÇAMENTO' : 'APROVAÇÃO FINAL'}
                        </Badge>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#FAFAFA]">
                    {/* Coluna Esquerda: Conteúdo Principal */}
                    <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8">
                        <AnimatePresence mode="wait">
                            {view === 'EDIT' ? (
                                <motion.div 
                                    key="edit"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-8"
                                >
                                    {/* Seletor de Procedimentos */}
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Adicionar Procedimento</Label>
                                        <Combobox 
                                            options={procedureOptions}
                                            onValueChange={addItem}
                                            placeholder="Busque por procedimento, categoria ou preço..."
                                            searchPlaceholder="Ex: Toxina, Limpeza, Harmonização..."
                                            isLoading={isLoadingProcedures}
                                            className="h-14 rounded-2xl border-none shadow-sm text-base"
                                        />
                                    </div>

                                    {/* Lista de Itens (O Carrinho) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Procedimentos Selecionados</h3>
                                            <span className="text-[10px] font-bold text-slate-400 italic">{selectedItems.length} itens no total</span>
                                        </div>

                                        {selectedItems.length === 0 ? (
                                            <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-16 text-center flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                                                    <Plus size={32} />
                                                </div>
                                                <div className="max-w-xs">
                                                    <p className="text-slate-500 font-bold text-sm">Pronto para começar!</p>
                                                    <p className="text-slate-400 text-xs mt-1">Busque um procedimento acima para iniciar o plano de tratamento consultivo.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Procedimento</th>
                                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase w-24">Qtd</th>
                                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase w-36">Vlr. Unitário</th>
                                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase w-36">Desc. (R$)</th>
                                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase w-36 text-right">Total</th>
                                                            <th className="p-4 w-12"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedItems.map((item) => (
                                                            <tr key={item.procedureId} className="border-b border-slate-50 last:border-none group hover:bg-slate-50/30 transition-colors">
                                                                <td className="p-4">
                                                                    <p className="font-bold text-slate-700 text-sm">{item.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium italic">Disponível em execução</p>
                                                                </td>
                                                                <td className="p-4">
                                                                    <Input 
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateItem(item.procedureId, 'quantity', parseInt(e.target.value) || 1)}
                                                                        className="h-10 rounded-xl border-slate-100 font-bold text-xs"
                                                                    />
                                                                </td>
                                                                <td className="p-4">
                                                                    <Input 
                                                                        type="number"
                                                                        value={item.unitValue}
                                                                        onChange={(e) => updateItem(item.procedureId, 'unitValue', parseFloat(e.target.value) || 0)}
                                                                        className="h-10 rounded-xl border-slate-100 font-bold text-xs"
                                                                    />
                                                                </td>
                                                                <td className="p-4">
                                                                    <Input 
                                                                        type="number"
                                                                        value={item.discount}
                                                                        onChange={(e) => updateItem(item.procedureId, 'discount', parseFloat(e.target.value) || 0)}
                                                                        className="h-10 rounded-xl border-red-50 bg-red-50/10 font-bold text-xs text-red-600 focus:ring-red-100"
                                                                    />
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <span className="font-black text-slate-700 text-sm">
                                                                        {item.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4">
                                                                    <button 
                                                                        onClick={() => removeItem(item.procedureId)}
                                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Observações */}
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Internas</Label>
                                        <textarea 
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Ex: Condições válidas por 15 dias. Sugerido protocolo full face..."
                                            className="w-full bg-white border border-slate-100 rounded-[1.5rem] p-4 text-sm font-medium min-h-[120px] focus:ring-2 focus:ring-[#697D58]/10 focus:border-[#697D58] outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="approve"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setView('EDIT')}
                                            className="rounded-xl flex gap-2 text-slate-400 font-bold hover:bg-slate-100"
                                        >
                                            <ArrowLeft size={16} /> Voltar para Edição
                                        </Button>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-700">Configuração de Parcelas</h3>
                                            <p className="text-sm text-slate-400 font-medium">Defina como o paciente irá realizar o pagamento deste plano.</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Forma de Recebimento</Label>
                                                    <select 
                                                        className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#697D58]/20"
                                                        value={selectedMethod}
                                                        onChange={(e) => setSelectedMethod(e.target.value)}
                                                    >
                                                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                                                        <option value="PIX">PIX (À Vista)</option>
                                                        <option value="Dinheiro">Dinheiro</option>
                                                        <option value="Boleto">Boleto Bancário</option>
                                                        <option value="Financiamento">Financiamento</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Número de Parcelas</Label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {[1, 2, 3, 4, 6, 8, 10, 12].map(n => (
                                                            <button
                                                                key={n}
                                                                onClick={() => setNumInstallments(n)}
                                                                className={`h-12 rounded-xl font-black text-xs transition-all ${numInstallments === n ? 'bg-[#697D58] text-white shadow-lg shadow-[#697D58]/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                            >
                                                                {n}x
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 overflow-hidden flex flex-col">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cronograma de Recebíveis</p>
                                                <div className="space-y-2 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                                                    {installmentsList.map((inst, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">{idx + 1}</span>
                                                                <span className="text-xs font-bold text-slate-500">{format(inst.dueDate, 'dd/MM/yyyy')}</span>
                                                            </div>
                                                            <span className="font-black text-sm text-[#697D58]">R$ {parseFloat(inst.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center text-[#697D58]">
                                                    <span className="text-xs font-black uppercase tracking-widest">Total do Financeiro</span>
                                                    <span className="text-lg font-black">{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Coluna Direita: Sidebar Financeira */}
                    <div className="w-full lg:w-[380px] bg-white border-l border-slate-100 p-8 flex flex-col shrink-0">
                        <div className="sticky top-0 space-y-8 h-full flex flex-col">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Resumo Financeiro</h3>
                                <div className="bg-[#FAFAFA] rounded-[2.5rem] p-6 border border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-bold">Subtotal Bruto</span>
                                        <span className="text-slate-600 font-black">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-bold">Descontos Itens</span>
                                        <span className="text-red-400 font-black">- {totalIndividualDiscounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black text-[#697D58] uppercase">Desconto Global</Label>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <button 
                                                    onClick={() => setDiscountType('VALUE')}
                                                    className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all ${discountType === 'VALUE' ? 'bg-white text-[#697D58] shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    R$
                                                </button>
                                                <button 
                                                    onClick={() => setDiscountType('PERCENT')}
                                                    className={`px-2 py-0.5 text-[9px] font-black rounded-md transition-all ${discountType === 'PERCENT' ? 'bg-white text-[#697D58] shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    %
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Input 
                                                type="number"
                                                value={globalDiscount}
                                                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                                                className="h-12 rounded-xl bg-white border-slate-200 font-black text-[#697D58] pl-4"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">
                                                {discountType === 'PERCENT' ? '%' : 'FIXO'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t-[3px] border-slate-100 mt-4">
                                        <p className="text-[10px] font-black text-[#697D58] uppercase tracking-widest mb-1 pl-1">Valor Total Final</p>
                                        <motion.p 
                                            key={finalTotal}
                                            initial={{ scale: 1.1, opacity: 0.5 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-4xl font-black text-[#697D58]"
                                        >
                                            {finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </motion.p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1" />

                            <div className="space-y-3">
                                {view === 'EDIT' ? (
                                    <>
                                        <Button 
                                            onClick={() => setView('APPROVE')}
                                            disabled={selectedItems.length === 0 || finalTotal <= 0}
                                            className="w-full h-16 bg-[#697D58] hover:bg-[#556B2F] text-white rounded-2xl font-black flex gap-3 shadow-xl shadow-[#697D58]/20 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            PROSSEGUIR <ChevronRight size={20} />
                                        </Button>
                                        <Button 
                                            variant="ghost"
                                            onClick={() => createAndApproveMutation.mutate({ approve: false })}
                                            disabled={selectedItems.length === 0 || createAndApproveMutation.isPending}
                                            className="w-full h-12 text-slate-400 font-bold hover:text-slate-600 rounded-xl"
                                        >
                                            SALVAR APENAS RASCUNHO
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button 
                                            onClick={() => createAndApproveMutation.mutate({ approve: true })}
                                            disabled={createAndApproveMutation.isPending}
                                            className="w-full h-16 bg-[#697D58] hover:bg-[#556B2F] text-white rounded-2xl font-black flex gap-3 shadow-xl shadow-[#697D58]/20 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {createAndApproveMutation.isPending ? 'PROCESSANDO...' : (
                                                <>
                                                    <CheckCircle2 size={24} /> APROVAR E FINALIZAR
                                                </>
                                            )}
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            className="w-full h-12 rounded-xl flex gap-2 font-black text-slate-500 border-slate-200"
                                            onClick={() => window.print()}
                                        >
                                            <Printer size={18} /> GERAR PDF PROPOSTA
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #e2e8f0;
                        border-radius: 10px;
                    }
                    @media print {
                        .no-print { display: none; }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
};

export default TreatmentPlanModal;
