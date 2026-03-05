import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '../../services/api';
import {
    FileText,
    TrendingUp,
    Info,
    Filter,
    Download,
    Percent,
    DollarSign,
    Calculator
} from 'lucide-react';

const DREPage = () => {
    const clinicId = "default-clinic-id";

    // Dados Fictícios para Visualização (DRE Mock)
    const dre = {
        revenue: 150000,
        variableCosts: 45000,
        contributionMargin: 105000,
        fixedCosts: 35000,
        netProfit: 70000,
        netMargin: 46.6,
        ebitda: 75000,
        details: [
            { category: 'Procedimentos Dentários', value: 90000, type: 'revenue' },
            { category: 'Cirurgias Estéticas', value: 45000, type: 'revenue' },
            { category: 'Venda de Produtos', value: 15000, type: 'revenue' },
            { category: 'Materiais Cirúrgicos', value: 25000, type: 'variable' },
            { category: 'Laboratório Protético', value: 15000, type: 'variable' },
            { category: 'Taxas de Cartão', value: 5000, type: 'variable' },
            { category: 'Aluguel & Condomínio', value: 12000, type: 'fixed' },
            { category: 'Salários & Encargos', value: 18000, type: 'fixed' },
            { category: 'Marketing Digital', value: 5000, type: 'fixed' }
        ]
    };

    /*
    const { data: realDre, isLoading } = useQuery({
        queryKey: ['dre', clinicId],
        queryFn: async () => {
            const response = await reportingApi.getDRE(clinicId);
            return response.data;
        }
    });
    */
    const isLoading = false;

    if (isLoading) return <div className="p-10 text-[#697D58] font-bold">Gerando relatório DRE...</div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Calculator size={24} className="text-[#8A9A5B]" />
                        <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Relatório DRE</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-9">Demonstração de Resultado do Exercício - Visão Gerencial.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/20 rounded-2xl font-bold text-sm text-[#697D58] hover:bg-[#8A9A5B]/5 transition-all shadow-sm">
                        <Download size={18} /> Exportar PDF
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Filter size={20} /> Mês Referência
                    </button>
                </div>
            </div>

            {/* Top Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    label="Faturamento Bruto"
                    value={`R$ ${dre?.revenue?.toLocaleString() || '0'}`}
                    icon={<DollarSign size={20} />}
                    color="moss"
                />
                <SummaryCard
                    label="Margem de Contribuição"
                    value={`${dre?.contributionMargin?.toFixed(1) || '0'}%`}
                    icon={<Percent size={20} />}
                    color="moss"
                />
                <SummaryCard
                    label="Resultado Líquido"
                    value={`R$ ${dre?.netProfit?.toLocaleString() || '0'}`}
                    icon={<TrendingUp size={20} />}
                    color="moss"
                />
            </div>

            {/* Detailed DRE Table */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden p-10">
                <div className="flex items-center gap-3 mb-10">
                    <FileText className="text-[#DEB587]" size={24} />
                    <h3 className="font-extrabold text-2xl text-[#697D58]">Estrutura de Resultados</h3>
                </div>

                <div className="space-y-2">
                    <DRERow label="(+) Receita Operacional Bruta" value={dre?.revenue} isMain />
                    <DRERow label="(-) Deduções e Impostos" value={dre?.revenue * 0.08} isNegative />
                    <div className="h-px bg-[#8A9A5B]/10 my-4"></div>

                    <DRERow label="(=) Receita Líquida" value={dre?.revenue * 0.92} isSubtotal />
                    <DRERow label="(-) Custos Variáveis (Insumos/Lab)" value={dre?.variableCosts} isNegative />
                    <div className="h-px bg-[#8A9A5B]/10 my-4"></div>

                    <DRERow label="(=) Margem de Contribuição" value={dre?.revenue * 0.92 - dre?.variableCosts} isSubtotal />
                    <DRERow label="(-) Despesas Operacionais Fixas" value={dre?.fixedCosts} isNegative />
                    <DRERow label="(-) Despesas Administrativas" value={dre?.fixedCosts * 0.3} isNegative />
                    <div className="h-px bg-[#8A9A5B]/10 my-4"></div>

                    <DRERow label="(=) RESULTADO OPERACIONAL (EBITDA)" value={dre?.netProfit} isTotal />
                </div>

                <div className="mt-12 bg-[#8A9A5B]/5 p-8 rounded-3xl border border-[#8A9A5B]/10 flex items-start gap-4">
                    <div className="mt-1">
                        <Info size={20} className="text-[#8A9A5B]" />
                    </div>
                    <div>
                        <h4 className="font-black text-[#697D58] text-sm mb-1 uppercase tracking-widest">Insight de Performance</h4>
                        <p className="text-slate-600 font-medium text-sm leading-relaxed">
                            Sua lucratividade atual de <span className="font-bold">{(dre?.netProfit / (dre?.revenue || 1) * 100).toFixed(1)}%</span> está acima da média do setor (18%).
                            Considere reinvestir parte do resultado em marketing para aumentar o volume de pacientes particulares.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ label, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-[#8A9A5B]/10 shadow-sm flex items-center gap-5 group">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color === 'moss' ? 'bg-[#8A9A5B]/10 text-[#8A9A5B]' : 'bg-[#DEB587]/10 text-[#DEB587]'
            }`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h5 className="text-2xl font-black text-[#697D58]">{value}</h5>
        </div>
    </div>
);

const DRERow = ({ label, value, isMain, isNegative, isSubtotal, isTotal }: any) => (
    <div className={`flex justify-between items-center py-4 px-6 rounded-2xl transition-all ${isTotal ? 'bg-[#697D58] text-white shadow-xl shadow-[#697D58]/20 mt-6' :
        isSubtotal ? 'bg-[#8A9A5B]/5 text-[#697D58] font-black' :
            'hover:bg-slate-50'
        }`}>
        <span className={`text-sm ${isMain || isTotal || isSubtotal ? 'font-black' : 'font-medium text-slate-600'}`}>
            {label}
        </span>
        <span className={`text-base font-black ${isTotal ? 'text-white' :
            isNegative ? 'text-[#DEB587]' :
                'text-[#697D58]'
            }`}>
            {isNegative && '- '} R$ {Math.abs(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
    </div>
);

export default DREPage;
