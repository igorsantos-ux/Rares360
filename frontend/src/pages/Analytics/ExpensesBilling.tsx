import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialApi, reportingApi } from '../../services/api';
import {
    BarChart3,
    TrendingDown,
    TrendingUp,
    DollarSign,
    Percent,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const ExpensesBilling = () => {
    const today = new Date();
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd')
    });

    const { data: summary } = useQuery({
        queryKey: ['dashboard-kpis', dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            const response = await reportingApi.getDashboardKPIs(dateRange);
            return response.data;
        }
    });

    const { data: evolution } = useQuery({
        queryKey: ['financial-evolution', dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            const response = await financialApi.getEvolution(dateRange);
            return response.data;
        }
    });

    const { data: goalsResponse } = useQuery({
        queryKey: ['goals-report'],
        queryFn: () => reportingApi.getGoals()
    });

    const goals = Array.isArray(goalsResponse?.data) ? goalsResponse.data : [];
    const profitGoal = goals.find((g: any) => g.type === 'PROFIT');
    const currentMargin = summary?.revenue > 0 ? (summary?.balance / summary?.revenue) * 100 : 0;
    const targetMargin = profitGoal ? 25 : 0; // Ideal de 25% se houver meta de lucro
    const progressPercent = targetMargin > 0 ? Math.min((currentMargin / targetMargin) * 100, 100) : 0;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Despesas x Faturamento</h2>
                    <p className="text-slate-500 font-medium mt-1">Análise comparativa de rentabilidade e custos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangePicker 
                        value={dateRange}
                        onChange={setDateRange}
                    />
                </div>
            </div>

            {/* Strategic KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ComparisonCard
                    title="Faturamento"
                    value={`R$ ${summary?.revenue?.toLocaleString() || '0'}`}
                    subValue="+8% vs mês ant."
                    type="plus"
                    icon={<DollarSign size={20} />}
                />
                <ComparisonCard
                    title="Despesas"
                    value={`R$ ${summary?.expenses?.toLocaleString() || '0'}`}
                    subValue="-2% vs mês ant."
                    type="minus"
                    icon={<TrendingDown size={20} />}
                />
                <ComparisonCard
                    title="Resultado Líquido"
                    value={`R$ ${summary?.balance?.toLocaleString() || '0'}`}
                    subValue="Sobra de caixa"
                    type="neutral"
                    icon={<BarChart3 size={20} />}
                />
                <ComparisonCard
                    title="Margem de Lucro"
                    value={`${((summary?.balance / (summary?.revenue || 1)) * 100).toFixed(1)}%`}
                    subValue="Eficiência operacional"
                    type="neutral"
                    icon={<Percent size={20} />}
                />
            </div>

            {/* Main Comparison Chart */}
            <div className="bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h3 className="font-extrabold text-2xl text-[#697D58]">Evolução Mensal</h3>
                        <p className="text-sm text-slate-400 font-medium">Comparativo histórico de performance</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#8A9A5B]"></div>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Faturamento</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#DEB587]"></div>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Despesas</span>
                        </div>
                    </div>
                </div>

                <div className="h-96 flex items-end justify-between gap-6 px-4">
                    {evolution?.map((item: any, i: number) => {
                        const maxVal = Math.max(...evolution.map((e: any) => Math.max(e.income, e.expenses)), 1000);
                        const incomeH = (item.income / maxVal) * 100;
                        const expenseH = (item.expenses / maxVal) * 100;

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-6 group">
                                <div className="w-full relative h-[300px] flex justify-center items-end">
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 w-32 bg-white p-3 rounded-xl shadow-xl border border-[#8A9A5B]/10">
                                        <p className="text-[10px] font-black text-[#8A9A5B] mb-1">F: R$ {item.income.toLocaleString()}</p>
                                        <p className="text-[10px] font-black text-[#DEB587]">D: R$ {item.expenses.toLocaleString()}</p>
                                    </div>

                                    <div
                                        className="w-4 md:w-8 bg-[#8A9A5B] rounded-t-xl transition-all duration-700 shadow-xl shadow-[#8A9A5B]/10 relative group-hover:w-10"
                                        style={{ height: `${incomeH}%` }}
                                    ></div>
                                    <div
                                        className="w-4 md:w-8 bg-[#DEB587] rounded-t-xl transition-all duration-700 shadow-xl shadow-[#DEB587]/10 -ml-2 mb-0 relative group-hover:w-10 z-[1]"
                                        style={{ height: `${expenseH}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.month}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Grid: Insights & Contribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm">
                    <h3 className="font-extrabold text-2xl text-[#697D58] mb-8">Análise de Custos</h3>
                    <div className="space-y-6">
                        <CostItem label="Faturamento Bruto" value={summary?.revenue || 0} color="moss" />
                        <ArrowRight className="mx-auto text-slate-300 rotate-90" size={20} />
                        <CostItem label="Despesas Fixas" value={summary?.expenses * 0.4 || 0} color="dun" />
                        <CostItem label="Despesas Variáveis" value={summary?.expenses * 0.6 || 0} color="dun" />
                        <div className="pt-6 border-t border-[#8A9A5B]/10">
                            <div className="flex justify-between items-center">
                                <span className="font-black text-[#697D58]">SOBRA LÍQUIDA (EBITDA)</span>
                                <span className="text-2xl font-black text-[#697D58]">R$ {summary?.balance?.toLocaleString() || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#697D58] text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
                    <div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#DEB587] mb-6">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-2xl font-black mb-4">Meta de Lucratividade</h3>
                        <p className="text-[#F0EAD6]/80 font-medium mb-8">
                            {targetMargin > 0
                                ? `O objetivo deste período é elevar a margem líquida para ${targetMargin}% através da otimização de custos.`
                                : "Defina metas de lucro no menu de Metas para acompanhar sua lucratividade estratégica."
                            }
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                <span>Margem Atual</span>
                                <span>{currentMargin.toFixed(1)}% {targetMargin > 0 ? `/ ${targetMargin}%` : ''}</span>
                            </div>
                            <div className="h-4 bg-black/20 rounded-full overflow-hidden p-1 shadow-inner">
                                <div
                                    className="h-full bg-[#DEB587] rounded-full transition-all duration-1000 shadow-lg shadow-[#DEB587]/20"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <Link 
                        to="/dre"
                        className="mt-12 w-full py-4 bg-[#F0EAD6] text-[#697D58] font-black rounded-2xl shadow-xl hover:bg-white transition-all flex items-center justify-center gap-2 group"
                    >
                        Ver Detalhes do DRE <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:translate-y-[-1px] transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

const ComparisonCard = ({ title, value, subValue, type, icon }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-[#8A9A5B]/10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
            {icon}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{title}</p>
        <h4 className="text-2xl font-black text-[#1A202C] mb-1">{value}</h4>
        <div className={`flex items-center gap-1.5 text-[10px] font-black ${type === 'plus' ? 'text-[#8A9A5B]' : type === 'minus' ? 'text-[#DEB587]' : 'text-slate-400'
            }`}>
            {type === 'plus' && <ArrowUpRight size={12} />}
            {type === 'minus' && <ArrowDownRight size={12} />}
            {subValue}
        </div>
    </div>
);

const CostItem = ({ label, value, color }: any) => (
    <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-[#8A9A5B]/5 shadow-sm">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-lg font-black ${color === 'moss' ? 'text-[#8A9A5B]' : 'text-[#DEB587]'}`}>
            R$ {value.toLocaleString()}
        </span>
    </div>
);

export default ExpensesBilling;
