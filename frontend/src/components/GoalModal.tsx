import React, { useState } from 'react';
import { Target, Calendar, Save, Loader2, Info } from 'lucide-react';
import { goalsApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import CurrencyInput from 'react-currency-input-field';
import toast from 'react-hot-toast';

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

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentGoal: number;
    currentWorkingDays: number;
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

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, currentGoal, currentWorkingDays }) => {
    const now = new Date();
    const [month, setMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(now.getFullYear().toString());
    const [revenueTarget, setRevenueTarget] = useState<number | undefined>(currentGoal);
    const [workingDays, setWorkingDays] = useState(currentWorkingDays.toString());
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    const handleSave = async () => {
        if (!revenueTarget || revenueTarget <= 0) {
            toast.error("Por favor, insira uma meta válida.");
            return;
        }

        try {
            setIsSaving(true);
            const monthYear = `${month}-${year}`;
            
            await goalsApi.update({
                revenueTarget,
                workingDays: parseInt(workingDays),
                monthYear
            });

            await queryClient.invalidateQueries({ queryKey: ['monthly-goal-stats'] });
            toast.success("🎯 Meta do ciclo atualizada com sucesso!", {
                style: {
                    borderRadius: '1rem',
                    background: '#697D58',
                    color: '#fff',
                    fontWeight: 'bold'
                },
            });
            onClose();
        } catch (error) {
            console.error('Erro ao salvar meta:', error);
            toast.error('Ocorreu um erro ao salvar o planejamento.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <Target size={20} className="text-[#DEB587]" />
                        </div>
                        <div>
                            <DialogTitle>Planejamento de Metas</DialogTitle>
                            <DialogDescription>
                                Defina o objetivo financeiro e os dias operacionais do ciclo.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    {/* Período do Ciclo */}
                    <div className="space-y-4">
                        <Label>Período do Ciclo</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mês" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y.value} value={y.value}>
                                            {y.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Meta Financeira */}
                    <div className="space-y-4">
                        <Label>Meta de Faturamento (O Core)</Label>
                        <div className="relative group">
                            <CurrencyInput
                                id="revenue-target"
                                name="revenue-target"
                                placeholder="R$ 0,00"
                                decimalsLimit={2}
                                decimalSeparator=","
                                groupSeparator="."
                                prefix="R$ "
                                value={revenueTarget}
                                onValueChange={(value) => setRevenueTarget(value ? parseFloat(value.replace(',', '.')) : 0)}
                                className="w-full bg-slate-50 border border-input rounded-2xl p-6 text-3xl font-black text-[#697D58] focus:outline-none focus:ring-4 focus:ring-[#8A9A5B]/10 focus:border-[#8A9A5B] transition-all"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                                <Target size={24} className="text-[#8A9A5B]" />
                            </div>
                        </div>
                    </div>

                    {/* Dias Úteis */}
                    <div className="space-y-3">
                        <Label>Dias Úteis de Operação</Label>
                        <Input 
                            type="number" 
                            min="1"
                            max="31"
                            value={workingDays}
                            onChange={(e) => setWorkingDays(e.target.value)}
                            className="bg-slate-50 border-input h-14 text-lg font-bold"
                        />
                        <p className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <Info size={12} className="text-[#8A9A5B]" />
                            Usado para calcular o ritmo diário necessário.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <div className="w-full flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 rounded-2xl font-bold text-slate-400 hover:text-slate-600 h-14"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="olive"
                            size="xl"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] h-14"
                        >
                            {isSaving ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} className="mr-2" />
                                    Salvar Planejamento
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
