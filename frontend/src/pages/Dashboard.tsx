import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Target,
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Percent,
    PieChart,
    ArrowRight
} from 'lucide-react';
// import { useQuery } from '@tanstack/react-query';
// import { financialApi, reportingApi } from '../services/api';

const Dashboard = () => {
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [transactionType, setTransactionType] = useState<'income' | 'expense' | null>(null);
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        status: 'PAID'
    });
    const [isSaving, setIsSaving] = useState(false);

    // Dados Fictícios para Visualização (Mock Data)
    const summary = {
        revenue: 125400,
        balance: 98200,
        pendingPayables: 15400,
        pendingReceivables: 42300,
        margin: 78.4,
        projections: { estimatedBalance: 112000 },
        expenses: 27200
    };

    const evolution = [
        { month: 'Set', income: 85000, expenses: 45000 },
        { month: 'Out', income: 92000, expenses: 42000 },
        { month: 'Nov', income: 78000, expenses: 38000 },
        { month: 'Dez', income: 110000, expenses: 55000 },
        { month: 'Jan', income: 95000, expenses: 48000 },
        { month: 'Fev', income: 105000, expenses: 42000 },
        { month: 'Mar', income: 125400, expenses: 27200 }
    ];

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionType) return;

        setIsSaving(true);
        try {
            // Em uma implementação real, chamaríamos:
            // await financialApi.createTransaction({ ...formData, type: transactionType, clinicId: 'default' });

            // Simulação de sucesso para demonstração
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('Transaction saved:', { ...formData, type: transactionType });
            setIsTransactionModalOpen(false);
            setTransactionType(null);
            setFormData({
                amount: '',
                date: new Date().toISOString().split('T')[0],
                category: '',
                description: '',
                status: 'PAID'
            });
            alert('Lançamento realizado com sucesso!');
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Erro ao salvar lançamento. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Top Bar / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-[#697D58]">
                        Olá, <span className="text-[#8A9A5B]">Roberta</span>!
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Aqui está a visão geral da sua clínica hoje.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/20 rounded-2xl font-bold text-sm text-[#697D58] hover:bg-[#8A9A5B]/5 transition-all shadow-sm"
                    >
                        <Filter size={18} />
                        {selectedPeriod}
                    </button>
                    <button
                        onClick={() => setIsTransactionModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                        Novo Lançamento
                    </button>
                </div>
            </div>

            {/* Principal KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Faturamento Total"
                    value={`R$ ${summary?.revenue?.toLocaleString() || '0'}`}
                    change="+12%"
                    trend="up"
                    icon={<DollarSign size={20} />}
                />
                <KPICard
                    title="Recebimentos Líquidos"
                    value={`R$ ${summary?.balance?.toLocaleString() || '0'}`}
                    change="+8%"
                    trend="up"
                    icon={<Wallet size={20} />}
                />
                <KPICard
                    title="Contas a Pagar"
                    value={`R$ ${summary?.pendingPayables?.toLocaleString() || '0'}`}
                    change="-2%"
                    trend="down"
                    icon={<TrendingDown size={20} />}
                />
                <KPICard
                    title="Contas a Receber"
                    value={`R$ ${summary?.pendingReceivables?.toLocaleString() || '0'}`}
                    change="+15%"
                    trend="up"
                    icon={<TrendingUp size={20} />}
                />
            </div>

            {/* Secondary KPIs / Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Margem de Contribuição"
                    value={`${summary?.margin?.toFixed(1) || '0'}%`}
                    description="Média dos últimos 30 dias"
                    icon={<Percent size={18} />}
                />
                <MetricCard
                    title="Fluxo de Caixa Projetado"
                    value={`R$ ${summary?.projections?.estimatedBalance?.toLocaleString() || '0'}`}
                    description="Expectativa para o fim do mês"
                    icon={<PieChart size={18} />}
                />
                <MetricCard
                    title="Despesas Totais"
                    value={`R$ ${summary?.expenses?.toLocaleString() || '0'}`}
                    description="Fixas e Variáveis consolidadas"
                    icon={<TrendingDown size={18} />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Chart */}
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="font-extrabold text-2xl text-[#697D58]">Evolução Financeira</h3>
                            <p className="text-sm text-slate-400 font-medium">Comparativo mensal de receitas e despesas</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#8A9A5B]">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#8A9A5B]"></div> Receita
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#DEB587]">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#DEB587]"></div> Despesa
                            </span>
                        </div>
                    </div>

                    <div className="h-80 flex items-end justify-between gap-4 px-2">
                        {evolution?.map((item: any, i: number) => {
                            const maxVal = Math.max(...evolution.map((e: any) => e.income), 1000);
                            const incomeH = (item.income / maxVal) * 100;
                            const expenseH = (item.expenses / maxVal) * 100;

                            return (
                                <div key={i} className="flex-1 h-full flex flex-col items-center gap-4 group relative">
                                    <div className="flex-1 w-full flex justify-center items-end gap-1.5 relative">
                                        {/* Revenue Bar */}
                                        <div className="flex flex-col items-center gap-1 w-3 md:w-5 h-full justify-end group/income">
                                            <span className="opacity-0 group-hover/income:opacity-100 transition-all duration-300 absolute -top-10 text-[11px] font-black text-white bg-[#697D58] px-3 py-1.5 rounded-xl shadow-xl border border-[#8A9A5B]/20 z-10 whitespace-nowrap scale-90 group-hover/income:scale-100 origin-bottom">
                                                R$ {item.income.toLocaleString('pt-BR')}
                                            </span>
                                            <div
                                                className="w-full bg-[#8A9A5B] rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                                                style={{ height: `${incomeH}%` }}
                                            ></div>
                                        </div>

                                        {/* Expense Bar */}
                                        <div className="flex flex-col items-center gap-1 w-3 md:w-5 h-full justify-end group/expense">
                                            <span className="opacity-0 group-hover/expense:opacity-100 transition-all duration-300 absolute -top-10 text-[11px] font-black text-white bg-[#DEB587] px-3 py-1.5 rounded-xl shadow-xl border border-[#DEB587]/20 z-10 whitespace-nowrap scale-90 group-hover/expense:scale-100 origin-bottom">
                                                R$ {item.expenses.toLocaleString('pt-BR')}
                                            </span>
                                            <div
                                                className="w-full bg-[#DEB587] rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                                                style={{ height: `${expenseH}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{item.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info Card / Quick Actions */}
                <div className="bg-[#697D58] text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                    <div>
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                            <Target size={28} className="text-[#DEB587]" />
                        </div>
                        <h4 className="text-2xl font-black mb-4">Metas do Negócio</h4>
                        <p className="text-[#F0EAD6]/80 font-medium leading-relaxed mb-8">
                            Você atingiu <span className="text-white font-bold">65%</span> da sua meta de faturamento anual. Faltam R$ 120k para o próximo nível.
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                <span className="text-[#F0EAD6]/60">Progresso Atual</span>
                                <span>65%</span>
                            </div>
                            <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-[#DEB587] w-[65%] rounded-full shadow-lg shadow-[#DEB587]/30 transition-all duration-1000"></div>
                            </div>
                        </div>
                    </div>

                    <button className="mt-12 w-full py-4 bg-[#F0EAD6] text-[#697D58] font-black rounded-2xl shadow-xl hover:bg-white transition-all flex items-center justify-center gap-2 group">
                        Ver Relatório DRE <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:translate-y-[-2px] transition-transform" />
                    </button>
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-[#697D58]">Filtrar Período</h3>
                            <button onClick={() => setIsFilterModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <Plus size={24} className="rotate-45 text-slate-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {['Hoje', 'Últimos 7 dias', 'Este Mês', 'Últimos 30 dias', 'Este Ano', 'Personalizado'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => {
                                        setSelectedPeriod(period);
                                        if (period !== 'Personalizado') {
                                            setIsFilterModalOpen(false);
                                        }
                                    }}
                                    className={`w-full py-4 px-6 rounded-2xl font-bold text-left transition-all flex justify-between items-center ${selectedPeriod === period
                                        ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20 translate-x-1'
                                        : 'bg-slate-50 text-slate-600 hover:bg-[#8A9A5B]/10 hover:text-[#697D58]'
                                        }`}
                                >
                                    {period}
                                    {selectedPeriod === period && <ArrowRight size={18} />}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="w-full mt-8 py-4 bg-[#697D58] text-white rounded-2xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all"
                        >
                            Aplicar Filtro
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[3rem] max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-10 py-8 flex justify-between items-center border-b border-slate-100">
                            <div>
                                <h3 className="text-3xl font-black text-[#697D58] tracking-tight">
                                    {transactionType ? (transactionType === 'income' ? 'Nova Receita' : 'Nova Despesa') : 'Novo Lançamento'}
                                </h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de Patrimônio</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsTransactionModalOpen(false);
                                    setTransactionType(null);
                                }}
                                className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-[#DEB587]"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-10">
                            {!transactionType ? (
                                <div className="space-y-8">
                                    <p className="text-slate-500 font-medium leading-relaxed">Qual a natureza do lançamento que deseja realizar hoje?</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <button
                                            onClick={() => setTransactionType('income')}
                                            className="p-10 bg-[#8A9A5B]/5 border-2 border-[#8A9A5B]/10 rounded-[2.5rem] flex flex-col items-center gap-6 hover:bg-[#8A9A5B] hover:text-white transition-all group hover:scale-[1.02] shadow-sm hover:shadow-xl hover:shadow-[#8A9A5B]/20"
                                        >
                                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-[#8A9A5B] group-hover:scale-110 transition-transform shadow-sm">
                                                <TrendingUp size={40} />
                                            </div>
                                            <div className="text-center">
                                                <span className="font-black text-xl block mb-1">Receita</span>
                                                <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Entrada de Capital</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setTransactionType('expense')}
                                            className="p-10 bg-[#DEB587]/5 border-2 border-[#DEB587]/10 rounded-[2.5rem] flex flex-col items-center gap-6 hover:bg-[#DEB587] hover:text-white transition-all group hover:scale-[1.02] shadow-sm hover:shadow-xl hover:shadow-[#DEB587]/20"
                                        >
                                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-[#DEB587] group-hover:scale-110 transition-transform shadow-sm">
                                                <TrendingDown size={40} />
                                            </div>
                                            <div className="text-center">
                                                <span className="font-black text-xl block mb-1">Despesa</span>
                                                <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Saída de Capital</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveTransaction} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* Value Input - Highlighted */}
                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 focus-within:ring-4 focus-within:ring-[#8A9A5B]/10 focus-within:border-[#8A9A5B] transition-all">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Valor do Lançamento</label>
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl font-black text-[#697D58]">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                autoFocus
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0,00"
                                                className="bg-transparent text-5xl font-black text-[#1A202C] outline-none w-full placeholder:text-slate-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Secondary Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Data</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-600 focus:border-[#8A9A5B] outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Categoria</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-600 focus:border-[#8A9A5B] outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Selecione...</option>
                                                {transactionType === 'income' ? (
                                                    <>
                                                        <option value="CONSULTA">Consulta Particular</option>
                                                        <option value="PROCEDIMENTO">Procedimento</option>
                                                        <option value="CONVENIO">Repasse Convênio</option>
                                                        <option value="OUTROS">Outras Receitas</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="ALUGUEL">Aluguel / Condomínio</option>
                                                        <option value="SALARIO">Salários / Folha</option>
                                                        <option value="FORNECEDOR">Fornecedores</option>
                                                        <option value="MARKETING">Marketing / Tráfego</option>
                                                        <option value="OUTROS">Outras Despesas</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descrição (Opcional)</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Detalhes sobre este lançamento..."
                                            rows={2}
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-600 focus:border-[#8A9A5B] outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType(null)}
                                            className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black hover:bg-slate-100 transition-all active:scale-95"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className={`flex-[2] py-5 text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${transactionType === 'income' ? 'bg-[#8A9A5B] shadow-[#8A9A5B]/20' : 'bg-[#DEB587] shadow-[#DEB587]/20'
                                                } ${isSaving ? 'opacity-70 cursor-not-allowed scale-100' : 'hover:scale-[1.02]'}`}
                                        >
                                            {isSaving ? (
                                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>Confirmar Lançamento <ArrowRight size={20} /></>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const KPICard = ({ title, value, change, trend, icon }: any) => (
    <div className="bg-white p-8 rounded-[2rem] border border-[#8A9A5B]/10 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group cursor-pointer overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            {icon}
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">{title}</p>
        <div className="flex flex-col gap-1">
            <h4 className="text-3xl font-black text-[#1A202C]">{value}</h4>
            <div className={`flex items-center gap-1.5 text-xs font-black ${trend === 'up' ? 'text-[#8A9A5B]' : 'text-[#DEB587]'}`}>
                {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {change} desde o mês anterior
            </div>
        </div>
    </div>
);

const MetricCard = ({ title, value, description, icon }: any) => (
    <div className="bg-white/40 backdrop-blur-sm p-6 rounded-3xl border border-[#8A9A5B]/5 flex items-center gap-5 hover:bg-white transition-all cursor-default group">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-[#8A9A5B]/10 flex items-center justify-center text-[#8A9A5B] group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h5 className="text-xl font-black text-[#697D58]">{value}</h5>
            <p className="text-[10px] text-slate-400 font-medium">{description}</p>
        </div>
    </div>
);

export default Dashboard;
