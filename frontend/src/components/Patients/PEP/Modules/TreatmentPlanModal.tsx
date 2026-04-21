import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "../../../ui/Dialog";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { Label } from "../../../ui/Label";
import { Badge } from "../../../ui/Badge";
import { 
    Search, 
    Plus, 
    Trash2, 
    Calculator,
    Info
} from 'lucide-react';
import { toast } from "react-hot-toast";

interface TreatmentPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: any;
}

const TreatmentPlanModal = ({ isOpen, onClose, patient }: TreatmentPlanModalProps) => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [notes, setNotes] = useState('');

    // Fetch Procedimentos
    const { data: procedures } = useQuery({
        queryKey: ['procedures', searchTerm],
        queryFn: async () => {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/procedures?search=${searchTerm}`, {
                headers: { 'x-clinic-id': patient.clinicId }
            });
            // Dependendo da API, pode vir em response.data.items ou apenas response.data
            return response.data.items || response.data;
        },
        enabled: searchTerm.length > 2
    });

    const addItem = (proc: any) => {
        if (selectedItems.find(item => item.procedureId === proc.id)) {
            toast.error("Este procedimento já foi adicionado.");
            return;
        }
        setSelectedItems([...selectedItems, {
            procedureId: proc.id,
            name: proc.name,
            unitValue: proc.basePrice || proc.currentPrice || 0,
            discount: 0,
            finalValue: proc.basePrice || proc.currentPrice || 0,
            quantity: 1
        }]);
        setSearchTerm('');
    };

    const removeItem = (id: string) => {
        setSelectedItems(selectedItems.filter(item => item.procedureId !== id));
    };

    const updateItem = (id: string, field: string, value: number) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.procedureId === id) {
                const newItem = { ...item, [field]: value };
                if (field === 'discount' || field === 'unitValue') {
                    newItem.finalValue = newItem.unitValue - (newItem.discount || 0);
                }
                return newItem;
            }
            return item;
        }));
    };

    const totalAmount = selectedItems.reduce((acc, item) => acc + item.finalValue, 0);

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return axios.post(`${import.meta.env.VITE_API_URL}/api/treatment-plans`, data, {
                headers: { 'x-clinic-id': patient.clinicId }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
            toast.success("Orçamento criado com sucesso!");
            onClose();
            setSelectedItems([]);
            setNotes('');
        },
        onError: () => {
            toast.error("Erro ao criar orçamento.");
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-[#8A9A5B] p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black flex items-center gap-3">
                            <Calculator size={32} /> Novo Orçamento
                        </DialogTitle>
                        <p className="text-[#F5F5DC] font-bold text-xs uppercase tracking-[0.2em] opacity-80">
                            Paciente: {patient.fullName}
                        </p>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
                    {/* Busca de Procedimentos */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Procedimentos</Label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input 
                                placeholder="Digite o nome do procedimento (ex: Toxina, Preenchimento...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-[#8A9A5B]/20"
                            />
                        </div>

                        {/* Dropdown de Resultados */}
                        {searchTerm.length > 2 && procedures && (
                            <div className="bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                {procedures.length === 0 ? (
                                    <p className="p-4 text-center text-slate-400 text-sm">Nenhum procedimento encontrado.</p>
                                ) : (
                                    procedures.map((proc: any) => (
                                        <button
                                            key={proc.id}
                                            onClick={() => addItem(proc)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-[#F5F5DC]/50 transition-colors border-b border-slate-50 last:border-none"
                                        >
                                            <div className="text-left">
                                                <p className="font-bold text-slate-700">{proc.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{proc.category}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-black text-[#8A9A5B]">
                                                    {proc.basePrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                                                </span>
                                                <div className="p-2 bg-[#8A9A5B] text-white rounded-xl">
                                                    <Plus size={14} />
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lista de Itens Selecionados */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens do Orçamento</Label>
                            <Badge variant="outline" className="rounded-lg text-[10px] font-black border-[#8A9A5B]/20 text-[#697D58]">
                                {selectedItems.length} ITEM(S)
                            </Badge>
                        </div>

                        {selectedItems.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                <Info size={24} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-slate-400 text-xs font-bold font-italic">Busque e adicione procedimentos acima para começar.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedItems.map((item) => (
                                    <div key={item.procedureId} className="flex flex-col gap-3 p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm animate-in zoom-in-95 duration-200">
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-slate-700">{item.name}</span>
                                            <button 
                                                onClick={() => removeItem(item.procedureId)}
                                                className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase">Valor Unit.</label>
                                                <Input 
                                                    type="number"
                                                    value={item.unitValue}
                                                    onChange={(e) => updateItem(item.procedureId, 'unitValue', parseFloat(e.target.value))}
                                                    className="h-10 rounded-xl font-bold bg-slate-50/50"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase text-red-400">Desconto (R$)</label>
                                                <Input 
                                                    type="number"
                                                    value={item.discount}
                                                    onChange={(e) => updateItem(item.procedureId, 'discount', parseFloat(e.target.value))}
                                                    className="h-10 rounded-xl font-bold bg-red-50/20 border-red-100 focus:ring-red-100"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase">Final (R$)</label>
                                                <div className="h-10 flex items-center px-3 bg-emerald-50 text-emerald-700 font-black rounded-xl border border-emerald-100 text-sm">
                                                    {item.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações do Orçamento</Label>
                        <textarea 
                            className="w-full p-4 bg-slate-50 border-slate-100 rounded-2xl font-bold text-sm min-h-[100px] focus:ring-[#8A9A5B]/20 outline-none"
                            placeholder="Ex: Condições válidas por 15 dias, recomenda-se realizar logo após limpeza de pele..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer Resumo */}
                <div className="bg-slate-50 p-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumo do Orçamento</p>
                        <p className="text-3xl font-black text-[#697D58]">
                            {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="rounded-2xl font-bold text-slate-400 hover:bg-slate-200"
                        >
                            CANCELAR
                        </Button>
                        <Button 
                            disabled={selectedItems.length === 0 || createMutation.isPending}
                            onClick={() => createMutation.mutate({
                                patientId: patient.id,
                                totalAmount,
                                notes,
                                items: selectedItems
                            })}
                            className="bg-[#8A9A5B] hover:bg-[#697D58] text-white font-black px-10 rounded-2xl shadow-xl shadow-[#8A9A5B]/20 h-14"
                        >
                            {createMutation.isPending ? 'SALVANDO...' : 'SAlVAR ORÇAMENTO'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TreatmentPlanModal;
