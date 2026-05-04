import { useState, useMemo, memo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// v1.1 - Casing fix
import { pricingApi } from '../../../services/api';
import { calcPricing } from '../Utils/PricingCalc';
import type { PricingConfig } from '../Utils/PricingCalc';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  procedure: any;
  config: PricingConfig;
}

export const PricingTableRow = memo(({ procedure, config }: Props) => {
  const queryClient = useQueryClient();
  const [localPrice, setLocalPrice] = useState(procedure.salePrice);

  // Recalcular localmente enquanto digita (sem esperar o servidor)
  const localPricing = useMemo(
    () => calcPricing({ 
      productCost: procedure.custoProduto, 
      duration: procedure.duracao, 
      salePrice: localPrice 
    }, config),
    [localPrice, config, procedure.custoProduto, procedure.duracao]
  );

  const mutation = useMutation({
    mutationFn: (price: number) => pricingApi.updatePrice(procedure.id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });

  const handleBlur = () => {
    if (localPrice !== procedure.salePrice) {
      mutation.mutate(localPrice);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IDEAL':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold"><TrendingUp className="w-3 h-3"/> IDEAL</span>;
      case 'OK':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold"><Minus className="w-3 h-3"/> OK</span>;
      case 'CRITICA':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><TrendingDown className="w-3 h-3"/> CRÍTICA</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">SEM PREÇO</span>;
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
      <td className="py-4 px-4">
        <p className="text-sm font-semibold text-slate-900">{procedure.nome}</p>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{procedure.tipo}</p>
      </td>
      <td className="py-4 px-4">
        <p className="text-sm text-slate-600">{procedure.duracao} min</p>
        <p className="text-xs text-slate-400">R$ {localPricing.custoSala.toFixed(2)} sala</p>
      </td>
      <td className="py-4 px-4 text-sm font-medium text-slate-700">
        R$ {procedure.custoProduto.toFixed(2)}
      </td>
      <td className="py-4 px-4">
        <div className="relative max-w-[120px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
          <input
            type="number"
            value={localPrice || ''}
            onChange={e => setLocalPrice(parseFloat(e.target.value) || 0)}
            onBlur={handleBlur}
            className="w-full pl-9 pr-3 py-1.5 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all group-hover:border-slate-300"
            placeholder="0,00"
          />
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="space-y-1">
          <p className={`text-sm font-bold ${localPricing.margemClinica < 20 ? 'text-red-600' : 'text-slate-900'}`}>
            {localPricing.margemClinica}%
          </p>
          {getStatusBadge(localPricing.status)}
        </div>
      </td>
      <td className="py-4 px-4">
        <p className={`text-sm font-bold ${localPricing.lucroLiquido < 0 ? 'text-red-600' : 'text-slate-900'}`}>
          R$ {localPricing.lucroLiquido.toFixed(2)}
        </p>
        <p className="text-xs text-slate-500">{localPricing.lucroLiquidoPct}% líq.</p>
      </td>
      <td className="py-4 px-4">
        <div className="bg-blue-50 p-2 rounded border border-blue-100">
          <p className="text-xs text-blue-600 font-medium">Sugerido</p>
          <p className="text-sm font-black text-blue-800">R$ {localPricing.precoSugerido.toFixed(2)}</p>
        </div>
      </td>
    </tr>
  );
});
