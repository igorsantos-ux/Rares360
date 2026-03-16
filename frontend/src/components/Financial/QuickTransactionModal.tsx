import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Loader2,
  Calendar as CalendarIcon,
  Tag,
  FileText,
  Check
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({ isOpen, onClose, selectedDate }) => {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paymentMethod: 'Pix',
    category: 'Procedimentos',
    supplierName: '', // Para saídas
    costCenter: 'Operacional',
    costType: 'Variável'
  });

  const incomeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pendenciais`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-clinic-id': localStorage.getItem('clinicId') || ''
        },
        body: JSON.stringify({
          description: data.description,
          amount: Number(data.amount),
          dueDate: selectedDate,
          status: 'RECEBIDO',
          procedureName: data.category === 'Procedimentos' ? data.description : 'Geral'
        })
      });
      if (!response.ok) throw new Error('Falha ao criar entrada');
      return response.json();
    }
  });

  const expenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contas-a-pagar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-clinic-id': localStorage.getItem('clinicId') || ''
        },
        body: JSON.stringify({
          description: data.description,
          totalAmount: Number(data.amount),
          paymentMethod: data.paymentMethod,
          costCenter: data.costCenter,
          costType: data.costType,
          supplierName: data.supplierName || 'Diversos',
          isInstallment: false,
          installments: [{
            installmentNumber: 1,
            amount: Number(data.amount),
            dueDate: selectedDate,
            status: 'PAGO',
            paymentMethod: data.paymentMethod
          }]
        })
      });
      if (!response.ok) throw new Error('Falha ao criar saída');
      return response.json();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      toast.error('Preencha a descrição e o valor');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'income') {
        await incomeMutation.mutateAsync(formData);
      } else {
        await expenseMutation.mutateAsync(formData);
      }
      
      toast.success('Lançamento realizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['day-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['closure-status'] });
      onClose();
      setFormData({
        description: '',
        amount: '',
        paymentMethod: 'Pix',
        category: 'Procedimentos',
        supplierName: '',
        costCenter: 'Operacional',
        costType: 'Variável'
      });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar lançamento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <DollarSign className="text-[#697D58]" /> Novo Lançamento Rápido
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon size={12} /> {selectedDate.split('-').reverse().join('/')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2 mx-8 mt-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-2">
          <button 
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400'
            }`}
          >
            <TrendingUp size={14} /> Entrada (Receita)
          </button>
          <button 
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'expense' ? 'bg-white text-red-500 shadow-sm border border-slate-100' : 'text-slate-400'
            }`}
          >
            <TrendingDown size={14} /> Saída (Despesa)
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} /> Descrição do Lançamento
              </label>
              <input 
                autoFocus
                type="text"
                placeholder={activeTab === 'income' ? "Ex: Venda de Botox, Consulta..." : "Ex: Compra de Café, Material de Escritório..."}
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={12} /> Valor (R$)
              </label>
              <input 
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.amount}
                onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={12} /> Meio de Pagamento
              </label>
              <select 
                value={formData.paymentMethod}
                onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all appearance-none cursor-pointer"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>

            {activeTab === 'income' ? (
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={12} /> Categoria
                </label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all appearance-none cursor-pointer"
                >
                  <option value="Procedimentos">Procedimentos</option>
                  <option value="Material">Venda de Material</option>
                  <option value="Produtos">Produtos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            ) : (
              <>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} /> Fornecedor / Credor
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Amazon, Mercado Livre, Nome do Colaborador"
                    value={formData.supplierName}
                    onChange={e => setFormData(p => ({ ...p, supplierName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} /> Centro de Custo
                  </label>
                  <select 
                    value={formData.costCenter}
                    onChange={e => setFormData(p => ({ ...p, costCenter: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all appearance-none cursor-pointer"
                  >
                    <option value="Operacional">Operacional</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Marketing">Marketing</option>
                    <option value="RH">Recursos Humanos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Filter size={12} /> Tipo de Custo
                  </label>
                  <select 
                    value={formData.costType}
                    onChange={e => setFormData(p => ({ ...p, costType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#697D58]/20 focus:border-[#697D58] transition-all appearance-none cursor-pointer"
                  >
                    <option value="Variável">Custos Variáveis</option>
                    <option value="Fixo">Despesas Fixas</option>
                    <option value="Investimento">Investimentos</option>
                  </select>
                </div>
              </>
            )}

          </div>

          <div className="pt-6 border-t border-slate-50 flex gap-4">
             <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
             >
                Cancelar
             </button>
             <button 
                type="submit"
                disabled={loading}
                className={`flex-[2] py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                  activeTab === 'income' 
                  ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700' 
                  : 'bg-red-500 shadow-red-500/20 hover:bg-red-600'
                }`}
             >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={4} />}
                Confirmar Lançamento
             </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default QuickTransactionModal;

// Mock User Icon for user in Saída Credor
const User = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Mock Filter Icon
const Filter = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
