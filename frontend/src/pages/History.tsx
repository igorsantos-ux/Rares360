import { useState } from 'react';
import {
    History,
    Calendar,
    ArrowUpRight,
    DollarSign,
    User,
    Stethoscope,
    Filter,
    Download,
    Search
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { historyApi } from '../services/api';

const months = [
    { id: 0, name: 'Janeiro' },
    { id: 1, name: 'Fevereiro' },
    { id: 2, name: 'Março' },
    { id: 3, name: 'Abril' },
    { id: 4, name: 'Maio' },
    { id: 5, name: 'Junho' },
    { id: 6, name: 'Julho' },
    { id: 7, name: 'Agosto' },
    { id: 8, name: 'Setembro' },
    { id: 9, name: 'Outubro' },
    { id: 10, name: 'Novembro' },
    { id: 11, name: 'Dezembro' },
];

const HistoryPage = () => {
    const [selectedMonth, setSelectedMonth] = useState(2); // Inicia em Março (2)

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['history-summary'],
        queryFn: async () => {
            const res = await historyApi.getSummary();
            return res.data || [];
        }
    });

    const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery({
        queryKey: ['history-weekly', selectedMonth],
        queryFn: async () => {
            const res = await historyApi.getWeekly(selectedMonth);
            return res.data || [];
        }
    });

    const { data: procedures, isLoading: isProceduresLoading } = useQuery({
        queryKey: ['history-procedures'],
        queryFn: async () => {
            const res = await historyApi.getProcedures();
            return res.data || [];
        }
    });

    const currentMonthSummary = summary?.find((m: any) => m.name === months[selectedMonth].name);

    if (isSummaryLoading || isWeeklyLoading || isProceduresLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-400">Carregando Histórico Detalhado...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <History size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Relatórios & Histórico</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Auditoria de Atendimentos 2026</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        <Download size={18} />
                        Exportar CSV
                    </button>
                    <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1">
                        <select
                            className="bg-white border-none rounded-lg px-4 py-2 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {months.map(m => (
                                <option key={m.id} value={m.id}>{m.name} 2026</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Monthly Analysis Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SummaryCard
                        title="Faturamento Mês"
                        value={`R$ ${currentMonthSummary?.revenue?.toLocaleString() || '0'}`}
                        icon={<DollarSign className="text-emerald-500" />}
                    />
                    <SummaryCard
                        title="Despesas Mês"
                        value={`R$ ${currentMonthSummary?.expenses?.toLocaleString() || '0'}`}
                        icon={<ArrowUpRight className="text-red-500 rotate-90" />}
                    />
                    <SummaryCard
                        title="Lucro Líquido"
                        value={`R$ ${currentMonthSummary?.profit?.toLocaleString() || '0'}`}
                        icon={<Filter className="text-blue-500" />}
                    />
                    <SummaryCard
                        title="Margem Mês"
                        value={`${currentMonthSummary?.revenue ? Math.round((currentMonthSummary.profit / currentMonthSummary.revenue) * 100) : 0}%`}
                        icon={<Calendar className="text-indigo-500" />}
                    />
                </div>

                {/* Weekly Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="mb-8">
                        <h3 className="font-black text-slate-800 text-xl">Análise Semanal - {months[selectedMonth].name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Faturamento por semana de atendimento</p>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="revenue" name="Faturamento" radius={[8, 8, 0, 0]}>
                                    {weeklyData?.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 2 ? '#0f172a' : '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Table: Procedimento por Procedimento */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-800 text-xl">Detalhamento de Atendimentos</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Visão individual: venda vs custo por procedimento</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar procedimento ou médico..."
                                className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all w-64"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Procedimento</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Médico</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Venda</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Custo Direto</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Margem Líquida</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {procedures?.map((p: any) => {
                                    const margin = p.amount - p.cost;
                                    const marginPercent = p.amount ? Math.round((margin / p.amount) * 100) : 0;

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="font-bold text-slate-600 text-sm">
                                                    {p.date ? new Date(p.date).toLocaleDateString('pt-BR') : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 group-hover:text-slate-900 transition-colors">{p.procedureName || 'Procedimento'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                                        <Stethoscope size={14} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">{p.doctor?.name || 'Médico'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">{p.customer?.name || 'Cliente'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-900 whitespace-nowrap">
                                                R$ {p.amount?.toLocaleString() || '0'}
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-red-500/80 whitespace-nowrap">
                                                - R$ {p.cost?.toLocaleString() || '0'}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-emerald-600 text-lg">R$ {margin?.toLocaleString() || '0'}</span>
                                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{marginPercent}% Margem</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h4 className="text-lg font-black text-slate-900">{value}</h4>
        </div>
    </div>
);

export default HistoryPage;
