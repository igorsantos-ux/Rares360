import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange, DayPicker } from "react-day-picker";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "../../lib/utils"; // Assumindo que existe, ou usarei clsx direto

export interface DateRangePickerProps {
    className?: string;
    value: { startDate: string; endDate: string };
    onChange: (range: { startDate: string; endDate: string }) => void;
}

export function DateRangePicker({ className, value, onChange }: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false);

    // Converter string para Date para o DayPicker
    const range: DateRange | undefined = {
        from: value.startDate ? new Date(value.startDate) : undefined,
        to: value.endDate ? new Date(value.endDate) : undefined,
    };

    const handleSelect = (newRange: DateRange | undefined) => {
        if (newRange?.from) {
            const startDate = format(newRange.from, "yyyy-MM-dd");
            const endDate = newRange.to ? format(newRange.to, "yyyy-MM-dd") : startDate;
            onChange({ startDate, endDate });
        }
    };

    const presets = [
        { label: "Hoje", getValue: () => ({ from: new Date(), to: new Date() }) },
        { label: "Últimos 7 dias", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
        { label: "Este Mês", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
        { label: "Mês Passado", getValue: () => {
            const lastMonth = subDays(startOfMonth(new Date()), 1);
            return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        }},
        { label: "Ano Atual", getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
    ];

    const applyPreset = (presetFn: () => { from: Date; to: Date }) => {
        const { from, to } = presetFn();
        onChange({ startDate: format(from, "yyyy-MM-dd"), endDate: format(to, "yyyy-MM-dd") });
        setOpen(false);
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        id="date"
                        className={cn(
                            "w-[300px] justify-start text-left font-bold flex items-center gap-3 px-5 py-3 bg-[#FCFDFB] border border-[#8A9A5B]/20 rounded-2xl text-slate-600 hover:bg-[#8A9A5B]/5 transition-all shadow-sm",
                            !range && "text-slate-400"
                        )}
                    >
                        <CalendarIcon className="mr-0 h-4 w-4 text-[#556B2F]" />
                        {range?.from ? (
                            range.to ? (
                                <>
                                    {format(range.from, "dd/MM/yy")} - {format(range.to, "dd/MM/yy")}
                                </>
                            ) : (
                                format(range.from, "dd/MM/yy")
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}
                        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        className="z-[100] w-auto bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-0 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200"
                        align="end"
                    >
                        {/* Sidebar Presets */}
                        <div className="p-4 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-1 w-full md:w-[160px] bg-slate-50/50 rounded-t-[2rem] md:rounded-tr-none md:rounded-l-[2rem]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Atalhos</p>
                            {presets.map((p) => (
                                <button
                                    key={p.label}
                                    onClick={() => applyPreset(p.getValue)}
                                    className="text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#8A9A5B]/10 hover:text-[#556B2F] transition-colors"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Calendar */}
                        <div className="p-4">
                            <DayPicker
                                mode="range"
                                defaultMonth={range?.from}
                                selected={range}
                                onSelect={handleSelect}
                                numberOfMonths={2}
                                locale={ptBR}
                                classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center px-8",
                                    caption_label: "text-sm font-black text-slate-700",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-slate-400 rounded-md w-9 font-black text-[10px] uppercase",
                                    row: "flex w-full mt-2",
                                    cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                                    day: "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-slate-100 rounded-xl transition-colors",
                                    day_range_start: "bg-[#556B2F] text-white rounded-l-xl rounded-r-none",
                                    day_range_end: "bg-[#556B2F] text-white rounded-r-xl rounded-l-none",
                                    day_range_middle: "bg-[#8A9A5B]/10 text-[#556B2F] rounded-none",
                                    day_selected: "bg-[#556B2F] text-white hover:bg-[#556B2F] hover:text-white focus:bg-[#556B2F] focus:text-white",
                                    day_today: "text-[#556B2F] border-b-2 border-dotted border-[#556B2F]",
                                    day_outside: "text-slate-300 opacity-50",
                                    day_disabled: "text-slate-400 opacity-50",
                                    day_hidden: "invisible",
                                }}
                            />
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2 px-2">
                                <button 
                                    onClick={() => setOpen(false)}
                                    className="px-6 py-2.5 bg-[#556B2F] text-white rounded-xl font-black text-xs shadow-lg shadow-[#556B2F]/20 hover:brightness-110 active:scale-95 transition-all"
                                >
                                    Confirmar Período
                                </button>
                            </div>
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
