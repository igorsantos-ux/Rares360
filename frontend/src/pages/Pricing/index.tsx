import { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw,
  Calculator
} from 'lucide-react';
import { usePricingList } from './Hooks/usePricingList';
import { PricingConfigPanel } from './Components/PricingConfigPanel';
import { PricingKPICards } from './Components/PricingKPICards';
import { PricingTable } from './Components/PricingTable';
import { PricingImportModal } from './Components/PricingImportModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";

const PricingDiagnosis = () => {
  const [filters, setFilters] = useState({
    search: '',
    tipo: '',
    status: ''
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = usePricingList(filters);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calculator className="text-blue-600 w-7 h-7" />
            Diagnóstico de Precificação
          </h1>
          <p className="text-slate-500 mt-1">
            Analise margens, custos e rentabilidade de todos os seus procedimentos em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2 text-slate-400" />
            Importar Preços
          </Button>
          <Button 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <PricingKPICards kpis={data?.kpis || { total: 0, critica: 0, ok: 0, ideal: 0, semPreco: 0 }} />

      {/* Configuration Panel */}
      <PricingConfigPanel />

      {/* Filters & Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Buscar procedimento..." 
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 rounded-xl bg-slate-50 border-none h-11 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>

          <Select value={filters.tipo} onValueChange={v => setFilters(prev => ({ ...prev, tipo: v }))}>
            <SelectTrigger className="w-[180px] rounded-xl bg-slate-50 border-none h-11">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Todos os Tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os Tipos</SelectItem>
              <SelectItem value="PROCEDIMENTO">Procedimento</SelectItem>
              <SelectItem value="TECNOLOGIA">Tecnologia</SelectItem>
              <SelectItem value="CONSULTA">Consulta</SelectItem>
              <SelectItem value="SORO-IM">Soro/IM</SelectItem>
              <SelectItem value="PRODUTO">Produto</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={v => setFilters(prev => ({ ...prev, status: v }))}>
            <SelectTrigger className="w-[180px] rounded-xl bg-slate-50 border-none h-11">
              <TrendingUp className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Rentabilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="IDEAL">Margem Ideal</SelectItem>
              <SelectItem value="OK">Margem OK</SelectItem>
              <SelectItem value="CRITICA">Margem Crítica</SelectItem>
              <SelectItem value="SEM_PRECO">Sem Preço</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 font-medium">
            <Download className="w-4 h-4 mr-2" />
            Exportar XLS
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <PricingTable 
        procedures={data?.procedures || []} 
        config={data?.config} 
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
