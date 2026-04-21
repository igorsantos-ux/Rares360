import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Printer, 
    ChevronDown,
    ChevronUp,
    Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "../../../ui/Dialog";
import { Button } from "../../../ui/Button";
import { Badge } from "../../../ui/Badge";
import { toast } from "react-hot-toast";
import TreatmentPlanModal from './TreatmentPlanModal';


const TreatmentPlanModule = ({ patient }: { patient: any }) => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

    // Estados para Aprovação/Parcelamento
    const [numInstallments, setNumInstallments] = useState(1);
    const [selectedMethod, setSelectedMethod] = useState('Cartão de Crédito');

    const installmentsList = Array.from({ length: numInstallments }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        return {
            amount: (selectedPlan?.totalAmount / numInstallments).toFixed(2),
            dueDate: date,
            paymentMethod: selectedMethod
        };
    });

    // Fetch Planos
    const { data: plans, isLoading } = useQuery({
        queryKey: ['treatment-plans', patient.id],
        queryFn: async () => {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/treatment-plans?patientId=${patient.id}`, {
                headers: { 'x-clinic-id': patient.clinicId }
            });
            return response.data;
        }
    });

    // Mutação para Marcar Executado
    const executeMutation = useMutation({
        mutationFn: async ({ itemId, professionalId }: any) => {
            return axios.post(`${import.meta.env.VITE_API_URL}/api/treatment-plans/items/${itemId}/execute`, {
                professionalId
            }, {
                headers: { 'x-clinic-id': patient.clinicId }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
            toast.success("Procedimento marcado como executado!");
        }
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-black text-[10px]">ORÇAMENTO</Badge>;
            case 'APPROVED': return <Badge variant="default" className="bg-emerald-500 text-white border-none font-black text-[10px]">PROPOSTA APROVADA</Badge>;
            case 'CANCELLED': return <Badge variant="destructive" className="bg-red-500 text-white border-none font-black text-[10px]">CANCELADO</Badge>;
            case 'COMPLETED': return <Badge variant="default" className="bg-blue-500 text-white border-none font-black text-[10px]">CONCLUÍDO</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    if (isLoading) return <div className="p-8 text-center">Carregando planos...</div>;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-[#697D58]">Plano de Tratamento</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestão comercial e clínica da jornada</p>
                </div>
                <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#8A9A5B] hover:bg-[#697D58] text-white rounded-2xl px-6 font-bold flex gap-2 shadow-lg shadow-[#8A9A5B]/20"
                >
                    <Plus size={18} /> Novo Orçamento
                </Button>
            </div>

            {plans?.length === 0 ? (
                <div className="border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-[#F5F5DC] rounded-3xl flex items-center justify-center text-[#8A9A5B]">
                        <FileText size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-500 font-bold">Nenhum plano de tratamento encontrado</p>
                        <p className="text-slate-400 text-xs">Crie orçamentos personalizados para transformar consultas em tratamentos.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {plans?.map((plan: any) => (
                        <div 
                            key={plan.id}
                            className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${expandedPlan === plan.id ? 'shadow-2xl border-[#8A9A5B]/30 ring-1 ring-[#8A9A5B]/10' : 'border-[#8A9A5B]/5 shadow-sm hover:shadow-md'}`}
                        >
                            {/* Header do Card */}
                            <div 
                                className="p-5 flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-[1.2rem] ${plan.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-500' : 'bg-[#F5F5DC] text-[#8A9A5B]'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-700 text-sm">PLANO #{plan.id.slice(0, 8).toUpperCase()}</span>
                                            {getStatusBadge(plan.status)}
                                        </div>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                                            {format(new Date(plan.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-slate-400 text-[10px] font-black uppercase">Valor Total</p>
                                        <p className="text-lg font-black text-[#697D58]">
                                            {plan.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                    <div className="p-2 hover:bg-slate-50 rounded-full text-slate-300">
                                        {expandedPlan === plan.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>

                            {/* Conteúdo Expandido */}
                            {expandedPlan === plan.id && (
                                <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="h-px bg-slate-50 w-full mb-4" />
                                    
                                    <div className="grid lg:grid-cols-3 gap-6">
                                        {/* Coluna de Itens */}
                                        <div className="lg:col-span-2 space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Procedimentos & Execução</p>
                                            {plan.items.map((item: any) => (
                                                <div 
                                                    key={item.id}
                                                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${item.status === 'EXECUTED' ? 'bg-slate-50/50 border-slate-100 opacity-70' : 'bg-white border-slate-100 shadow-sm'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.status === 'EXECUTED' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                                            {item.status === 'EXECUTED' ? <Check size={16} /> : <Clock size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold text-sm ${item.status === 'EXECUTED' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                                {item.procedureName}
                                                            </p>
                                                            {item.status === 'EXECUTED' && (
                                                                <p className="text-[9px] text-emerald-600 font-bold uppercase italic">
                                                                    Executado em {format(new Date(item.executedAt), 'dd/MM')} por {item.executedBy?.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-bold text-xs text-slate-500">
                                                            {item.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </span>
                                                        {item.status !== 'EXECUTED' && plan.status === 'APPROVED' && (
                                                            <Button 
                                                                size="sm"
                                                                onClick={() => executeMutation.mutate({ itemId: item.id, professionalId: 'ID-PROF-FIXO' })}
                                                                className="h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border-none rounded-xl text-[10px] font-black"
                                                            >
                                                                EXECUTAR
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Coluna de Ações & Financeiro */}
                                        <div className="space-y-4">
                                            <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] space-y-4">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Rápidas</p>
                                                
                                                <Button 
                                                    variant="outline"
                                                    className="w-full justify-start gap-3 rounded-2xl font-bold text-slate-600 border-slate-200"
                                                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/treatment-plans/${plan.id}/pdf`, '_blank')}
                                                >
                                                    <Printer size={16} className="text-[#8A9A5B]" /> Imprimir PDF elegante
                                                </Button>

                                                {plan.status === 'DRAFT' && (
                                                    <Button 
                                                        className="w-full justify-start gap-3 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                                        onClick={() => { setSelectedPlan(plan); setIsInstallmentModalOpen(true); }}
                                                    >
                                                        <CheckCircle2 size={16} /> Aprovar & Gerar Financeiro
                                                    </Button>
                                                )}

                                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Observações Internas</p>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                                        {plan.notes || "Nenhuma observação registrada."}
                                                    </p>
                                                </div>
                                            </div>

                                            {plan.status === 'APPROVED' && plan.receivables?.length > 0 && (
                                                <div className="p-5 bg-emerald-50/20 border border-emerald-100 rounded-[2rem] space-y-3">
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Status Financeiro</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500 font-bold">Parcelas Total</span>
                                                        <span className="text-sm font-black text-[#697D58]">{plan.receivables.length}x</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500 font-bold">Próx. Vencimento</span>
                                                        <span className="text-xs font-black text-slate-700">
                                                            {format(new Date(plan.receivables[0].dueDate), 'dd/MM/yyyy')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modais */}
            <TreatmentPlanModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                patient={patient}
            />

            {/* Modal de Aprovação / Parcelamento */}
            <Dialog open={isInstallmentModalOpen} onOpenChange={setIsInstallmentModalOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-[#697D58] flex items-center gap-2">
                             Aprovar Plano
                        </DialogTitle>
                    </DialogHeader>
                    

                    <div className="py-4 space-y-4">
                        <p className="text-sm text-slate-500 font-bold">Defina as condições de parcelamento para este plano de tratamento.</p>
                        
                        <div className="grid gap-4">
                            <div className="p-4 bg-[#F5F5DC]/30 border border-[#8A9A5B]/10 rounded-2xl">
                                <p className="text-[10px] font-black text-[#697D58] uppercase">Valor Total do Plano</p>
                                <p className="text-xl font-black text-[#697D58]">
                                    {selectedPlan?.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Forma de Pagamento</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-[#8A9A5B]/20"
                                    value={selectedMethod}
                                    onChange={(e) => setSelectedMethod(e.target.value)}
                                >
                                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                                    <option value="PIX">PIX</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Boleto">Boleto</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Número de Parcelas</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 6, 10, 12].map(n => (
                                        <Button 
                                            key={n} 
                                            variant={numInstallments === n ? 'default' : 'outline'}
                                            onClick={() => setNumInstallments(n)}
                                            className={`rounded-xl font-bold ${numInstallments === n ? 'bg-[#8A9A5B] text-white' : 'border-slate-100'}`}
                                        >
                                            {n}x
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="max-h-40 overflow-y-auto space-y-2 border-t pt-4">
                                {installmentsList.map((inst, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                                        <span>Parcela {idx + 1}</span>
                                        <span>{format(inst.dueDate, 'dd/MM/yy')}</span>
                                        <span className="text-[#697D58]">R$ {inst.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsInstallmentModalOpen(false)}
                            className="rounded-2xl font-bold text-slate-400"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 rounded-2xl shadow-lg shadow-emerald-500/20"
                            onClick={async () => {
                                try {
                                    await axios.post(`${import.meta.env.VITE_API_URL}/api/treatment-plans/${selectedPlan.id}/approve`, {
                                        installments: installmentsList
                                    }, { headers: { 'x-clinic-id': patient.clinicId } });
                                    
                                    toast.success("Plano aprovado e financeiro gerado!");
                                    queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
                                    setIsInstallmentModalOpen(false);
                                } catch (e) {
                                    toast.error("Erro ao aprovar plano.");
                                }
                            }}
                        >
                            Confirmar Aprovação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TreatmentPlanModule;
