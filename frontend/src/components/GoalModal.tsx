import React, { useState, useEffect } from 'react';
import { Target, Save, Loader2, Info, Plus, Trash2, Edit2, TrendingUp, Package, Activity } from 'lucide-react';
import { goalsApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import CurrencyInput from 'react-currency-input-field';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/Dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/Select";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Switch } from "./ui/Switch";

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear + i).toString(),
    label: (currentYear + i).toString(),
}));

type GoalType = 'COMERCIAL' | 'ESTOQUE' | 'OPERACIONAL';

interface Goal {
    id?: string;
    name: string;
    type: GoalType;
    targetValue: number;
    workingDays: number;
    isPrimary: boolean;
    monthYear: string;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose }) => {
    const now = new Date();
    const [month, setMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(now.getFullYear().toString());
    
    // Form State
    const [goalId, setGoalId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<GoalType>('COMERCIAL');
    const [targetValue, setTargetValue] = useState<number | undefined>(0);
    const [workingDays, setWorkingDays] = useState('22');
    const [isPrimary, setIsPrimary] = useState(false);
    
    const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const queryClient = useQueryClient();

    const fetchGoals = async () => {
        try {
            setIsLoading(true);
            const monthYear = `${month}-${year}`;
            const response = await goalsApi.getList(monthYear);
            setMonthlyGoals(response.data);
            
            // Se houver metas, mas nenhuma marcada como primária no state atual (reset)
            if (response.data.length === 0) {
                setIsPrimary(true); // Primeira meta de um mês novo costuma ser a primária
            } else {
                setIsPrimary(false);
            }
        } catch (error) {
            console.error('Erro ao buscar metas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchGoals();
        }
    }, [isOpen, month, year]);

    const resetForm = () => {
        setGoalId(null);
        setName('');
        setType('COMERCIAL');
        setTargetValue(0);
        setWorkingDays('22');
        setIsPrimary(monthlyGoals.length === 0);
    };

    const handleEdit = (goal: Goal) => {
        setGoalId(goal.id || null);
        setName(goal.name);
        setType(goal.type);
        setTargetValue(goal.targetValue);
        setWorkingDays(goal.workingDays.toString());
        setIsPrimary(goal.isPrimary);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
        
        try {
            await goalsApi.delete(id);
            await queryClient.invalidateQueries({ queryKey: ['monthly-goal-stats'] });
            await queryClient.invalidateQueries({ queryKey: ['monthly-goals-list'] });
            toast.success('Meta excluída com sucesso');
            fetchGoals();
        } catch (error) {
            toast.error('Erro ao excluir meta');
        }
    };

    const handleSave = async () => {
        if (!name) {
            toast.error("Por favor, dê um nome para a meta.");
            return;
        }
        if (!targetValue || targetValue <= 0) {
            toast.error("Por favor, insira um valor alvo válido.");
            return;
        }

        try {
            setIsSaving(true);
            const monthYear = `${month}-${year}`;
            
            await goalsApi.save({
                id: goalId,
                name,
                type,
                targetValue,
                workingDays: parseInt(workingDays),
                monthYear,
                isPrimary
            });

            await queryClient.invalidateQueries({ queryKey: ['monthly-goal-stats'] });
            await queryClient.invalidateQueries({ queryKey: ['monthly-goals-list'] });
            toast.success(goalId ? "Meta atualizada!" : "Nova meta criada!", {
                style: { borderRadius: '1rem', background: '#697D58', color: '#fff' },
            });
            
            resetForm();
            fetchGoals();
        } catch (error) {
            console.error('Erro ao salvar meta:', error);
            toast.error('Erro ao salvar planejamento.');
        } finally {
            setIsSaving(false);
        }
    };

    const getTypeIcon = (type: GoalType) => {
        switch (type) {
            case 'COMERCIAL': return <TrendingUp size={16} className="text-emerald-500" />;
            case 'ESTOQUE': return <Package size={16} className="text-amber-500" />;
            case 'OPERACIONAL': return <Activity size={16} className="text-blue-500" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] gap-0 p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-[#697D58] text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Target size={24} className="text-[#DEB587]" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Planejamento de Ciclo</DialogTitle>
                            <DialogDescription className="text-white/70">
                                Gerencie os objetivos estratégicos e operacionais da clínica.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-5 h-[600px]">
                    {/* Lateral: Lista de Metas */}
                    <div className="md:col-span-2 border-r bg-slate-50/50 overflow-y-auto p-4 space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metas do Período</span>
                            <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 w-7 p-0 rounded-full">
                                <Plus size={14} />
                            </Button>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-10 scale-75 opacity-20"><Loader2 className="animate-spin" /></div>
                        ) : monthlyGoals.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-xs text-slate-400">Nenhuma meta definida para {month}/{year}</p>
                            </div>
                        ) : (
                            monthlyGoals.map(goal => (
                                <div 
                                    key={goal.id}
                                    onClick={() => handleEdit(goal)}
                                    className={cn(
                                        "group relative p-3 rounded-xl border transition-all cursor-pointer",
                                        goal.isPrimary ? "bg-white border-[#697D58]/30 shadow-sm" : "bg-white/50 border-slate-200 hover:border-slate-300",
                                        goalId === goal.id && "ring-2 ring-[#697D58]"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getTypeIcon(goal.type)}
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{goal.type}</span>
                                        </div>
                                        {goal.isPrimary && (
                                            <span className="bg-[#697D58] text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Principal</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 truncate mb-1">{goal.name}</p>
                                    <p className="text-xs font-medium text-[#697D58]">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.targetValue)}
                                    </p>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(goal.id!); }}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Principal: Formulário */}
                    <div className="md:col-span-3 p-6 overflow-y-auto bg-white">
                        <div className="space-y-6">
                            {/* Seletor de Período */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mês</Label>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11 focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ano</Label>
                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11 focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Detalhes da Meta */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nome do Objetivo</Label>
                                    <Input 
                                        placeholder="Ex: Expansão Comercial" 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="rounded-xl bg-slate-50 border-none h-12 text-lg font-bold placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-[#697D58]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo</Label>
                                        <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                                            <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11 focus:ring-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="COMERCIAL">Comercial</SelectItem>
                                                <SelectItem value="ESTOQUE">Estoque</SelectItem>
                                                <SelectItem value="OPERACIONAL">Operacional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dias Úteis</Label>
                                        <Input 
                                            type="number"
                                            value={workingDays}
                                            onChange={e => setWorkingDays(e.target.value)}
                                            className="rounded-xl bg-slate-50 border-none h-11 font-bold focus-visible:ring-1 focus-visible:ring-[#697D58]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Valor Alvo</Label>
                                    <div className="relative">
                                        <CurrencyInput
                                            placeholder="R$ 0,00"
                                            decimalsLimit={2}
                                            decimalSeparator=","
                                            groupSeparator="."
                                            prefix="R$ "
                                            value={targetValue}
                                            onValueChange={(value) => setTargetValue(value ? parseFloat(value.replace(',', '.')) : 0)}
                                            className="w-full bg-[#697D58]/5 border-none rounded-2xl p-6 text-3xl font-black text-[#697D58] focus:outline-none focus:ring-2 focus:ring-[#697D58]/20 transition-all"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                            <TrendingUp size={32} className="text-[#697D58]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold text-slate-700">Meta Principal</Label>
                                        <p className="text-[10px] text-slate-400 leading-tight">Esta meta regerá os indicadores do painel principal.</p>
                                    </div>
                                    <Switch 
                                        checked={isPrimary}
                                        onCheckedChange={setIsPrimary}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-white border-t">
                    <div className="flex w-full gap-3">
                        <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold text-slate-400" onClick={onClose}>
                            Fechar
                        </Button>
                        <Button 
                            className="flex-[2] rounded-xl h-12 bg-[#697D58] hover:bg-[#5a6b4b] text-white font-bold"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    {goalId ? 'Atualizar Objetivo' : 'Criar Objetivo'}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default GoalModal;
