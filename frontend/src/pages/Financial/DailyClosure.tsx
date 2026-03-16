import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Lock as LockIcon, 
  Unlock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  DollarSign,
  History,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DailyClosure = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const queryClient = useQueryClient();

  const { data: statusData } = useQuery({
    queryKey: ['closure-status', selectedDate],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cash/status?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-clinic-id': localStorage.getItem('clinicId') || ''
        }
      });
      return response.json();
    }
  });

  const { data: financialData } = useQuery({
    queryKey: ['day-summary', selectedDate],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/summary?startDate=${selectedDate}&endDate=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-clinic-id': localStorage.getItem('clinicId') || ''
        }
      });
      return response.json();
    }
  });

  const closureMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cash/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-clinic-id': localStorage.getItem('clinicId') || ''
        },
        body: JSON.stringify({ date: selectedDate })
      });
      if (!response.ok) throw new Error('Falha ao fechar caixa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closure-status'] });
      alert('Caixa fechado com sucesso! Este dia agora é imutável.');
    }
  });

  const isClosed = statusData?.status === 'CLOSED';
  const totals = {
    income: financialData?.totalIncome || 0,
    expense: financialData?.totalExpense || 0,
    opening: statusData?.closureInfo?.openingBalance || 0,
  };

  const expectedClosing = totals.opening + totals.income - totals.expense;

  const handleCloseDay = () => {
    if (confirm('Atenção: Após o fechamento, nenhuma transação deste dia poderá ser alterada ou excluída. Confirma o fechamento?')) {
      closureMutation.mutate();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 p-6 rounded-3xl border border-white/50 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <LockIcon className="text-[#697D58]" /> Fechamento de Caixa
          </h1>
          <p className="text-slate-500 mt-1">Gerencie a imutabilidade e integridade do seu caixa diário.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#697D58] outline-none text-slate-700 transition-all"
            />
          </div>
          
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-semibold ${
            isClosed ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {isClosed ? <LockIcon size={16} /> : <Unlock size={16} />}
            {isClosed ? 'FECHADO' : 'ABERTO'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Saldo Inicial" 
          value={totals.opening} 
          icon={<DollarSign className="text-blue-500" />}
          color="blue"
        />
        <StatCard 
          title="Entradas" 
          value={totals.income} 
          icon={<TrendingUp className="text-emerald-500" />}
          color="emerald"
        />
        <StatCard 
          title="Saídas" 
          value={totals.expense} 
          icon={<TrendingDown className="text-red-500" />}
          color="red"
        />
        <StatCard 
          title="Saldo Final Esperado" 
          value={expectedClosing} 
          icon={<CheckCircle2 className="text-[#697D58]" />}
          color="rares"
          highlight
        />
      </div>

      {/* Main Action Area */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6">
        <div className="max-w-md mx-auto">
          {!isClosed ? (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Unlock className="text-emerald-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">O caixa está aberto</h2>
              <p className="text-slate-500 mt-2 mb-8">
                Você ainda pode realizar movimentações, editar transações e ajustar lançamentos para o dia {format(new Date(selectedDate), "dd 'de' MMMM", { locale: ptBR })}.
              </p>
              <button
                onClick={handleCloseDay}
                disabled={closureMutation.isPending}
                className="w-full py-4 bg-[#697D58] hover:bg-[#5a6b4b] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#697D58]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {closureMutation.isPending ? <Loader2 className="animate-spin" /> : <LockIcon size={20} />}
                Finalizar e Fechar Caixa
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockIcon className="text-red-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Dia Encerrado</h2>
              <p className="text-slate-500 mt-2 mb-8">
                Este dia foi fechado em {format(new Date(statusData?.closureInfo?.closedAt), "dd/MM 'às' HH:mm", { locale: ptBR })} por {statusData?.closureInfo?.closedBy?.name || 'Sistema'}.
                A imutabilidade está ativa: nenhuma alteração é permitida.
              </p>
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" />
                Auditoria protegida. Para correções, utilize lançamentos de ajuste no dia atual.
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* History / Audit Section */}
      <div className="bg-white/30 p-6 rounded-3xl border border-dashed border-slate-300">
        <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-4">
          <History size={14} /> Histórico de Auditoria
        </h3>
        <p className="text-slate-400 text-sm">Registro de logs e alterações em tempo real...</p>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, highlight = false }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    rares: 'bg-[#697D58]/10 border-[#697D58]/20 text-[#697D58]'
  };

  return (
    <div className={`p-6 rounded-3xl border transition-all ${highlight ? 'ring-2 ring-[#697D58] ring-offset-2' : ''} ${colors[color] || 'bg-white'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/80 rounded-xl shadow-sm">
          {icon}
        </div>
        <span className="text-sm font-bold uppercase tracking-wider opacity-80">{title}</span>
      </div>
      <div className="text-2xl font-black">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
      </div>
    </div>
  );
};

export default DailyClosure;
