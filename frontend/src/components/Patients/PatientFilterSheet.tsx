import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '../ui/Sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Filter } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
}

const MONTHS = [
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

export function PatientFilterSheet({ open, onClose }: Props) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Local state for the drawer before applying
    const [filters, setFilters] = React.useState({
        status: searchParams.get('status') || 'todos',
        aniversario: searchParams.get('aniversario') || '',
        ltvMin: searchParams.get('ltvMin') || '',
        ltvMax: searchParams.get('ltvMax') || '',
        lastVisit: searchParams.get('lastVisit') || '',
        origem: searchParams.get('origem') || '',
    });

    const handleApply = () => {
        const newParams = new URLSearchParams(searchParams);

        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'todos') {
                newParams.set(key, value);
            } else {
                newParams.delete(key);
            }
        });

        setSearchParams(newParams);
        onClose();
    };

    const handleClear = () => {
        setFilters({
            status: 'todos',
            aniversario: '',
            ltvMin: '',
            ltvMax: '',
            lastVisit: '',
            origem: '',
        });
        const newParams = new URLSearchParams(searchParams);
        ['status', 'aniversario', 'ltvMin', 'ltvMax', 'lastVisit', 'origem'].forEach(k => newParams.delete(k));
        setSearchParams(newParams);
        onClose();
    };

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader className="pb-6 border-b border-[#8A9A5B]/10">
                    <div className="flex items-center gap-2 text-[#697D58]">
                        <Filter size={20} />
                        <SheetTitle className="text-[#697D58] font-black uppercase tracking-tight">Filtros Avançados</SheetTitle>
                    </div>
                </SheetHeader>

                <div className="py-8 space-y-8">
                    {/* Status */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Paciente</Label>
                        <RadioGroup
                            value={filters.status}
                            onValueChange={(v: string) => setFilters(prev => ({ ...prev, status: v }))}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="todos" id="todos" />
                                <Label htmlFor="todos" className="text-sm font-medium">Todos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ativo" id="ativo" />
                                <Label htmlFor="ativo" className="text-sm font-medium">Ativos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inativo" id="inativo" />
                                <Label htmlFor="inativo" className="text-sm font-medium">Inativos</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Aniversário */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês de Aniversário</Label>
                        <Select
                            value={filters.aniversario}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, aniversario: v }))}
                        >
                            <SelectTrigger className="w-full bg-white border-[#8A9A5B]/20 rounded-xl">
                                <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Qualquer mês</SelectItem>
                                {MONTHS.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* LTV Range */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faixa de LTV (Lifetime Value)</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Mínimo</span>
                                <Input
                                    type="number"
                                    placeholder="R$ 0"
                                    className="bg-white border-[#8A9A5B]/20 rounded-xl"
                                    value={filters.ltvMin}
                                    onChange={(e) => setFilters(prev => ({ ...prev, ltvMin: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Máximo</span>
                                <Input
                                    type="number"
                                    placeholder="R$ ∞"
                                    className="bg-white border-[#8A9A5B]/20 rounded-xl"
                                    value={filters.ltvMax}
                                    onChange={(e) => setFilters(prev => ({ ...prev, ltvMax: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Última Consulta */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recuperação (Última Visita)</Label>
                        <Select
                            value={filters.lastVisit}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, lastVisit: v }))}
                        >
                            <SelectTrigger className="w-full bg-white border-[#8A9A5B]/20 rounded-xl">
                                <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Qualquer data</SelectItem>
                                <SelectItem value="30-dias">Últimos 30 dias</SelectItem>
                                <SelectItem value="3-6-meses">Entre 3 a 6 meses</SelectItem>
                                <SelectItem value="mais-6-meses">Mais de 6 meses (Inativos)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Origem */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem do Lead</Label>
                        <Select
                            value={filters.origem}
                            onValueChange={(v) => setFilters(prev => ({ ...prev, origem: v }))}
                        >
                            <SelectTrigger className="w-full bg-white border-[#8A9A5B]/20 rounded-xl">
                                <SelectValue placeholder="Selecione a origem" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todas as origens</SelectItem>
                                <SelectItem value="Instagram">Instagram</SelectItem>
                                <SelectItem value="Google">Google</SelectItem>
                                <SelectItem value="Indicação">Indicação de Amigo</SelectItem>
                                <SelectItem value="Passagem">Passagem/Fachada</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <SheetFooter className="mt-8 pt-6 border-t border-[#8A9A5B]/10 grid grid-cols-2 gap-4">
                    <button
                        onClick={handleClear}
                        className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                    >
                        Limpar Filtros
                    </button>
                    <button
                        onClick={handleApply}
                        className="w-full py-4 bg-[#8A9A5B] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Aplicar Filtros
                    </button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
