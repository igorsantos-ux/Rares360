import { useState } from 'react';
import {
    Calculator, Download, Loader2, DollarSign, Percent, TrendingUp, TrendingDown, Activity, Target, Zap, ChevronDown
} from 'lucide-react';
import { useDreData, useDreAiInsights, useExportDrePdf } from '../../hooks/useDreData';
import type { DreRow, AiInsightsResponse, DreReportFilter } from '../../types/Dre';
import { WaterfallChart } from '../../components/dre/WaterfallChart';
import { AiInsightsCard } from '../../components/dre/AiInsightsCard';
import { DreTable } from '../../components/dre/DreTable';
import { DrillDownDrawer } from '../../components/dre/DrillDownDrawer';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'react-hot-toast';

const DREPage = () => {
    const today = new Date();
    const [filter, setFilter] = useState<DreReportFilter>({
        periodType: 'CUSTOM',
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
        viewType: 'GERENCIAL',
        compareWith: 'MES_ANTERIOR'
    });

    const { data: dre, isLoading, refetch } = useDreData(filter);
    const aiMutation = useDreAiInsights();
    const pdfMutation = useExportDrePdf();

    const [aiInsightData, setAiInsightData] = useState<AiInsightsResponse | null>(null);
    const [selectedRow, setSelectedRow] = useState<DreRow | null>(null);

    const handleDateChange = (newRange: { startDate: string; endDate: string }) => {
        setFilter(prev => ({
            ...prev,
            periodType: 'CUSTOM',
            startDate: newRange.startDate,
            endDate: newRange.endDate
        }));
    };

    const handleGenerateInsights = () => {
        if (!dre) return;
        toast.promise(aiMutation.mutateAsync({ dreData: dre }), {
            loading: 'Gemini AI estruturando insights executivos...',
            success: (data) => {
                setAiInsightData(data);
                return 'Modelos inteligentes consolidados!';
            },
            error: 'Falha técnica ao contatar a IA.'
        });
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);

    if (isLoading) {
        return (
            <div className="min-h-[80vh] w-full flex flex-col items-center justify-center gap-6">
                <Loader2 className="animate-spin text-[#697D58]" size={64} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">Agregando transações C-Level...</p>
            </div>
        );
    }

    if (!dre) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* ====== HEADER & FILTROS ====== */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-[#8A9A5B]/10 shadow-sm flex flex-col xl:flex-row justify-between gap-6 items-start xl:items-center">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-[#697D58]/10 text-[#697D58] flex items-center justify-center">
                            <Calculator size={24} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-slate-800">Análise de Resultado</h2>
                            <p className="text-slate-500 font-medium">Demonstração Financeira (DRE) Estratégica.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                        <button
                            onClick={() => setFilter({ ...filter, viewType: 'GERENCIAL' })}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter.viewType === 'GERENCIAL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Gerencial
                        </button>
                        <button
                            onClick={() => setFilter({ ...filter, viewType: 'CONTABIL' })}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter.viewType === 'CONTABIL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Contábil
                        </button>
                    </div>

                    <div className="relative group">
                        <select
                            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl px-5 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 hover:bg-slate-100 transition-colors"
                            value={filter.compareWith}
                            onChange={(e) => setFilter({ ...filter, compareWith: e.target.value as any })}
                        >
                            <option value="MES_ANTERIOR">vs Mês Anterior</option>
                            <option value="MESMO_MES_ANO_PASSADO">vs Mês Ano Passado</option>
                            <option value="MEDIA_12_MESES">vs Média 12 Meses</option>
                            <option value="NENHUM">Sem Comparação</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <DateRangePicker
                        value={{ 
                            startDate: filter.startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd'), 
                            endDate: filter.endDate || format(endOfMonth(new Date()), 'yyyy-MM-dd') 
                        }}
                        onChange={handleDateChange}
                    />

                    <button
                        onClick={() => toast.promise(pdfMutation.mutateAsync(filter), { loading: 'Gerando PDF...', success: 'PDF exportado!', error: 'Falha no PDF' })}
                        className="flex items-center gap-2 px-5 py-3 bg-[#697D58] hover:bg-[#526343] text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-[#697D58]/20"
                    >
                        <Download size={18} /> Exportar
                    </button>
                </div>
            </div>

            {/* ====== KPIs GRID ====== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard
                    title="Faturamento Bruto"
                    value={formatCurrency(dre.kpis.receitaBruta.value)}
                    icon={<DollarSign size={20} />}
                    percentChange={dre.kpis.receitaBruta.percentChange}
                    color="green"
                />
                <KPICard
                    title="Margem de Contribuição"
                    value={`${dre.kpis.margemContribuicao.percentValue}%`}
                    icon={<Percent size={20} />}
                    percentChange={dre.kpis.margemContribuicao.percentChange}
                    subtitle={`R$ ${Math.abs(dre.kpis.margemContribuicao.value).toLocaleString('pt-BR')} absolutos`}
                    color="blue"
                />
                <KPICard
                    title="Resultado Líquido"
                    value={formatCurrency(dre.kpis.resultadoLiquido.value)}
                    icon={<TrendingUp size={20} />}
                    subtitle={`Status: ${dre.kpis.resultadoLiquido.status}`}
                    badge={dre.kpis.resultadoLiquido.status}
                    color={dre.kpis.resultadoLiquido.value >= 0 ? "green" : "red"}
                />
                <KPICard
                    title="EBITDA"
                    value={formatCurrency(dre.kpis.ebitda.value)}
                    icon={<Activity size={20} />}
                    percentChange={dre.kpis.ebitda.percentChange}
                    subtitle={`Margem EBITDA de ${dre.kpis.ebitda.percentValue}%`}
                    color="orange"
                />
                <KPICard
                    title="Ponto de Equilíbrio"
                    value={formatCurrency(dre.kpis.pontoEquilibrio.value)}
                    icon={<Target size={20} />}
                    percentChange={dre.kpis.pontoEquilibrio.percentChange}
                    color="slate"
                />
                <KPICard
                    title="Eficiência Operacional"
                    value={`${dre.kpis.eficienciaOperacional.value}%`}
                    icon={<Zap size={20} />}
                    trend={dre.kpis.eficienciaOperacional.trend}
                    color="indigo"
                />
            </div>

            {/* ====== GRÁFICO WATERFALL ====== */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#8A9A5B]/10 shadow-sm overflow-hidden relative">
                <div className="mb-8">
                    <h3 className="text-xl font-black text-slate-800">Formação do Resultado (Waterfall)</h3>
                    <p className="text-sm font-medium text-slate-500">Mapeamento visual de toda a jornada da receita até o lucro líquido.</p>
                </div>
                <WaterfallChart data={dre.waterfall} />
            </div>

            {/* ====== TABELA DRE ====== */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">Detalhamento Hierárquico</h3>
                        <p className="text-sm font-medium text-slate-500">Explore cada linha usando a contabilidade estruturada.</p>
                    </div>
                </div>
                <DreTable data={dre.tableData} onRowClick={setSelectedRow} />
            </div>

            {/* ====== COMPOSIÇÃO E EVOLUÇÃO ====== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pizza Compose */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-[#8A9A5B]/10 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-6">Composição de Gastos (Total)</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dre.compositionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                    {dre.compositionData.map((e: any, idx: number) => <Cell key={idx} fill={e.color} />)}
                                </Pie>
                                <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Line Compose */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-[#8A9A5B]/10 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-6">Evolução de Margens (12M)</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dre.marginEvolution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={v => `${v}%`} />
                                <Legend />
                                <Line type="monotone" dataKey="margemContribuicao" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="ebitda" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="margemLiquida" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ====== AI INSIGHTS ====== */}
            <div className="mt-12">
                {!aiInsightData ? (
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-12 text-center shadow-2xl relative overflow-hidden group border border-slate-800">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white/10 !backdrop-blur-md border border-white/20 flex flex-col items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Activity className="text-indigo-300" size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4">Interpretação de Executivo</h3>
                            <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">
                                Transforme seus números mortos em ações ricas e previsões táticas estruturadas pelo Gemini.
                            </p>
                            <button
                                onClick={handleGenerateInsights}
                                disabled={aiMutation.isPending}
                                className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3"
                            >
                                {aiMutation.isPending ? <Loader2 className="animate-spin" /> : <Zap />}
                                Gerar Análise Profunda
                            </button>
                        </div>
                    </div>
                ) : (
                    <AiInsightsCard insights={aiInsightData} onRegenerate={handleGenerateInsights} isLoading={aiMutation.isPending} />
                )}
            </div>

            {/* ====== DRILL DOWN DRAWER ====== */}
            <DrillDownDrawer
                isOpen={!!selectedRow}
                row={selectedRow}
                onClose={() => setSelectedRow(null)}
            />
        </div>
    );
};

// HELPER LOCAL
const KPICard = ({ title, value, subtitle, icon, percentChange, badge, trend, color }: any) => {
    const isPositive = percentChange !== undefined && percentChange >= 0;
    const isUpTrend = trend === 'up';

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 
                    ${color === 'green' ? 'bg-green-50 text-green-600' :
                        color === 'blue' ? 'bg-blue-50 text-blue-600' :
                            color === 'red' ? 'bg-red-50 text-red-600' :
                                color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                    color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                    {icon}
                </div>
                {badge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest
                        ${badge === 'Saudável' ? 'bg-green-100 text-green-700' :
                            badge === 'Atenção' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {badge}
                    </span>
                )}
                {percentChange !== undefined && !badge && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {Math.abs(percentChange).toFixed(1)}%
                    </div>
                )}
                {trend && !percentChange && !badge && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${isUpTrend ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                        {isUpTrend ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : <Activity size={16} />}
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h4 className="text-3xl font-black text-slate-800">{value}</h4>
                {subtitle && <p className="text-sm font-medium text-slate-500 mt-2">{subtitle}</p>}
            </div>
        </div>
    );
};

export default DREPage;
