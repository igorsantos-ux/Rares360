import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw,
  Calculator
} from 'lucide-react';
import { usePricingList } from './hooks/usePricingList';
import { PricingConfigPanel } from './components/ConfigPanel';
import { PricingKPICards } from './components/KPICards';
import { PricingList } from './components/PricingList';
import { PricingImportModal } from './components/ImportModal';

const PricingDiagnosis = () => {
  const [filters, setFilters] = useState({
    search: '',
    tipo: '',
    status: ''
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { data, isLoading, isError, refetch, isRefetching } = usePricingList(filters);

  // Fallbacks seguros
  const procedures = data?.procedures ?? [];
  const kpis = data?.kpis ?? { total: 0, critica: 0, ok: 0, ideal: 0, semPreco: 0 };
  const config = data?.config;

  useEffect(() => {
    console.log('--- DIAGNÓSTICO DE PRECIFICAÇÃO ---');
    console.log('Data:', data);
    console.log('Loading:', isLoading);
    console.log('Error:', isError);
  }, [data, isLoading, isError]);

  if (isLoading && !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Sincronizando dados da clínica...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 bg-white rounded-xl border border-red-100 text-center space-y-4">
        <h2 className="text-red-600 font-black text-xl">Erro ao Carregar Dados</h2>
        <p className="text-slate-500">Não foi possível conectar com o servidor. Verifique sua conexão.</p>
        <button 
          onClick={() => refetch()} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Simples para Diagnóstico */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calculator className="text-blue-600 w-7 h-7" />
            Precificação Dinâmica
          </h1>
          <p className="text-slate-500">Módulo de análise de margens e rentabilidade.</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* KPI Section */}
      <PricingKPICards kpis={kpis} />

      {/* Configuration Panel */}
      <PricingConfigPanel />

      {/* Tabela de Dados */}
      <PricingList 
        procedures={procedures} 
        config={config} 
        isLoading={isLoading} 
      />

      <PricingImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </div>
  );
};

export default PricingDiagnosis;


