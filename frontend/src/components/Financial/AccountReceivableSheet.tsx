import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, DollarSign, FileText, Loader2, File, User, Activity } from 'lucide-react';
import { coreApi, payablesApi } from '../../services/api';
import { AnimatePresence, motion } from 'framer-motion';

const receivableSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres'),
  patientId: z.string().min(1, 'Selecione ou informe o paciente'),
  procedureName: z.string().min(1, 'O procedimento é obrigatório'),
  amount: z.number().min(0.01, 'O valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'A data de vencimento é obrigatória'),
  status: z.string(),
  fileUrl: z.string().optional(),
  quantity: z.number().min(1, 'A quantidade deve ser pelo menos 1'),
  isExecuted: z.boolean().default(false),
});

type ReceivableFormData = z.infer<typeof receivableSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function AccountReceivableSheet({ isOpen, onClose, onSave }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableSchema) as any,
    defaultValues: {
      description: '',
      patientId: '',
      procedureName: '',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'PENDENTE',
      fileUrl: '',
      quantity: 1,
      isExecuted: false,
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoadingPatients(true);
      const res = await coreApi.getPatients();
      // O backend retorna { data: [...], summary: {...} }
      const patientsData = res.data?.data || [];
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const onSubmit: SubmitHandler<ReceivableFormData> = async (data: any) => {
    try {
      setIsSubmitting(true);
      let finalFileUrl = data.fileUrl;

      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const uploadRes = await payablesApi.uploadFile(formData);
          finalFileUrl = uploadRes.data.fileUrl;
        } catch (uploadError) {
          console.error("Falha ao subir arquivo:", uploadError);
        }
      }

      const payload = { 
        ...data,
        fileUrl: finalFileUrl
      };
      
      await onSave(payload);
      reset();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar recebível:", error);
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
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#FDFBF7] shadow-2xl z-50 flex flex-col border-l border-[#8A9A5B]/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-[#8A9A5B] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Novo Recebimento</h2>
                  <p className="text-white/80 text-xs font-medium">Cadastro de Pendencial de Faturamento</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
              <form id="receivableForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Descrição */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#697D58] uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} /> Descrição do Recebimento
                  </label>
                  <input
                    {...register('description')}
                    placeholder="Ex: Pagamento Consulta, Procedimento Estético"
                    className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-4 focus:ring-[#8A9A5B]/10 focus:border-[#8A9A5B] transition-all outline-none"
                  />
                  {errors.description && <span className="text-red-500 text-[10px] font-black uppercase tracking-tight">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Paciente */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#697D58] uppercase tracking-widest flex items-center gap-2">
                      <User size={14} /> Paciente / Cliente
                    </label>
                    <select
                      {...register('patientId')}
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-4 focus:ring-[#8A9A5B]/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoadingPatients}
                    >
                      <option value="">{isLoadingPatients ? "Carregando pacientes..." : (patients.length === 0 ? "Nenhum paciente cadastrado" : "Selecione um paciente...")}</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.fullName || p.name}</option>
                      ))}
                    </select>
                    {errors.patientId && <span className="text-red-500 text-[10px] font-black uppercase tracking-tight">{errors.patientId.message}</span>}
                  </div>

                  {/* Procedimento */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#697D58] uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} /> Procedimento / Categoria
                    </label>
                    <select
                      {...register('procedureName')}
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-4 focus:ring-[#8A9A5B]/10 outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="Consulta">Consulta</option>
                      <option value="Botox">Botox</option>
                      <option value="Preenchimento">Preenchimento</option>
                      <option value="Limpeza de Pele">Limpeza de Pele</option>
                      <option value="Bioestimulador">Bioestimulador</option>
                      <option value="Outros">Outros</option>
                    </select>
                    {errors.procedureName && <span className="text-red-500 text-[10px] font-black uppercase tracking-tight">{errors.procedureName.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Valor */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#697D58] uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={14} /> Valor Total
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        {...register('amount', { valueAsNumber: true })}
                        placeholder="0,00"
                        className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl pl-12 pr-5 py-4 text-slate-700 font-black focus:ring-4 focus:ring-[#8A9A5B]/10 outline-none transition-all"
                      />
                    </div>
                    {errors.amount && <span className="text-red-500 text-[10px] font-black uppercase tracking-tight">{errors.amount.message}</span>}
                  </div>

                  {/* Vencimento */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#697D58] uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} /> Data de Vencimento
                    </label>
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-4 focus:ring-[#8A9A5B]/10 outline-none transition-all"
                    />
                    {errors.dueDate && <span className="text-red-500 text-[10px] font-black uppercase tracking-tight">{errors.dueDate.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Quantidade */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#697D58] uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} /> Quantidade Comprada
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register('quantity', { valueAsNumber: true })}
                      className="w-full bg-white border border-[#8A9A5B]/20 rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-4 focus:ring-[#8A9A5B]/10 outline-none transition-all"
                    />
                    {errors.quantity && <span className="text-red-500 text-[10px] font-black uppercase tracking-tight">{errors.quantity.message}</span>}
                  </div>

                  {/* Realizado */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#697D58] uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} /> Status de Execução
                    </label>
                    <div className="flex items-center gap-3 bg-white border border-[#8A9A5B]/20 rounded-2xl px-5 py-4 h-[60px]">
                      <input
                        type="checkbox"
                        {...register('isExecuted')}
                        className="w-6 h-6 rounded-lg text-[#8A9A5B] focus:ring-[#8A9A5B]/20 border-[#8A9A5B]/20 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-600">Já foi realizado?</span>
                    </div>
                  </div>
                </div>

                {/* Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#697D58] uppercase tracking-widest flex items-center gap-2">
                    <File size={14} /> Anexar Comprovante / Pedido
                  </label>
                  <div className="relative">
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-[#8A9A5B]/30 rounded-[2rem] p-10 text-center hover:bg-[#8A9A5B]/5 transition-all cursor-pointer relative group">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 bg-[#8A9A5B]/10 rounded-full flex items-center justify-center text-[#8A9A5B] group-hover:scale-110 transition-transform">
                            <File size={26} />
                          </div>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Arraste ou clique para anexar
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-5 bg-white border border-[#8A9A5B]/30 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#8A9A5B]/10 rounded-xl flex items-center justify-center text-[#8A9A5B]">
                            <FileText size={24} />
                          </div>
                          <div className="max-w-[300px]">
                            <p className="text-xs font-black text-slate-700 truncate uppercase tracking-tight">{selectedFile.name}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={handleRemoveFile} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="p-8 bg-white border-t border-[#8A9A5B]/10">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="receivableForm"
                  disabled={isSubmitting}
                  className="flex-[2] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white bg-[#8A9A5B] hover:bg-[#697D58] shadow-xl shadow-[#8A9A5B]/20 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Salvar Recebimento
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
