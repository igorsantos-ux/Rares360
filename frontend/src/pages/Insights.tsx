import {
    TrendingUp,
    Target,
    Activity,
    Sparkles,
    ArrowUpRight
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
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from 'recharts';
import { analyticsApi } from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const Insights = () => {
    const { data: insights, isLoading } = useQuery({
        queryKey: ['insights-data'],
        queryFn: async () => {
            const response = await analyticsApi.getInsights();
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-400 animate-pulse">Processando Inteligência de Dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Insights Avançados</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Business Intelligence & Performance</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1">
                        <button className="px-4 py-2 bg-white text-slate-900 font-bold text-sm rounded-lg shadow-sm">Este Mês</button>
                        <button className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700">Trimestre</button>
                    </div>
                </div>
            </header>

            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Top KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InsightCard
                        title="Procedimento Mais Rentável"
                        value={insights?.proceduresRentability?.[0]?.name || 'Nenhum dado'}
                        subValue={`R$ ${insights?.proceduresRentability?.[0]?.profit?.toLocaleString() || '0'} de lucro líquido`}
                        icon={<Activity className="text-emerald-500" />}
                        color="emerald"
                    />
                    <InsightCard
                        title="Ticket Médio Global"
                        value={`R$ ${insights?.doctorPerformance ? Math.round(insights.doctorPerformance.reduce((acc: any, d: any) => acc + d.avgTicket, 0) / (insights.doctorPerformance.length || 1)).toLocaleString() : '0'}`}
                        subValue="Baseado em todos os procedimentos"
                        icon={<TrendingUp className="text-blue-500" />}
                        color="blue"
                    />
                    <InsightCard
                        title="Conversão de Leads"
                        value={`${insights?.leadsAnalytics ? Math.round((insights.leadsAnalytics.byStatus.find((s: any) => s.label === 'Convertido')?.value || 0) / (insights.leadsAnalytics.total || 1) * 100) : 0}%`}
                        subValue={`${insights?.leadsAnalytics?.byStatus.find((s: any) => s.label === 'Convertido')?.value || 0} converteram de ${insights?.leadsAnalytics?.total || 0}`}
                        icon={<Target className="text-indigo-500" />}
                        color="indigo"
                    />
                </div>

                {/* Charts Row 1: Rentability & Ticket Median */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ChartContainer title="Rentabilidade por Procedimento" subtitle="Margem de lucro após custos diretos">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={insights?.proceduresRentability}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '15px' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="profit" name="Lucro (R$)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    <ChartContainer title="Ticket Médio por Médico" subtitle="Desempenho financeiro individual">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={insights?.doctorPerformance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '15px' }}
                                />
                                <Bar dataKey="avgTicket" name="Ticket Médio (R$)" radius={[10, 10, 0, 0]}>
                                    {insights?.doctorPerformance?.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>

                {/* Clients & Leads Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Top Customers */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-black text-slate-800 text-xl">Top Clientes</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ranking por faturamento total</p>
                            </div>
                            <button className="text-emerald-500 font-bold text-sm flex items-center gap-1 hover:underline">Ver Todos <ArrowUpRight size={16} /></button>
                        </div>
                        <div className="space-y-4">
                            {insights?.topCustomers.map((client: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 border border-slate-200 shadow-sm group-hover:text-emerald-500 transition-colors">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800">{client.name}</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{client.count} procedimentos realizados</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 text-lg">R$ {client.total?.toLocaleString()}</p>
                                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase">VIP</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Leads Analysis */}
                    <div className="bg-[#0f172a] text-white rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between overflow-hidden relative group">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>

                        <div>
                            <h3 className="font-black text-xl mb-1">Canais de Aquisição</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Origem dos novos leads</p>

                            <div className="h-64 mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={insights?.leadsAnalytics?.bySource || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {insights?.leadsAnalytics?.bySource?.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '15px' }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-4">
                                {insights?.leadsAnalytics.bySource.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                            <span className="font-bold text-slate-300">{s.label}</span>
                                        </div>
                                        <span className="font-black">{s.value} leads</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InsightCard = ({ title, value, subValue, icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
        <div className="flex items-start justify-between mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${color}-500/10 transition-all group-hover:scale-110`}>
                {icon}
            </div>
            <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Real</span>
            </div>
        </div>
        <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
            <h4 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-emerald-600 transition-colors uppercase whitespace-nowrap overflow-hidden text-overflow-ellipsis" title={value}>{value}</h4>
            <p className="text-sm font-bold text-slate-500 leading-relaxed font-mono">{subValue}</p>
        </div>
    </div>
);

const ChartContainer = ({ title, subtitle, children }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="mb-8">
            <h3 className="font-black text-slate-800 text-xl">{title}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        {children}
    </div>
);

export default Insights;
