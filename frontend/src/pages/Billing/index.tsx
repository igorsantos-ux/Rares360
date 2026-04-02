import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '../../services/api';
import api from '../../services/api';
import {
    BarChart3,
    TrendingUp,
    UploadCloud,
    Loader2,
    PieChart as PieChartIcon,
    ArrowUpRight,
    ArrowDownRight,
    Trophy,
    Stethoscope,
    Tags,
    Crown,
    User,
    Download,
    ArrowRight,
    X
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LabelList
} from 'recharts';
import { format, subDays } from 'date-fns';

type GroupBy = 'day' | 'week' | 'month';

const COLORS = ['#8A9A5B', '#DEB587', '#5B7C9A', '#9A5B7C', '#5B9A7C', '#c4c8b2', '#e5d7c5'];

const BillingPage = () => {
    const [groupBy, setGroupBy] = useState<GroupBy>('month');
    
    // Filtros de Data e GroupBy automáticos via Quick Filters
    const [activeFilter, setActiveFilter] = useState('monthly');
    const today = new Date();
    const [dateRange, setDateRange] = useState({
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd')
    });

    const [uploading, setUploading] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const { data: dashboardData, isLoading, isError, refetch } = useQuery({
        queryKey: ['billing-dashboard', dateRange.startDate, dateRange.endDate, groupBy],
        queryFn: async () => {
            const response = await reportingApi.getBillingAnalytics({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                groupBy
            });
            return response.data;
        }
    });

    const handleQuickFilter = (type: 'daily' | 'weekly' | 'monthly' | 'semiannual' | 'annual') => {
        setActiveFilter(type);
        const now = new Date();
        const end = format(now, 'yyyy-MM-dd');
        
        switch (type) {
            case 'daily':
                setDateRange({ startDate: end, endDate: end });
                setGroupBy('day');
                break;
            case 'weekly':
                setDateRange({ startDate: format(subDays(now, 7), 'yyyy-MM-dd'), endDate: end });
                setGroupBy('day');
                break;
            case 'monthly':
                setDateRange({ startDate: format(subDays(now, 30), 'yyyy-MM-dd'), endDate: end });
                setGroupBy('week');
                break;
            case 'semiannual':
                setDateRange({ startDate: format(subDays(now, 180), 'yyyy-MM-dd'), endDate: end });
                setGroupBy('month');
                break;
            case 'annual':
                setDateRange({ startDate: format(subDays(now, 365), 'yyyy-MM-dd'), endDate: end });
                setGroupBy('month');
                break;
        }
    };

    if (isLoading && !dashboardData) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-[#8A9A5B] animate-spin" />
                <p className="text-[#697D58] font-bold animate-pulse">Carregando painel de faturamento...</p>
            </div>
        </div>
    );

    if (isError) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 p-8 bg-white/50 rounded-[2.5rem] border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                <BarChart3 size={32} />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-800">Ops! Falha ao carregar dados</h3>
                <p className="text-slate-500 max-w-md">Não conseguimos processar as informações de faturamento no momento.</p>
            </div>
        </div>
    );

    const safeData = (dashboardData as any) || {};
    const kpis = safeData.kpis || {};
    const timeline = safeData.timeline || [];
    const rankings = safeData.rankings || {};
    const distributions = safeData.distributions || {};

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-[#8A9A5B]/20">
                    <p className="font-black text-slate-700 mb-2">{label}</p>
                    <p className="font-black text-[#8A9A5B] text-lg">
                        {formatCurrency(payload[0].value)}
                    </p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {payload[0].payload.count} Venda(s)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-8 max-w-[1600px] mx-auto">
            {/* Header & Controles */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/50 p-6 rounded-[2.5rem] border border-[#8A9A5B]/10">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Dashboard de Vendas</h2>
                    <p className="text-slate-500 font-medium mt-1">Análise de performance, evolução temporal e rankings estratégicos.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Filtros de Período Rápidos e Agrupamento */}
                    <div className="flex bg-slate-100/80 p-1.5 rounded-2xl overflow-x-auto max-w-full hidden-scrollbar shadow-inner">
                        {[
                            { id: 'daily', label: 'Diário' },
                            { id: 'weekly', label: 'Semanal' },
                            { id: 'monthly', label: 'Mensal' },
                            { id: 'semiannual', label: 'Semestral' },
                            { id: 'annual', label: 'Anual' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => handleQuickFilter(btn.id as any)}
                                className={`px-5 py-2 rounded-xl text-xs font-black transition-all capitalize whitespace-nowrap ${
                                    activeFilter === btn.id 
                                    ? 'bg-white text-[#8A9A5B] shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-[#8A9A5B] text-white hover:bg-[#7a8a4b] rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 transition-all active:scale-95"
                        >
                            <UploadCloud size={18} /> Importar
                        </button>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Faturamento Total"
                    value={formatCurrency(kpis.totalBilling)}
                    icon={<BarChart3 size={24} />}
                />
                <KPICard
                    title="Ticket Médio"
                    value={formatCurrency(kpis.averageTicket)}
                    icon={<Tags size={24} />}
                />
                <KPICard
                    title="Melhor Período"
                    value={formatCurrency(kpis.bestPeriod?.value)}
                    subtitle={`Em: ${kpis.bestPeriod?.label}`}
                    icon={<Trophy size={24} />}
                />
                <KPICard
                    title="Crescimento (vs Anterior)"
                    value={`${(kpis.growthPercentage || 0) > 0 ? '+' : ''}${(kpis.growthPercentage || 0).toFixed(1)}%`}
                    valueColor={(kpis.growthPercentage || 0) >= 0 ? "text-emerald-500" : "text-red-500"}
                    icon={(kpis.growthPercentage || 0) >= 0 ? <ArrowUpRight size={24} className="text-emerald-500" /> : <ArrowDownRight size={24} className="text-red-500" />}
                />
            </div>

            {/* Evolução (BarChart) */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center text-[#8A9A5B]">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-2xl text-[#697D58]">Evolução de Vendas</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Comparativo de faturamento no período</p>
                    </div>
                </div>
                
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis 
                                dataKey="label" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                                dx={-10}
                            />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                            <Bar 
                                dataKey="total" 
                                fill="#8A9A5B" 
                                radius={[6, 6, 0, 0]} 
                                barSize={40}
                                animationDuration={1500}
                            >
                                <LabelList 
                                    dataKey="total" 
                                    position="top" 
                                    formatter={(val: number) => val > 0 ? `R$ ${(val / 1000).toFixed(1)}k` : ''} 
                                    style={{ fill: '#697D58', fontSize: 11, fontWeight: 900 }} 
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Grid 3 Colunas: Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <RankingCard 
                    title="Top Procedimentos" 
                    icon={<Tags size={20} />}
                    data={rankings.procedures} 
                    total={kpis.totalBilling}
                    color="#DEB587"
                />
                <RankingCard 
                    title="Top Médicos" 
                    icon={<Stethoscope size={20} />}
                    data={rankings.doctors} 
                    total={kpis.totalBilling}
                    color="#8A9A5B"
                />
                <RankingCard 
                    title="Top Avaliadores/Vendas (Categorias)" 
                    icon={<Trophy size={20} />}
                    data={rankings.categories} 
                    total={kpis.totalBilling}
                    color="#5B7C9A"
                />
            </div>

            {/* Ranking VIP de Pacientes */}
            <PatientRankingCard 
                data={rankings.patients} 
                color="#c4c8b2" 
            />

            {/* Rodapé Analítico: Distribuições */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PieCard title="Origem dos Pacientes" data={distributions.origins} />
                <PieCard title="Formas de Recebimento" data={distributions.paymentMethods} isCurrency />
            </div>

            {/* Modal de Importação */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center">
                                    <UploadCloud className="text-[#8A9A5B]" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Importar Dados</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">XLSX, XLS ou CSV</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsImportModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                Suba seus dados de faturamento usando o nosso modelo padrão para atualizar as estatísticas do painel.
                            </p>
                            
                            <a
                                href="/templates/FATURAMENTO_DIARIO.xlsx"
                                download="FATURAMENTO_DIARIO.xlsx"
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-[#8A9A5B] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-[#8A9A5B]/10 transition-colors">
                                        <Download className="text-slate-400 group-hover:text-[#8A9A5B]" size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-slate-700">Baixar Modelo Padrão</p>
                                        <p className="text-[10px] text-slate-400">Download em .xlsx</p>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-[#8A9A5B] transition-all group-hover:translate-x-1" size={16} />
                            </a>

                            <div className="relative">
                                <input
                                    type="file"
                                    id="modal-excel-upload"
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        setUploading(true);
                                        const formData = new FormData();
                                        formData.append('file', file);

                                        try {
                                            const response = await api.post('/import/transactions', formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            refetch();
                                            setIsImportModalOpen(false);
                                            alert(response.data.message || 'Planilha importada com sucesso!');
                                        } catch (error: any) {
                                            alert(error.response?.data?.message || 'Erro ao processar arquivo.');
                                        } finally {
                                            setUploading(false);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="modal-excel-upload"
                                    className={`w-full py-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${uploading
                                        ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
                                        : 'bg-white border-slate-200 hover:border-[#8A9A5B] hover:bg-[#8A9A5B]/5'
                                        }`}
                                >
                                    <div className={`p-4 rounded-full ${uploading ? 'bg-slate-100' : 'bg-[#8A9A5B]/10 text-[#8A9A5B]'}`}>
                                        {uploading ? <Loader2 className="animate-spin" size={32} /> : <UploadCloud size={32} />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-700">Clique para selecionar o arquivo</p>
                                        <p className="text-xs text-slate-400 mt-1">Máx 5MB</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Subcomponentes Otimizados ---

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-[#8A9A5B]/20">
                <p className="font-black text-slate-700 mb-1">{payload[0].name}</p>
                <p className="font-black text-[#DEB587] text-md">
                    {payload[0].value.toLocaleString('pt-BR')} 
                    {payload[0].name === 'Instagram' || payload[0].name === 'Outros' ? ' Pacotes' : ' R$'}
                </p>
            </div>
        );
    }
    return null;
};

const KPICard = ({ title, value, icon, subtitle, valueColor = "text-[#1A202C]" }: any) => (
    <div className="bg-white p-6 xl:p-8 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            {icon}
        </div>
        <div className="flex justify-between items-start mb-4">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-[#8A9A5B]/10 group-hover:text-[#8A9A5B] transition-colors">
                {icon}
            </div>
        </div>
        <div className="flex flex-col">
            <h4 className={`text-2xl xl:text-3xl font-black ${valueColor} truncate`}>{value}</h4>
            {subtitle && (
                <div className="mt-2 text-xs font-bold text-[#697D58] bg-[#8A9A5B]/10 px-3 py-1.5 rounded-xl w-fit">
                    {subtitle}
                </div>
            )}
        </div>
    </div>
);

const RankingCard = ({ title, data = [], total = 0, icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl text-white" style={{ backgroundColor: color }}>
                {icon}
            </div>
            <h3 className="font-extrabold text-lg text-slate-800">{title}</h3>
        </div>
        <div className="space-y-5 flex-1 overflow-y-auto pr-2">
            {data.length === 0 ? (
                <p className="text-sm text-slate-400 font-bold">Nenhum dado registrado.</p>
            ) : (
                data.map((item: any, idx: number) => {
                    const percent = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                        <div key={idx} className="group">
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="font-black text-slate-600 truncate max-w-[65%]">
                                    <span className="text-slate-300 mr-2">#{idx + 1}</span>
                                    {item.name}
                                </span>
                                <span className="font-bold text-slate-800">
                                    R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100" 
                                    style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: color }}
                                />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 mt-1.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                Repr: {percent.toFixed(1)}% do total
                            </p>
                        </div>
                    );
                })
            )}
        </div>
    </div>
);

const PieCard = ({ title, data = [], isCurrency = false }: any) => {
    // Tratando dados para evitar quebras se vier vazio ou 0
    const validData = data.filter((d: any) => d.value > 0);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#DEB587]/10 rounded-xl text-[#DEB587]">
                        <PieChartIcon size={20} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800">{title}</h3>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Distribuição geral</p>
                    </div>
                </div>
                <div className="space-y-2.5 mt-6">
                    {validData.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold">Sem dados suficientes.</p>
                    ) : (
                        validData.map((d: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    <span className="text-xs font-black text-slate-600 truncate max-w-[120px]">{d.name}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">
                                    {isCurrency ? `R$ ${d.value.toLocaleString('pt-BR')}` : d.value}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="w-full sm:w-[200px] h-[200px] flex justify-center items-center">
                {validData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={validData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {validData.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomPieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-32 h-32 rounded-full border-8 border-slate-50 flex flex-col items-center justify-center">
                        <PieChartIcon size={24} className="text-slate-200" />
                    </div>
                )}
            </div>
        </div>
    );
};

const PatientRankingCard = ({ data = [], color = "#c4c8b2" }: any) => {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex flex-col h-full w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl text-white" style={{ backgroundColor: color }}>
                    <Crown size={24} />
                </div>
                <div>
                    <h3 className="font-extrabold text-xl text-slate-800">Ranking VIP de Pacientes</h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">Top clientes do período selecionado</p>
                </div>
            </div>
            
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <th className="pb-3 w-16 text-center">Pos</th>
                            <th className="pb-3">Paciente</th>
                            <th className="pb-3 text-center">Procedimentos</th>
                            <th className="pb-3 text-right pr-4">Total Gasto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!data || data.length === 0) ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-slate-400 font-bold text-sm">
                                    Nenhum faturamento registrado neste período.
                                </td>
                            </tr>
                        ) : (
                            data.map((patient: any, idx: number) => (
                                <tr key={patient.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-4 text-center">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mx-auto ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                                            {idx + 1}º
                                        </span>
                                    </td>
                                    <td className="py-4 flex items-center gap-4">
                                        {patient.avatarUrl ? (
                                            <img src={patient.avatarUrl} alt={patient.name} className="w-10 h-10 rounded-full object-cover shadow-sm bg-white border border-slate-100" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                                                <User size={18} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-extrabold text-sm text-slate-800">{patient.name}</p>
                                            {patient.isNew ? (
                                                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] uppercase font-black tracking-widest bg-emerald-100 text-emerald-600 rounded-md">Novo VIP</span>
                                            ) : (
                                                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] uppercase font-black tracking-widest bg-blue-100 text-blue-600 rounded-md">Recorrente</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full text-xs">{patient.count}x</span>
                                    </td>
                                    <td className="py-4 text-right pr-4">
                                        <span className="font-black text-[#8A9A5B] text-base">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.value)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillingPage;
