import { useQuery } from '@tanstack/react-query';
import { coreApi } from '../../../../services/api';
import {
    History,
    FileText,
    CreditCard,
    Search,
    Clock,
    User,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '../../../ui/Input';

export const HistoryModule = ({ patient }: { patient: any }) => {
    const { data: history, isLoading } = useQuery({
        queryKey: ['patientHistory', patient?.id],
        queryFn: () => coreApi.getPatientHistory(patient.id).then(res => res.data),
        enabled: !!patient?.id
    });

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                <div className="h-8 w-48 bg-slate-50 rounded-lg animate-pulse mb-8" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-slate-50 rounded-[2rem] animate-pulse" />
                ))}
            </div>
        );
    }

    const isEmpty = !history || history.length === 0;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header com Busca */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#F5F5DC] text-[#8A9A5B] rounded-2xl shadow-inner shadow-[#8A9A5B]/10">
                        <History size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-700 tracking-tight text-xl leading-tight">Histórico de Consultas</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Procedimentos e faturamentos históricos</p>
                    </div>
                </div>

                <div className="relative w-full md:w-72">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <Input
                        placeholder="Filtrar histórico..."
                        className="pl-12 bg-slate-50 border-transparent focus:bg-white transition-all h-12 rounded-2xl font-bold text-slate-600"
                    />
                </div>
            </div>

            {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-sm">
                        <History size={40} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-700 text-lg">Nenhum histórico encontrado</h4>
                        <p className="text-slate-400 text-sm font-medium mt-1">Este paciente ainda não possui registros de faturamento no sistema.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item: any) => (
                        <div
                            key={item.id}
                            className="bg-white border border-slate-100 p-6 rounded-[2rem] hover:shadow-xl hover:shadow-[#8A9A5B]/5 hover:border-[#8A9A5B]/20 transition-all group cursor-pointer"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                {/* Data */}
                                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl min-w-[80px] group-hover:bg-[#F5F5DC] transition-colors">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none group-hover:text-[#8A9A5B]">
                                        {format(new Date(item.date), 'MMM', { locale: ptBR })}
                                    </span>
                                    <span className="text-2xl font-black text-slate-700 leading-none mt-1 group-hover:text-[#697D58]">
                                        {format(new Date(item.date), 'dd')}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 mt-1 leading-none group-hover:text-[#8A9A5B]">
                                        {format(new Date(item.date), 'yyyy')}
                                    </span>
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-black text-slate-700 text-lg tracking-tight group-hover:text-[#697D58] transition-colors leading-tight">
                                                {item.procedureName || item.description || 'Consulta / Procedimento'}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    <Clock size={12} />
                                                    {format(new Date(item.date), 'HH:mm')}
                                                </div>
                                                {item.category && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        <FileText size={12} />
                                                        {item.category}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                                            <p className="text-xl font-black text-slate-700 group-hover:text-emerald-600 transition-colors">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                                    <CreditCard size={12} />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-500">{item.paymentMethod || 'Cartão / Dinheiro'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
                                                <div className="w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-500">Histórico Importado</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#8A9A5B] opacity-0 group-hover:opacity-100 transition-all font-black text-[10px] uppercase tracking-widest">
                                            <span>Ver Detalhes</span>
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Banner Informativo */}
            <div className="bg-[#697D58] rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                    <ArrowUpRight size={120} />
                </div>
                <div className="relative z-10 space-y-2">
                    <h4 className="text-xl font-black tracking-tight">Análise de Fidelidade</h4>
                    <p className="text-white/80 font-medium text-sm max-w-xl">
                        A recorrência deste paciente é medida com base no histórico acima. Pacientes com mais de 3 procedimentos anuais são classificados como fidelizados no Dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
};
