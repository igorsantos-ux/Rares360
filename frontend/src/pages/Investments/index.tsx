import { Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInvestments } from '../../hooks/useInvestments';
import InvestmentSummaryKPIs from './components/InvestmentSummaryKPIs';
import InvestmentCard from './components/InvestmentCard';

export default function InvestmentsPage() {
  const { investments, summary, isLoading } = useInvestments();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-white/50 rounded-2xl border border-[#8A9A5B]/10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white/50 rounded-2xl border border-[#8A9A5B]/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#4A5D23]">Investimentos</h1>
          <p className="text-[#6B7E45] mt-1">Gestão de ativos, ROI e Payback estratégico da clínica.</p>
        </div>
        <Link
          to="/investments/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-xl font-semibold hover:bg-[#76844D] transition-all shadow-lg shadow-[#8A9A5B]/20"
        >
          <Plus className="w-5 h-5" />
          Novo Investimento
        </Link>
      </div>

      {/* Summary KPIs */}
      <InvestmentSummaryKPIs summary={summary} />

      {/* Grid de Investimentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investments.length > 0 ? (
          investments.map((inv: any) => (
            <InvestmentCard key={inv.id} investment={inv} />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/40 rounded-3xl border-2 border-dashed border-[#8A9A5B]/20">
            <div className="w-16 h-16 bg-[#8A9A5B]/10 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-[#8A9A5B]" />
            </div>
            <h3 className="text-xl font-bold text-[#4A5D23]">Nenhum investimento cadastrado</h3>
            <p className="text-[#6B7E45] mt-2 text-center max-w-sm">
              Cadastre seus equipamentos de laser, tecnologias ou reformas para acompanhar a performance financeira.
            </p>
            <Link
              to="/investments/new"
              className="mt-6 text-[#8A9A5B] font-semibold hover:underline"
            >
              Começar agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
