import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Save,
  Loader2,
  Package,
  Tags,
  Info,
  Truck,
  Calendar,
  Hash,
  DollarSign,
  Box
} from 'lucide-react';
import { coreApi } from '../../services/api';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const inventorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  currentStock: z.coerce.number().min(0, 'Quantidade deve ser positiva'),
  minQuantity: z.coerce.number().min(0, 'Mínimo deve ser positivo'),
  unitCost: z.coerce.number().min(0, 'Custo deve ser positivo'),
  supplier: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  item?: any;
}

export function InventorySheet({ isOpen, onClose, onSave, item }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema) as any,
    defaultValues: {
      name: '',
      category: '',
      unit: 'Unidade',
      currentStock: 0,
      minQuantity: 0,
      unitCost: 0,
      supplier: '',
      expirationDate: '',
      batch: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        reset({
          ...item,
          expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : '',
          supplier: item.supplier || '',
          batch: item.batch || ''
        });
      } else {
        reset({
          name: '',
          category: '',
          unit: 'Unidade',
          currentStock: 0,
          minQuantity: 0,
          unitCost: 0,
          supplier: '',
          expirationDate: '',
          batch: ''
        });
      }
    }
  }, [item, isOpen, reset]);

  const onSubmit: SubmitHandler<InventoryFormData> = async (data) => {
    try {
      setIsSubmitting(true);

      // Isolamento de falhas com Try/Catch e Toast
      await coreApi.createStockItem(data);
      toast.success('Item registrado com sucesso!');

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar item:", error);
      const message = error.response?.data?.error || "Erro ao salvar item no estoque. Verifique sua conexão.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-[#FDFBF7] shadow-2xl z-50 flex flex-col border-l border-[#8A9A5B]/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-[#8A9A5B] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Package size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">{item ? 'Editar Item' : 'Novo Insumo'}</h2>
                  <p className="text-white/80 text-xs font-medium">Controle total de materiais</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200">
              <form id="inventoryForm" onSubmit={handleSubmit(onSubmit as any)} className="space-y-10">

                {/* Dados Básicos */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#8A9A5B]/10">
                    <Info size={16} className="text-[#8A9A5B]" />
                    <h3 className="text-xs font-black text-[#697D58] uppercase tracking-widest">Informações Gerais</h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Insumo <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        {...register('name')}
                        placeholder="Ex: Toxina Botulínica, Luvas P"
                        className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl pl-12 pr-4 py-3.5 text-slate-700 font-bold focus:ring-4 focus:ring-[#8A9A5B]/10 focus:border-[#8A9A5B] transition-all outline-none"
                      />
                    </div>
                    {errors.name && <span className="text-red-500 text-[10px] font-bold uppercase tracking-tighter">{errors.name.message}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <select
                          {...register('category')}
                          className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#8A9A5B]/10 transition-all outline-none appearance-none"
                        >
                          <option value="">Selecione</option>
                          <option value="Injetáveis">💉 Injetáveis</option>
                          <option value="Descartáveis">📦 Descartáveis</option>
                          <option value="Cosméticos">🧴 Cosméticos</option>
                          <option value="Equipamentos">🔬 Equipamentos</option>
                          <option value="Outros">⚙️ Outros</option>
                        </select>
                      </div>
                      {errors.category && <span className="text-red-500 text-[10px] font-bold uppercase tracking-tighter">{errors.category.message}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <select
                          {...register('unit')}
                          className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#8A9A5B]/10 transition-all outline-none appearance-none"
                        >
                          <option value="Unidade">Unidade</option>
                          <option value="Caixa">Caixa</option>
                          <option value="Frasco">Frasco</option>
                          <option value="Ampola">Ampola</option>
                          <option value="ml">ml</option>
                          <option value="mg">mg</option>
                        </select>
                      </div>
                      {errors.unit && <span className="text-red-500 text-[10px] font-bold uppercase tracking-tighter">{errors.unit.message}</span>}
                    </div>
                  </div>
                </section>

                {/* Controle de Estoque */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#DEB587]/20">
                    <Box size={16} className="text-[#DEB587]" />
                    <h3 className="text-xs font-black text-[#DEB587] uppercase tracking-widest">Saldo & Segurança</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd Atual</label>
                      <input
                        type="number"
                        step="any"
                        {...register('currentStock')}
                        className="w-full bg-white border border-[#DEB587]/20 rounded-2xl px-5 py-3.5 text-slate-700 font-bold focus:ring-4 focus:ring-[#DEB587]/10 focus:border-[#DEB587] transition-all outline-none text-center text-lg"
                      />
                      {errors.currentStock && <span className="text-red-500 text-[10px] font-bold uppercase tracking-tighter">{errors.currentStock.message}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-[#DEB587]">Qtd Mínima (Alerta)</label>
                      <input
                        type="number"
                        step="any"
                        {...register('minQuantity')}
                        className="w-full bg-[#DEB587]/5 border-2 border-[#DEB587]/30 rounded-2xl px-5 py-3.5 text-slate-700 font-bold focus:ring-4 focus:ring-[#DEB587]/10 focus:border-[#DEB587] transition-all outline-none text-center text-lg placeholder:text-[#DEB587]/30"
                      />
                      {errors.minQuantity && <span className="text-red-500 text-[10px] font-bold uppercase tracking-tighter">{errors.minQuantity.message}</span>}
                    </div>
                  </div>
                </section>

                {/* Valores e Rastreabilidade */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Hash size={16} className="text-slate-400" />
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Rastreabilidade & Custos</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Unitário</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="number"
                          step="0.01"
                          {...register('unitCost')}
                          placeholder="0,00"
                          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-700 font-bold focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lote</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          {...register('batch')}
                          placeholder="Ex: L2024-X"
                          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-700 font-bold focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-[#8A9A5B]">Data de Validade</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9A5B]" size={18} />
                        <input
                          type="date"
                          {...register('expirationDate')}
                          className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#8A9A5B]/5 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</label>
                      <div className="relative">
                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          {...register('supplier')}
                          placeholder="Nome do parceiro"
                          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[#8A9A5B]/10 bg-white">
              <div className="flex gap-4">
                <button type="button" onClick={onClose} className="flex-1 py-4 px-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs bg-slate-50 hover:bg-slate-100 transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="inventoryForm"
                  disabled={isSubmitting}
                  className="flex-[2] flex items-center justify-center gap-3 py-4 px-4 rounded-2xl font-black text-white bg-[#8A9A5B] hover:bg-[#697D58] shadow-xl shadow-[#8A9A5B]/30 transition-all disabled:opacity-70 group"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                  <span className="uppercase tracking-widest text-xs">{item ? 'Salvar Alterações' : 'Registrar no Estoque'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
