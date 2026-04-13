import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '../ui/Sheet';
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
                    {/* Status - HTML SELECT (Failsafe) */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Paciente</Label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full h-12 bg-white border border-[#8A9A5B]/20 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none"
                        >
                            <option value="todos">Todos</option>
                            <option value="ativo">Ativos</option>
                            <option value="inativo">Inativos</option>
                        </select>
                    </div>

                    {/* Aniversário - HTML SELECT */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês de Aniversário</Label>
                        <select
                            value={filters.aniversario}
                            onChange={(e) => setFilters(prev => ({ ...prev, aniversario: e.target.value }))}
                            className="w-full h-12 bg-white border border-[#8A9A5B]/20 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none"
                        >
                            <option value="">Qualquer mês</option>
                            {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
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

                    {/* Última Consulta - HTML SELECT */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recuperação (Última Visita)</Label>
                        <select
                            value={filters.lastVisit}
                            onChange={(e) => setFilters(prev => ({ ...prev, lastVisit: e.target.value }))}
                            className="w-full h-12 bg-white border border-[#8A9A5B]/20 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none"
                        >
                            <option value="">Qualquer data</option>
                            <option value="30-dias">Últimos 30 dias</option>
                            <option value="3-6-meses">Entre 3 a 6 meses</option>
                            <option value="mais-6-meses">Mais de 6 meses (Inativos)</option>
                        </select>
                    </div>

                    {/* Origem - HTML SELECT */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem do Lead</Label>
                        <select
                            value={filters.origem}
                            onChange={(e) => setFilters(prev => ({ ...prev, origem: e.target.value }))}
                            className="w-full h-12 bg-white border border-[#8A9A5B]/20 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-[#8A9A5B]/20 outline-none"
                        >
                            <option value="">Todas as origens</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Google">Google</option>
                            <option value="Indicação">Indicação de Amigo</option>
                            <option value="Passagem">Passagem/Fachada</option>
                            <option value="Outro">Outro</option>
                        </select>
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
