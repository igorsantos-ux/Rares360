import { useState, useEffect } from 'react';
import { Settings2, Info } from 'lucide-react';
import { usePricingConfig } from '../Hooks/usePricingConfig';

export const PricingConfigPanel = () => {
  const { config, updateConfig, isUpdating } = usePricingConfig();
  const [localValues, setLocalValues] = useState<any>(null);

  // Sincronizar estado local quando o config carregar do servidor
  useEffect(() => {
    if (config) {
      setLocalValues(config);
    }
  }, [config]);

  if (!localValues) return null;

  const handleChange = (field: string, value: number) => {
    const next = { ...localValues, [field]: value };
    setLocalValues(next);
    updateConfig(next);
  };

  const renderSlider = (label: string, field: string, value: number, min: number, max: number, step: number, isPercent = true) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
          {label}
          <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
        </label>
        <span className="text-sm font-bold text-blue-600">
          {isPercent ? `${(value * 100).toFixed(1)}%` : `R$ ${value.toFixed(2)}/min`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleChange(field, parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-bold text-slate-900">Parâmetros Globais</h2>
        </div>
        {isUpdating && <span className="text-xs text-blue-500 animate-pulse">Salvando alterações...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
        {renderSlider('Uso de Sala (R$/min)', 'taxaSalaPerMin', localValues.taxaSalaPerMin, 0, 20, 0.05, false)}
        {renderSlider('Impostos sobre Venda', 'impostosRate', localValues.impostosRate, 0, 0.3, 0.005)}
        {renderSlider('Taxas de Cartão/Antecipação', 'cartaoRate', localValues.cartaoRate, 0, 0.15, 0.005)}
        {renderSlider('Comissões/Processamento', 'comissaoRate', localValues.comissaoRate, 0, 0.1, 0.005)}
        {renderSlider('Repasse Médico Médio', 'repasseRate', localValues.repasseRate, 0, 0.8, 0.01)}
        {renderSlider('Margem Clínica Alvo', 'margemAlvo', localValues.margemAlvo, 0.1, 0.7, 0.01)}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>💡 Dica:</strong> Estes parâmetros afetam o cálculo de margem e o <strong>Preço Sugerido</strong> de todos os procedimentos. 
          Ajuste conforme a realidade atual da sua clínica para diagnósticos precisos.
        </p>
      </div>
    </div>
  );
};
