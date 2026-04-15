import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '../../services/api';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '../ui/Sheet';
import {
    DollarSign,
    Hash,
    TrendingUp,
    Loader2,
    Download,
    MessageCircle,
    User,
    Stethoscope,
    Calendar,
    ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DrillDownSheetProps {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    value: string;
    dateRange: { startDate: string; endDate: string };
}

const TYPE_LABELS: Record<string, string> = {
    PROCEDURE: 'Procedimento',
    DOCTOR: 'Médico',
    CATEGORY: 'Categoria',
    ORIGIN: 'Origem',
    PAYMENT_METHOD: 'Forma de Pagamento'
};

export function DrillDownSheet({ isOpen, onClose, type, value, dateRange }: DrillDownSheetProps) {
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['drill-down', type, value, dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            const res = await reportingApi.getDrillDown({
                type,
                value,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });
            return res.data;
        },
        enabled: isOpen && !!type && !!value
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
        } catch { return '---'; }
    };

    const handleExportCSV = () => {
        if (!data?.items?.length) return;

        const headers = ['Data', 'Paciente', 'Procedimento', 'Médico', 'Forma Pgto', 'Valor'];
        const rows = data.items.map((item: any) => [
            formatDate(item.date),
            item.patientName,
            item.procedureName || item.description,
            item.doctorName,
            item.paymentMethod,
            item.amount.toFixed(2).replace('.', ',')
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(';')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `drill-down-${value.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const summary = data?.summary || { total: 0, count: 0, averageTicket: 0 };
    const items = data?.items || [];

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-2xl w-[95%] flex flex-col p-0 overflow-hidden">
                {/* Header Premium */}
                <div className="bg-gradient-to-br from-[#697D58] to-[#8A9A5B] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <SheetHeader className="relative z-10">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">
                            {TYPE_LABELS[type.toUpperCase()] || type} • Drill-Down
                        </p>
                        <SheetTitle className="text-2xl font-black text-white truncate">
                            {value}
                        </SheetTitle>
                        <SheetDescription className="text-white/0 text-[1px]">
                            Detalhamento de {value}
                        </SheetDescription>
                    </SheetHeader>

                    {/* KPI Badges */}
                    <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                            <DollarSign size={14} className="mx-auto mb-1 opacity-70" />
                            <p className="text-lg font-black leading-tight">{formatCurrency(summary.total)}</p>
                            <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-1">Total</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                            <Hash size={14} className="mx-auto mb-1 opacity-70" />
                            <p className="text-lg font-black leading-tight">{summary.count}</p>
                            <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-1">Sessões</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                            <TrendingUp size={14} className="mx-auto mb-1 opacity-70" />
                            <p className="text-lg font-black leading-tight">{formatCurrency(summary.averageTicket)}</p>
                            <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-1">Ticket</p>
                        </div>
                    </div>
                </div>

                {/* Body - Scrollable List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-[#8A9A5B]" size={32} />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando detalhes...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <DollarSign size={32} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">Nenhuma transação encontrada para este filtro.</p>
                        </div>
                    ) : (
                        items.map((item: any, idx: number) => (
                            <div
                                key={item.id || idx}
                                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-[#8A9A5B]/20 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Patient + Navigate */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <User size={14} className="text-[#8A9A5B] shrink-0" />
                                            <button
                                                onClick={() => item.patientId && navigate(`/pacientes/${item.patientId}`)}
                                                className="text-sm font-black text-slate-800 hover:text-[#8A9A5B] truncate transition-colors text-left"
                                                title="Ir para prontuário"
                                            >
                                                {item.patientName}
                                            </button>
                                            {item.patientId && (
                                                <ExternalLink size={10} className="text-slate-300 group-hover:text-[#8A9A5B] transition-colors shrink-0" />
                                            )}
                                        </div>

                                        {/* Details Row */}
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400">
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                                                <Calendar size={10} />
                                                {formatDate(item.date)}
                                            </span>
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                                                <Stethoscope size={10} />
                                                {item.doctorName}
                                            </span>
                                            {item.procedureName && (
                                                <span className="bg-[#8A9A5B]/10 text-[#697D58] px-2 py-1 rounded-lg uppercase tracking-wider">
                                                    {item.procedureName}
                                                </span>
                                            )}
                                            <span className="bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                {item.paymentMethod}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right shrink-0">
                                        <p className="text-base font-black text-[#697D58]">{formatCurrency(item.amount)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer - Actions */}
                <SheetFooter className="p-6 bg-white border-t border-slate-100">
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleExportCSV}
                            disabled={!items.length}
                            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] bg-[#8A9A5B] text-white hover:bg-[#697D58] shadow-xl shadow-[#8A9A5B]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                        >
                            <Download size={16} />
                            Exportar CSV
                        </button>
                        <button
                            disabled
                            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] bg-emerald-50 text-emerald-600 border-2 border-emerald-100 cursor-not-allowed opacity-60"
                            title="Funcionalidade em desenvolvimento"
                        >
                            <MessageCircle size={16} />
                            WhatsApp (Em Breve)
                        </button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
