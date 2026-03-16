import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Lock as LockIcon, 
  Unlock, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Loader2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Check,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Clock,
  Plus,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import QuickTransactionModal from '../../components/Financial/QuickTransactionModal';
import ConfirmClosureModal from '../../components/Financial/ConfirmClosureModal';

const DailyClosure = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
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
      expense: transactions.filter((t: any) => t.type === 'EXPENSE' && (t.status === 'PAID' || t.status === 'PAGO')).reduce((acc, t) => acc + t.amount, 0),
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
      setIsConfirmModalOpen(false);
      toast.success('Caixa fechado com sucesso! Dados protegidos.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Falha ao fechar caixa');
    }
  });

  const openingBalance = statusData?.closureInfo?.openingBalance || 0;
  const expectedClosing = openingBalance + totals.income - totals.expense;
  const canClose = checklist.cash && checklist.cards;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'HH:mm');
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
      
      {/* 1. Dashboard de Resumo (Topo - Barra Horizontal) */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={14} className="text-slate-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abertura</p>
            </div>
            <p className="text-xl font-mono font-bold text-slate-700 leading-none">{formatCurrency(openingBalance)}</p>
          </div>
          
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entradas</p>
            </div>
            <p className="text-xl font-mono font-bold text-emerald-600 leading-none">+{formatCurrency(totals.income)}</p>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown size={14} className="text-red-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saídas</p>
            </div>
            <p className="text-xl font-mono font-bold text-red-500 leading-none">-{formatCurrency(totals.expense)}</p>
          </div>

          <div className="p-8 bg-[#697D58]/5 relative">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={14} className="text-[#697D58]" />
              <p className="text-[10px] font-black text-[#697D58]/60 uppercase tracking-widest">Saldo Esperado</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-mono font-black text-[#697D58] leading-none">{formatCurrency(expectedClosing)}</p>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
               <DollarSign size={48} className="text-[#697D58]" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal (Cockpit) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. Área Principal: Extrato do Dia */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[650px] flex flex-col">
            
            {/* Header do Extrato Integrado */}
            <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 tracking-tight">
                  <FileText size={20} className="text-[#697D58]" /> Extrato Detalhado do Dia
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    <button 
                      onClick={() => setActiveTab('all')}
                      className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-500'
                      }`}
                    >
                      Tudo ({transactions?.length || 0})
                    </button>
                    <button 
                      onClick={() => setActiveTab('income')}
                      className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-emerald-500'
                      }`}
                    >
                      Entradas
                    </button>
                    <button 
                      onClick={() => setActiveTab('expense')}
                      className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        activeTab === 'expense' ? 'bg-white text-red-500 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-red-500'
                      }`}
                    >
                      Saídas
                    </button>
                  </div>
                </div>
              </div>

              {!isClosed && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#697D58] text-white px-6 py-4 rounded-2xl shadow-lg shadow-[#697D58]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Plus size={18} strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Novo Lançamento</span>
                </button>
              )}
            </div>

            {/* Tabela de Movimentações Elite */}
            <div className="flex-1 overflow-auto">
              {isTransLoading ? (
                 <div className="h-full flex flex-col items-center justify-center py-32 text-slate-300">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="font-bold text-sm tracking-widest uppercase opacity-50">Auditoria em tempo real...</p>
                 </div>
              ) : filteredTransactions.length > 0 ? (
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
                    <tr className="border-b border-slate-100">
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-12">Hora</th>
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Movimentação / Fluxo</th>
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                      <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest pr-12">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map((t: any, i) => (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-6 pl-12">
                          <div className="flex items-center gap-3">
                            <Clock size={12} className="text-slate-300" />
                            <span className="text-xs font-mono font-bold text-slate-400">{formatTime(t.date)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-medium text-slate-600 leading-tight mb-1">{t.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/80 px-2 py-0.5 rounded-md">
                              {t.category || 'Geral'}
                            </span>
                            {t.isInstallment && (
                               <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md">
                                 Pagamento Programado
                               </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3 text-slate-500">
                              {t.paymentMethod?.toLowerCase().includes('pix') ? <QrCode size={14} strokeWidth={2.5} /> : 
                               t.paymentMethod?.toLowerCase().includes('cart') ? <CreditCard size={14} strokeWidth={2.5} /> : 
                               <Banknote size={14} strokeWidth={2.5} />}
                              <span className="text-[9px] font-black uppercase tracking-widest">{t.paymentMethod || 'Outros'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right pr-12">
                          <div className="flex items-center justify-end gap-3">
                            <span className={`text-sm font-mono font-semibold ${
                              t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700'
                            }`}>
                              {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                            {t.type === 'INCOME' ? 
                              <ArrowUpRight size={14} strokeWidth={3} className="text-emerald-400" /> : 
                              <ArrowDownLeft size={14} strokeWidth={3} className="text-red-400/60" />
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-40 text-center px-12 animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                    <Receipt size={40} strokeWidth={1.5} className="text-slate-200" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-widest mb-2">Sem Movimentações</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">Inicie o dia registrando entradas ou saídas para compor o extrato de auditoria.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Sidebar de Cockpit (Vertical Bloqueado) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          
          {/* Dashboard de Status Coeso */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            
            {/* Seletor de Auditoria */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Painel de Controle</p>
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter ${
                    isClosed ? 'bg-red-50 border-red-100 text-red-500' : 'bg-[#697D58]/10 border-[#697D58]/20 text-[#697D58]'
                 }`}>
                    {isClosed ? <LockIcon size={10} /> : <Unlock size={10} />}
                    {isClosed ? 'Dia Trancado' : 'Auditando Dia'}
                 </div>
              </div>

              <div className="relative group">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all cursor-pointer"
                />
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-[#697D58]" size={16} />
              </div>
            </div>

            {/* Protocolo Elite (Switcher Style) */}
            {!isClosed && (
              <div className="pt-6 border-t border-slate-50 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Filter size={14} /> Protocolo de Conferência
                </p>
                <div className="grid gap-3">
                  <button 
                    onClick={() => setChecklist(p => ({ ...p, cash: !p.cash }))}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      checklist.cash ? 'bg-[#697D58]/5 border-[#697D58]/20' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`p-2.5 rounded-xl transition-all ${checklist.cash ? 'bg-[#697D58] text-white shadow-lg shadow-[#697D58]/20' : 'bg-white border border-slate-100 text-slate-200'}`}>
                          <DollarSign size={16} />
                       </div>
                       <div className="text-left">
                          <p className={`text-[10px] font-black uppercase tracking-tight ${checklist.cash ? 'text-[#697D58]' : 'text-slate-400'}`}>Caixa Físico</p>
                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter opacity-70">Espécie Conferida</p>
                       </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${checklist.cash ? 'bg-[#697D58]' : 'bg-slate-200'}`}>
                       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checklist.cash ? 'left-6' : 'left-1'}`} />
                    </div>
                  </button>

                  <button 
                    onClick={() => setChecklist(p => ({ ...p, cards: !p.cards }))}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      checklist.cards ? 'bg-[#697D58]/5 border-[#697D58]/20' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`p-2.5 rounded-xl transition-all ${checklist.cards ? 'bg-[#697D58] text-white shadow-lg shadow-[#697D58]/20' : 'bg-white border border-slate-100 text-slate-200'}`}>
                          <CreditCard size={16} />
                       </div>
                       <div className="text-left">
                          <p className={`text-[10px] font-black uppercase tracking-tight ${checklist.cards ? 'text-[#697D58]' : 'text-slate-400'}`}>Lotes de Cartão</p>
                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter opacity-70">Rede/Adquirente</p>
                       </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${checklist.cards ? 'bg-[#697D58]' : 'bg-slate-200'}`}>
                       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checklist.cards ? 'left-6' : 'left-1'}`} />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Notas Operacionais */}
            <div className="pt-6 border-t border-slate-50 space-y-3 font-mono">
              <div className="flex items-center gap-2">
                 <FileText size={14} className="text-slate-400" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações Auditadas</p>
              </div>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isClosed}
                placeholder="Insira notas explicativas sobre divergências ou ocorrências..."
                className="w-full min-h-[120px] bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#697D58]/20 transition-all resize-none placeholder:text-slate-300 disabled:bg-slate-50/50"
              />
            </div>

            {/* Ação Final Cockpit */}
            <div className="pt-8 border-t border-slate-50">
               {isClosed ? (
                 <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#697D58]">
                          <User size={18} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-tight">Responsável</p>
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{statusData?.closureInfo?.closedBy?.name || 'Administrador'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                       <div className="p-1 px-3 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#697D58]">
                          IMMUTABLE
                       </div>
                       <p className="text-[9px] font-bold text-slate-400 tracking-tighter">O registro foi selado às {statusData?.closureInfo?.closedAt ? format(new Date(statusData.closureInfo.closedAt), 'HH:mm') : '--:--'}.</p>
                    </div>
                 </div>
               ) : (
                 <button
                   onClick={() => {
                     if (!canClose) return;
                     setIsConfirmModalOpen(true);
                   }}
                   disabled={!canClose || closureMutation.isPending}
                   className={`w-full py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 transition-all active:scale-95 ${
                     canClose 
                     ? 'bg-[#697D58] text-white shadow-xl shadow-[#697D58]/40 hover:bg-[#5a6b4b] hover:shadow-2xl hover:-translate-y-1' 
                     : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'
                   }`}
                 >
                   {closureMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 
                    canClose ? <Check size={16} strokeWidth={4} /> : <LockIcon size={16} />}
                   Finalizar e Encerrar Dia
                 </button>
               )}
            </div>
          </div>
          

        </div>
      </div>

      <QuickTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
      />

      <ConfirmClosureModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => closureMutation.mutate()}
        isPending={closureMutation.isPending}
      />
    </div>
  );
};

export default DailyClosure;
