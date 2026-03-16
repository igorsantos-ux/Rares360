import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Lock as LockIcon, 
  Unlock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  DollarSign,
  History,
  Loader2,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  User,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const DailyClosure = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checklist, setChecklist] = useState({
    cash: false,
    cards: false,
    vouchers: false
  });
  
  const queryClient = useQueryClient();

  // Status de Fechamento
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

  // Transações do Dia
  const { data: transactions, isLoading: isTransLoading } = useQuery({
    queryKey: ['day-transactions', selectedDate],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/financial/transactions?startDate=${selectedDate}&endDate=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-clinic-id': localStorage.getItem('clinicId') || ''
        }
      });
      return response.json();
    }
  });

  const isClosed = statusData?.status === 'CLOSED';
  
  // Agrupamento por Meio de Pagamento
  const methodsSummary = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    const summary: Record<string, { label: string; icon: any; count: number; total: number }> = {
      'Pix': { label: 'Pix / Transferência', icon: <QrCode size={18} />, count: 0, total: 0 },
      'Cartão': { label: 'Cartão (Débito/Crédito)', icon: <CreditCard size={18} />, count: 0, total: 0 },
      'Dinheiro': { label: 'Dinheiro em Espécie', icon: <Banknote size={18} />, count: 0, total: 0 },
      'Outros': { label: 'Outros Meios', icon: <DollarSign size={18} />, count: 0, total: 0 },
    };

    transactions.filter((t: any) => t.type === 'INCOME' && t.status === 'PAID').forEach((t: any) => {
      let key = 'Outros';
      if (t.paymentMethod?.toLowerCase().includes('pix')) key = 'Pix';
      else if (t.paymentMethod?.toLowerCase().includes('cart')) key = 'Cartão';
      else if (t.paymentMethod?.toLowerCase().includes('dinheiro') || t.paymentMethod?.toLowerCase().includes('especie')) key = 'Dinheiro';
      
      summary[key].count += 1;
      summary[key].total += t.amount;
    });

    return Object.values(summary).filter(s => s.count > 0 || s.total > 0);
  }, [transactions]);

  const totals = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return { income: 0, expense: 0 };
    return {
      income: transactions.filter((t: any) => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0),
      expense: transactions.filter((t: any) => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0),
    };
  }, [transactions]);

  const lastTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    return transactions.slice(0, 5);
  }, [transactions]);

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
      toast.success('Caixa fechado com sucesso! Dados protegidos.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao realizar fechamento');
    }
  });

  const openingBalance = statusData?.closureInfo?.openingBalance || 0;
  const expectedClosing = openingBalance + totals.income - totals.expense;
  const canClose = checklist.cash && checklist.cards;

  const toggleCheck = (key: keyof typeof checklist) => {
    if (isClosed) return;
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Header de Status (Slim) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Data do Caixa</p>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer hover:text-[#697D58] transition-colors"
              />
            </div>
          </div>

          <div className="h-8 w-px bg-slate-100" />
          
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isClosed ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
              {isClosed ? <LockIcon size={18} /> : <Unlock size={18} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
              <span className={`text-sm font-bold ${isClosed ? 'text-red-600' : 'text-emerald-600'}`}>
                {isClosed ? 'CAIXA FECHADO' : 'CAIXA ABERTO'}
              </span>
            </div>
          </div>

          {isClosed && (
            <>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Responsável</p>
                  <span className="text-sm font-bold text-slate-700">
                    {statusData?.closureInfo?.closedBy?.name || 'Sistema'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-[#697D58]/5 px-4 py-2 rounded-xl border border-[#697D58]/10">
          <p className="text-[10px] font-black text-[#697D58] uppercase tracking-widest text-right">Saldo Final Esperado</p>
          <p className="text-lg font-black text-[#697D58]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedClosing)}
          </p>
        </div>
      </div>

      {/* 2. Área Central (Grid 60/40) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Lado Esquerdo (60% - Conferência por Meio de Pagamento) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                <DollarSign size={18} className="text-[#697D58]" /> Conferência por Meio de Pagamento
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase">Apenas Pagos</span>
            </div>
            
            <div className="p-6">
              {isTransLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Carregando dados...
                </div>
              ) : methodsSummary.length > 0 ? (
                <div className="space-y-3">
                  {methodsSummary.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#697D58]">
                          {m.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{m.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{m.count} transação(ões)</p>
                        </div>
                      </div>
                      <p className="text-base font-black text-slate-800">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.total)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Nenhum movimento registrado hoje.</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Seção Inferior (Últimas 5 Transações) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h2 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                <History size={18} className="text-[#697D58]" /> Últimas Transações do Dia
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Meio</th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lastTransactions.map((t: any, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{t.description}</p>
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                          t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{t.paymentMethod || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`text-sm font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {t.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {lastTransactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm">Sem transações recentes.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lado Direito (40% - Resumo e Lógica de Saldo) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <h2 className="font-black text-slate-800 uppercase tracking-wider text-sm mb-6">Resumo Financeiro</h2>
                
                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={14} className="text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Saldo de Abertura</span>
                  </div>
                  <span className="text-sm font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(openingBalance)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Entradas</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.income)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={14} className="text-red-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Saídas</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">
                    - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.expense)}
                  </span>
                </div>

                <div className="h-px bg-slate-50 mt-6" />

                <div className="pt-4">
                  <div className="bg-[#697D58]/5 p-6 rounded-2xl border border-[#697D58]/10 text-center">
                    <p className="text-[10px] font-black text-[#697D58]/60 uppercase tracking-widest mb-1">Saldo Final Esperado</p>
                    <p className="text-3xl font-black text-[#697D58]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedClosing)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist de Segurança */}
              {!isClosed && (
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Conferência</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => toggleCheck('cash')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        checklist.cash ? 'bg-[#697D58]/10 border-[#697D58]/30 text-[#697D58]' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                        checklist.cash ? 'bg-[#697D58] border-[#697D58] text-white' : 'bg-white border-slate-300'
                      }`}>
                        {checklist.cash && <Check size={14} />}
                      </div>
                      <span className="text-xs font-bold">Confirmei valores em espécie</span>
                    </button>

                    <button 
                      onClick={() => toggleCheck('cards')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        checklist.cards ? 'bg-[#697D58]/10 border-[#697D58]/30 text-[#697D58]' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                        checklist.cards ? 'bg-[#697D58] border-[#697D58] text-white' : 'bg-white border-slate-300'
                      }`}>
                        {checklist.cards && <Check size={14} />}
                      </div>
                      <span className="text-xs font-bold">Confirmei lotes da maquininha</span>
                    </button>
                  </div>
                </div>
              )}

              {/* O Botão de Fechamento */}
              {isClosed ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-500 shrink-0" />
                  <p className="text-[11px] text-red-700 font-bold leading-tight uppercase">
                    Dia encerrado. A auditoria protegeu este registro e não permite alterações.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!canClose) return alert('Por favor, complete o protocolo de conferência antes de fechar.');
                    if (confirm('Deseja realmente encerrar este caixa? Esta ação é irreversível.')) closureMutation.mutate();
                  }}
                  disabled={closureMutation.isPending || !canClose}
                  className="w-full py-4 bg-[#697D58] hover:bg-[#5a6b4b] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#697D58]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95"
                >
                  {closureMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <LockIcon size={18} />}
                  FINALIZAR E FECHAR CAIXA
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyClosure;
