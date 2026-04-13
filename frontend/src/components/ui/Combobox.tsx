import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./Popover"

interface ComboboxProps {
    options: { value: string; label: string; rightLabel?: string }[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Selecione...",
    searchPlaceholder = "Buscar...",
    emptyMessage = "Nenhum resultado encontrado.",
    disabled,
    isLoading,
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const selectedOption = options.find((option) => option.value === value)

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled || isLoading}
                    className={cn(
                        "flex h-12 w-full items-center justify-between rounded-2xl border border-input bg-slate-50 px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 focus:border-[#8A9A5B] disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium text-left",
                        className
                    )}
                >
                    <span className="truncate">
                        {isLoading ? (
                            <span className="flex items-center gap-2 text-slate-400">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Carregando...
                            </span>
                        ) : selectedOption ? (
                            selectedOption.label
                        ) : (
                            <span className="text-slate-400 font-semibold">{placeholder}</span>
                        )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-slate-100 overflow-hidden" align="start">
                <div className="flex flex-col h-full max-h-[300px]">
                    <div className="flex items-center border-b px-3 bg-slate-50/50">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 font-semibold"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="overflow-y-auto p-2">
                        {filteredOptions.length === 0 ? (
                            <p className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                {emptyMessage}
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onValueChange(option.value)
                                            setOpen(false)
                                            setSearch("")
                                        }}
                                        className={cn(
                                            "relative flex w-full cursor-default select-none items-center rounded-xl py-3 px-4 text-sm font-bold outline-none hover:bg-[#8A9A5B]/5 hover:text-[#697D58] transition-colors text-left group",
                                            value === option.value && "bg-[#8A9A5B]/10 text-[#697D58]"
                                        )}
                                    >
                                        <div className="flex flex-1 items-center justify-between gap-4">
                                            <span className="truncate">{option.label}</span>
                                            {option.rightLabel && (
                                                <span className="text-[10px] text-slate-300 group-hover:text-[#8A9A5B]/60 transition-colors whitespace-nowrap font-black uppercase tracking-tighter">
                                                    {option.rightLabel}
                                                </span>
                                            )}
                                        </div>
                                        {value === option.value && (
                                            <Check className="ml-2 h-4 w-4 shrink-0 text-[#8A9A5B]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
