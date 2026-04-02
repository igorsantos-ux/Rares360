import React, { useState } from 'react';
import { 
  X, 
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
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paymentMethod: 'Pix',
    category: 'Procedimentos'
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
          category: data.category,
          paymentMethod: data.paymentMethod,
          procedureName: data.category === 'Procedimentos' ? data.description : 'Geral'
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Falha ao criar entrada');
      }
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
      await incomeMutation.mutateAsync(formData);
      
      toast.success('Lançamento realizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['day-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['closure-status'] });
      onClose();
      setFormData({
        description: '',
        amount: '',
        paymentMethod: 'Pix',
        category: 'Procedimentos'
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
                placeholder="Ex: Venda de Botox, Consulta..."
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
                className="flex-[2] py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700"
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


