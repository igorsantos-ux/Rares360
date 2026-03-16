import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Lock as LockIcon, 
  Unlock, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  History,
  Loader2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Check,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const DailyClosure = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    cash: false,
    cards: false
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
  
  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    if (activeTab === 'all') return transactions;
    return transactions.filter((t: any) => t.type.toLowerCase() === activeTab);
  }, [transactions, activeTab]);

  const totals = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return { income: 0, expense: 0 };
    return {
      income: transactions.filter((t: any) => t.type === 'INCOME' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0),
      expense: transactions.filter((t: any) => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0),
    };
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
        body: JSON.stringify({ date: selectedDate, notes })
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Dashboard de Resumo (Topo - Barra Horizontal) */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-50">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={16} className="text-slate-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo de Abertura</p>
            </div>
            <p className="text-xl font-mono font-bold text-slate-700">{formatCurrency(openingBalance)}</p>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Entradas</p>
            </div>
            <p className="text-xl font-mono font-bold text-emerald-600">+{formatCurrency(totals.income)}</p>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown size={16} className="text-red-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Saídas</p>
            </div>
            <p className="text-xl font-mono font-bold text-red-500">-{formatCurrency(totals.expense)}</p>
          </div>

          <div className="p-6 bg-[#697D58]/5">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={16} className="text-[#697D58]" />
              <p className="text-[10px] font-black text-[#697D58]/60 uppercase tracking-widest">Saldo Final Esperado</p>
            </div>
            <p className="text-2xl font-mono font-black text-[#697D58]">{formatCurrency(expectedClosing)}</p>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 2. Área Principal: Extrato do Dia (Full Width) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            
            {/* Header com Filtros */}
            <div className="p-8 border-b border-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
                    <FileText size={20} className="text-[#697D58]" /> Extrato Detalhado do Dia
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Conferência ponto a ponto dos lançamentos</p>
                </div>

                <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Tudo ({transactions?.length || 0})
                  </button>
                  <button 
                    onClick={() => setActiveTab('income')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Entradas
                  </button>
                  <button 
                    onClick={() => setActiveTab('expense')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeTab === 'expense' ? 'bg-white text-red-500 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Saídas
                  </button>
                </div>
              </div>
            </div>

            {/* Tabela de Movimentações */}
            <div className="flex-1 overflow-auto">
              {isTransLoading ? (
                 <div className="h-full flex flex-col items-center justify-center py-24 text-slate-300">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="font-bold text-sm">Organizando extrato...</p>
                 </div>
              ) : filteredTransactions.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-12">Hora</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamento / Origem</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Meio</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pr-12">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map((t: any, i) => (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 pl-12">
                          <div className="flex items-center gap-3">
                            <Clock size={12} className="text-slate-300" />
                            <span className="text-xs font-mono font-bold text-slate-400">{formatTime(t.date)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-slate-700 leading-tight mb-0.5">{t.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter bg-slate-100/50 px-1.5 py-0.5 rounded">
                              {t.category || 'Geral'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              {t.paymentMethod?.toLowerCase().includes('pix') ? <QrCode size={14} className="text-slate-400" /> : 
                               t.paymentMethod?.toLowerCase().includes('cart') ? <CreditCard size={14} className="text-slate-400" /> : 
                               <Banknote size={14} className="text-slate-400" />}
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{t.paymentMethod || 'Outros'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right pr-12">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`text-sm font-mono font-bold ${
                              t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                            {t.type === 'INCOME' ? 
                              <ArrowUpRight size={14} className="text-emerald-300" /> : 
                              <ArrowDownLeft size={14} className="text-red-300" />
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-32 text-center px-8">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                    <History size={40} className="text-slate-200" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2">Aguardando movimentações</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">Não encontramos transações registradas para este período selecionado.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Sidebar de Fechamento (Lateral Direita) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          
          {/* Seletor de Data e Status */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Auditoria para o dia</p>
              <div className="relative group">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all cursor-pointer"
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#697D58]" size={18} />
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
              isClosed ? 'bg-red-50 border-red-100 text-red-500' : 'bg-[#697D58]/5 border-[#697D58]/10 text-[#697D58]'
            }`}>
              <div className="p-2 bg-white rounded-xl shadow-sm">
                {isClosed ? <LockIcon size={18} /> : <Unlock size={18} />}
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Status do Dia</p>
                <p className="text-xs font-black uppercase tracking-wide">{isClosed ? 'Dia Encerrado' : 'Aguardando Cierre'}</p>
              </div>
            </div>
          </div>

          {/* Protocolo e Ações */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-8">
            
            {/* Notas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                 <FileText size={14} className="text-slate-400" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações do Dia</p>
              </div>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isClosed}
                placeholder="Insira detalhes sobre faltas, sobras ou ocorrências excepcionais..."
                className="w-full min-h-[120px] bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#697D58]/20 transition-all resize-none placeholder:text-slate-300 disabled:opacity-50"
              />
            </div>

            {/* Checklist */}
            {!isClosed && (
              <div className="space-y-3 pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Filter size={14} /> Protocolo de Conferência
                </p>
                <div className="grid gap-3">
                  <button 
                    onClick={() => setChecklist(p => ({ ...p, cash: !p.cash }))}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      checklist.cash ? 'bg-[#697D58]/10 border-[#697D58]/30' : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      checklist.cash ? 'bg-[#697D58] border-[#697D58] text-white shadow-lg shadow-[#697D58]/20' : 'bg-white border-slate-200 text-transparent'
                    }`}>
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-tight ${checklist.cash ? 'text-[#697D58]' : 'text-slate-400'}`}>Espécie Conferida</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Bate com o físico no caixa</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setChecklist(p => ({ ...p, cards: !p.cards }))}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      checklist.cards ? 'bg-[#697D58]/10 border-[#697D58]/30' : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      checklist.cards ? 'bg-[#697D58] border-[#697D58] text-white shadow-lg shadow-[#697D58]/20' : 'bg-white border-slate-200 text-transparent'
                    }`}>
                      <Check size={14} strokeWidth={4} />
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-tight ${checklist.cards ? 'text-[#697D58]' : 'text-slate-400'}`}>Lotes de Cartão</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Comparado com a maquininha</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Ação Final */}
            {isClosed ? (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#697D58]">
                       <User size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fechado por</p>
                       <p className="text-xs font-black text-slate-800 uppercase">{statusData?.closureInfo?.closedBy?.name || 'Sistema'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-slate-400">
                    <div className="p-1 px-2.5 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                       PROTEEGIDO
                    </div>
                    <p className="text-[10px] font-bold">Registro imutável conforme normas de auditoria.</p>
                 </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!canClose) return;
                  if (confirm('Deseja realmente encerrar este caixa? Esta ação é irreversível e bloqueará as movimentações do dia.')) closureMutation.mutate();
                }}
                disabled={!canClose || closureMutation.isPending}
                className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 ${
                  canClose 
                  ? 'bg-[#697D58] text-white shadow-2xl shadow-[#697D58]/30 hover:bg-[#5a6b4b]' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'
                }`}
              >
                {closureMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 
                 canClose ? <CheckCircle2 size={18} /> : <LockIcon size={18} />}
                Finalizar e Encerrar Dia
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyClosure;
