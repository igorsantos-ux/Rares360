import { Target, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface Props {
  kpis: {
    total: number;
    critica: number;
    ok: number;
    ideal: number;
    semPreco: number;
  };
}

export const PricingKPICards = ({ kpis }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total de Itens</p>
            <p className="text-2xl font-bold text-slate-900">{kpis.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Margem Crítica</p>
            <p className="text-2xl font-bold text-red-600">{kpis.critica}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Margem Ideal</p>
            <p className="text-2xl font-bold text-emerald-600">{kpis.ideal}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">
            <HelpCircle className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Sem Preço</p>
            <p className="text-2xl font-bold text-slate-600">{kpis.semPreco}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
