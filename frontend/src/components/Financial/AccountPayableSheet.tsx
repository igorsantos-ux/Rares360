import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Plus, Save, DollarSign, FileText, Loader2, ListOrdered, CalendarDays, RefreshCw, File } from 'lucide-react';
// import { supabase } from '../../lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';

const accountPayableSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres'),
  documentNumber: z.string().optional(),
  supplierName: z.string().optional(),
  supplierCnpj: z.string().optional(),
  totalAmount: z.number().min(0.01, 'O valor deve ser maior que zero'),
  interestValue: z.number().optional(),
  penaltyValue: z.number().optional(),
  bank: z.string().optional(),
  observation: z.string().optional(),
  fileUrl: z.string().optional(),
  paymentMethod: z.string().min(1, 'Selecione a forma de pagamento'),
  date: z.string().optional(), // Data para à vista
  isInstallment: z.boolean(),
  installmentsCount: z.number().min(1, 'Mínimo de 1 parcela').optional(),
  installmentInterval: z.string().optional(),
  customIntervalDays: z.number().min(1).optional(),
  installments: z.array(z.object({
    installmentNumber: z.number(),
    amount: z.number(),
    dueDate: z.string(),
  })).optional()
});

type AccountPayableFormData = z.infer<typeof accountPayableSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function AccountPayableSheet({ isOpen, onClose, onSave }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, control, reset } = useForm<AccountPayableFormData>({
    resolver: zodResolver(accountPayableSchema),
    defaultValues: {
      description: '',
      documentNumber: '',
      supplierName: '',
      supplierCnpj: '',
      totalAmount: 0,
      interestValue: 0,
      penaltyValue: 0,
      bank: '',
      observation: '',
      fileUrl: '',
      paymentMethod: '',
      date: new Date().toISOString().split('T')[0],
      isInstallment: false,
      installmentsCount: 3,
      installmentInterval: 'MONTHLY',
      customIntervalDays: 30,
      installments: []
    }
  });

  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const { fields, replace } = useFieldArray({
    control,
    name: "installments"
  });

  const watchIsInstallment = watch('isInstallment');
  const watchTotalAmount = Number(watch('totalAmount')) || 0;
  const watchInterest = Number(watch('interestValue')) || 0;
  const watchPenalty = Number(watch('penaltyValue')) || 0;
  const watchInstallmentsCount = watch('installmentsCount') || 1;
  const watchInterval = watch('installmentInterval');
  const watchCustomDays = watch('customIntervalDays') || 30;
  const watchFileUrl = watch('fileUrl');

  // Lógica de Soma Dinâmica para o Total a Pagar
  const calculatedGrandTotal = Number((watchTotalAmount + watchInterest + watchPenalty).toFixed(2));

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    /* 
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setFileName(file.name);

      const fileExt = file.name.split('.').pop();
      const fileNameUnique = `${Math.random()}.${fileExt}`;
      const filePath = `${Date.now()}_${fileNameUnique}`;

      const { error: uploadError } = await supabase.storage
        .from('payables')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('payables')
        .getPublicUrl(filePath);

      reset({ ...watch(), fileUrl: publicUrl });
      alert('Arquivo carregado com sucesso!');
    } catch (error: any) {
      alert('Erro ao carregar arquivo: ' + error.message);
    } finally {
      setUploading(false);
    }
    */
    console.log('Upload temporariamente desativado para debug.');
  };

  // Função para gerar as parcelas automaticamente
  const handleGenerateInstallments = () => {
    if (calculatedGrandTotal <= 0) return;
    if (!watchInstallmentsCount || watchInstallmentsCount < 1) return;

    const amountPerInstallment = Number((calculatedGrandTotal / watchInstallmentsCount).toFixed(2));
    let remainder = Number((calculatedGrandTotal - (amountPerInstallment * watchInstallmentsCount)).toFixed(2));

    const newInstallments = [];
    let currentDate = new Date();

    for (let i = 1; i <= watchInstallmentsCount; i++) {
      let dueDate = new Date(currentDate);
      
      if (watchInterval === 'MONTHLY') {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (watchInterval === 'BIWEEKLY') {
        dueDate.setDate(dueDate.getDate() + (15 * i));
      } else if (watchInterval === 'WEEKLY') {
        dueDate.setDate(dueDate.getDate() + (7 * i));
      } else if (watchInterval === 'CUSTOM') {
        dueDate.setDate(dueDate.getDate() + (watchCustomDays * i));
      }

      // Adiciona o remainder (centavos) na última parcela
      let finalAmount = amountPerInstallment;
      if (i === watchInstallmentsCount && remainder !== 0) {
        finalAmount = Number((amountPerInstallment + remainder).toFixed(2));
      }

      newInstallments.push({
        installmentNumber: i,
        amount: finalAmount,
        dueDate: dueDate.toISOString().split('T')[0],
      });
    }

    replace(newInstallments);
  };

  const onSubmit = async (data: AccountPayableFormData) => {
    try {
      setIsSubmitting(true);
      
      // Formata os dados para o Backend
      // Envia o GrantTotal (Original + Taxas) como o Total efetivo da dívida para o Controller
      const payload: any = {
        description: data.description,
        documentNumber: data.documentNumber,
        supplierName: data.supplierName,
        supplierCnpj: data.supplierCnpj,
        totalAmount: calculatedGrandTotal,
        interestValue: data.interestValue || 0,
        penaltyValue: data.penaltyValue || 0,
        bank: data.bank,
        observation: data.observation,
        fileUrl: data.fileUrl,
        paymentMethod: data.paymentMethod,
        isInstallment: data.isInstallment,
      };

      if (data.isInstallment) {
        payload.installmentsCount = data.installmentsCount;
        payload.installmentInterval = data.installmentInterval;
        payload.installments = data.installments;
        // valida se gerou parcelas
        if (!payload.installments || payload.installments.length === 0) {
          alert("Por favor, gere as parcelas antes de salvar.");
          setIsSubmitting(false);
          return;
        }
      } else {
        payload.installmentsCount = 1;
        payload.installments = [{
          installmentNumber: 1,
          amount: calculatedGrandTotal,
          dueDate: data.date,
          status: 'PENDING'
        }];
      }

      await onSave(payload);
      reset();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Escuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />

          {/* Sheet / Drawer Lateral da Direita */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#FDFBF7] shadow-2xl shadow-slate-900/20 z-50 flex flex-col border-l border-[#8A9A5B]/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-[#8A9A5B] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <Plus size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Nova Conta</h2>
                  <p className="text-white/80 text-xs font-medium">Cadastro de Despesa a Pagar</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
              <form id="accountPayableForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Descrição da Conta
                  </label>
                  <input
                    {...register('description')}
                    placeholder="Ex: Conta de Luz, Internet, Fornecedor X"
                    className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 focus:border-[#8A9A5B] transition-all"
                  />
                  {errors.description && <span className="text-red-500 text-xs font-bold">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Numero NF/Doc */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">
                      Nº Documento / NF
                    </label>
                    <input
                      {...register('documentNumber')}
                      placeholder="Opcional"
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                    />
                  </div>
                  
                  {/* Fornecedor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Fornecedor / Credor</label>
                    <input
                      {...register('supplierName')}
                      placeholder="Identificação do recebedor"
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* CNPJ */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">
                      CNPJ Fornecedor
                    </label>
                    <input
                      {...register('supplierCnpj')}
                      placeholder="00.000.000/0000-00"
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                    />
                  </div>

                  {/* Banco */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider flex items-center gap-2">
                       <Plus size={14} /> Banco
                    </label>
                    <select
                      {...register('bank')}
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="Itaú">Itaú</option>
                      <option value="Bradesco">Bradesco</option>
                      <option value="Santander">Santander</option>
                      <option value="Banco do Brasil">Banco do Brasil</option>
                      <option value="Nubank">Nubank</option>
                      <option value="Inter">Inter</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Forma de Pagto</label>
                    <select
                      {...register('paymentMethod')}
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Pix">Pix</option>
                      <option value="Transferência">Transferência Bancária</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>
                    {errors.paymentMethod && <span className="text-red-500 text-xs font-bold">{errors.paymentMethod.message}</span>}
                  </div>
                </div>

                {/* Upload de Arquivo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider flex items-center gap-2">
                    <File size={14} /> Anexar Boleto / NF
                  </label>
                  <div className="relative">
                    {!watchFileUrl ? (
                      <div className="border-2 border-dashed border-[#8A9A5B]/30 rounded-2xl p-6 text-center hover:bg-[#8A9A5B]/5 transition-all cursor-pointer relative group">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-2">
                          {uploading ? (
                            <Loader2 className="animate-spin text-[#8A9A5B]" size={24} />
                          ) : (
                            <File className="text-slate-400 group-hover:text-[#8A9A5B] transition-colors" size={24} />
                          )}
                          <p className="text-xs font-bold text-slate-500">
                            {uploading ? `Enviando ${fileName}...` : 'Clique ou arraste para enviar arquivo'}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-medium">PDF, PNG, JPG (Max 5MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-white border border-[#8A9A5B]/20 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#8A9A5B]/10 rounded-xl flex items-center justify-center text-[#8A9A5B]">
                            <File size={20} />
                          </div>
                          <div className="max-w-[180px]">
                            <p className="text-xs font-black text-slate-700 truncate">Comprovante Anexado</p>
                            <a 
                              href={watchFileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-[#8A9A5B] font-bold flex items-center gap-1 hover:underline"
                            >
                              Ver Arquivo <Plus size={10} />
                            </a>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => reset({ ...watch(), fileUrl: '' })}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Observação */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Observações
                  </label>
                  <textarea
                    {...register('observation')}
                    placeholder="Adicione detalhes extras aqui..."
                    rows={3}
                    className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all resize-none"
                  />
                </div>

                {/* Bloco de Valores (Original, Juros, Multas, Total) */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Valor Original */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={12} /> Valor Original
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-[10px] text-slate-400 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register('totalAmount', { valueAsNumber: true })}
                          placeholder="0.00"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-700 font-bold text-sm focus:ring-2 focus:ring-[#8A9A5B]/40 transition-all"
                        />
                      </div>
                      {errors.totalAmount && <span className="text-red-500 text-[10px] font-bold">{errors.totalAmount.message}</span>}
                    </div>

                    {/* Juros */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        Juros
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-[10px] text-slate-400 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register('interestValue', { valueAsNumber: true })}
                          placeholder="0.00"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-700 font-bold text-sm focus:ring-2 focus:ring-[#8A9A5B]/40 transition-all"
                        />
                      </div>
                    </div>

                    {/* Multa */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        Multa
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-[10px] text-slate-400 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register('penaltyValue', { valueAsNumber: true })}
                          placeholder="0.00"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-700 font-bold text-sm focus:ring-2 focus:ring-[#8A9A5B]/40 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Valor Total Destacado */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 mt-2">
                    <span className="text-sm font-black text-[#697D58] uppercase tracking-widest">Total a Pagar</span>
                    <span className="text-2xl font-black text-[#8A9A5B]">R$ {calculatedGrandTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  {/* Data Vencimento (À Vista) */}
                  {!watchIsInstallment && (
                     <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                       <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider flex items-center gap-2">
                         <Calendar size={14} /> Data Vencimento
                       </label>
                       <input
                         type="date"
                         {...register('date')}
                         className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                       />
                     </div>
                  )}
                </div>

                {/* Switch Parcelamento */}
                <div className="bg-[#8A9A5B]/5 p-4 rounded-2xl border border-[#8A9A5B]/20 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-[#697D58] flex items-center gap-2"><ListOrdered size={16}/> Esta conta é parcelada?</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Ativar divisão automática de valores</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" {...register('isInstallment')} />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8A9A5B]"></div>
                  </label>
                </div>

                {/* Lógica Dinâmica de Parcelas */}
                {watchIsInstallment && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="space-y-6 pt-2 border-t border-[#8A9A5B]/10"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Quantidade</label>
                        <input
                          type="number"
                          {...register('installmentsCount', { valueAsNumber: true })}
                          className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Intervalo</label>
                        <select
                          {...register('installmentInterval')}
                          className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                        >
                          <option value="MONTHLY">Mensal</option>
                          <option value="BIWEEKLY">Quinzenal</option>
                          <option value="WEEKLY">Semanal</option>
                          <option value="CUSTOM">Personalizado (Dias)</option>
                        </select>
                      </div>

                      {watchInterval === 'CUSTOM' && (
                        <div className="space-y-1.5 flex-1 animate-in slide-in-from-left-2 duration-300">
                          <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">A cada quantos dias?</label>
                          <input
                            type="number"
                            {...register('customIntervalDays', { valueAsNumber: true })}
                            className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateInstallments}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-[#8A9A5B]/40 rounded-xl text-[#8A9A5B] font-bold text-sm hover:bg-[#8A9A5B]/5 hover:border-[#8A9A5B] transition-all"
                    >
                      <RefreshCw size={16} /> Gerar Previsão de Parcelas
                    </button>

                    {fields.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Pré-visualização</span>
                          <span className="text-xs font-bold text-[#8A9A5B]">{fields.length} parcelas</span>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                          {fields.map((field, index) => (
                            <div key={field.id} className="p-3 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                                {index + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-[10px] text-slate-400 font-bold text-xs">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    {...register(`installments.${index}.amount` as const, { valueAsNumber: true })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-slate-700 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-[#8A9A5B]/30 outline-none"
                                  />
                                </div>
                                <div className="relative">
                                  <CalendarDays className="absolute left-2 top-[10px] text-slate-400" size={14} />
                                  <input
                                    type="date"
                                    {...register(`installments.${index}.dueDate` as const)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-slate-700 font-bold text-sm space-x-2 focus:bg-white focus:ring-2 focus:ring-[#8A9A5B]/30 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </form>
            </div>

            {/* Footer / Ações */}
            <div className="p-6 border-t border-[#8A9A5B]/10 bg-white">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="accountPayableForm"
                  disabled={isSubmitting}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#8A9A5B] hover:bg-[#697D58] shadow-lg shadow-[#8A9A5B]/30 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar Conta
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
