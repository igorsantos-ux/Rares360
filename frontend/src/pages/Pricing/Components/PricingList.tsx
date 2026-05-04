import { PricingListRow } from './PricingListRow';
// v1.1 - Casing fix
import type { PricingConfig } from '../Utils/pricingCalc';

interface Props {
  procedures: any[];
  config: PricingConfig;
  isLoading: boolean;
}

export const PricingList = ({ procedures, config, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Analisando rentabilidade...</p>
        </div>
      </div>
    );
  }

  if (procedures.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <p className="text-slate-500">Nenhum procedimento encontrado para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Procedimento</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tempo/Sala</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Custo Prod.</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Preço de Venda</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Margem Clínica</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lucro Líquido</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sugestão</th>
            </tr>
          </thead>
          <tbody>
            {procedures.map((proc) => (
              <PricingListRow 
                key={proc.id} 
                procedure={proc} 
                config={config} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
