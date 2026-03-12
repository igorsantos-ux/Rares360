import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
    X, 
    Save, 
    Loader2, 
    User, 
    Phone, 
    MapPin, 
    HeartPulse, 
    Stethoscope, 
    Camera,
    Trash2,
    Briefcase,
    Calendar,
    CreditCard
} from 'lucide-react';
import { coreApi } from '../../services/api';
import { AnimatePresence, motion } from 'framer-motion';

const patientSchema = z.object({
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  socialName: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  color: z.string().optional(),
  maritalStatus: z.string().optional(),
  profession: z.string().optional(),
  education: z.string().optional(),
  religion: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  origin: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  disability: z.string().optional(),
  allergies: z.string().optional(),
  smoker: z.boolean().default(false),
  priority: z.string().optional(),
  insurance: z.string().optional(),
  insurancePlan: z.string().optional(),
  photoUrl: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  patient?: any; // Para modo edição
}

export function PatientSheet({ isOpen, onClose, onSave, patient }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pessoais' | 'contato' | 'clinico'>('pessoais');
  const [photoPreview, setPhotoPreview] = useState<string | null>(patient?.photoUrl || null);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? {
        ...patient,
        birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : '',
        weight: patient.weight?.toString() || '',
        height: patient.height?.toString() || '',
    } : {
      fullName: '',
      smoker: false,
      gender: '',
      maritalStatus: '',
      origin: '',
      priority: 'Normal'
    }
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);
      if (patient?.id) {
        await coreApi.updatePatient(patient.id, data);
      } else {
        await coreApi.createPatient(data);
      }
      onSave();
      onClose();
      reset();
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Mock de upload por enquanto, convertendo para Base64 para preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setPhotoPreview(base64String);
            setValue('photoUrl', base64String);
        };
        reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'pessoais', label: 'Dados Pessoais', icon: <User size={16} /> },
    { id: 'contato', label: 'Contato & Endereço', icon: <Phone size={16} /> },
    { id: 'clinico', label: 'Dados Clínicos', icon: <HeartPulse size={16} /> },
  ];

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
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">{patient ? 'Editar Paciente' : 'Novo Paciente'}</h2>
                  <p className="text-white/80 text-xs font-medium">Prontuário completo do cliente</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Photo & Navigation */}
            <div className="px-6 pt-8 pb-4 flex flex-col items-center gap-6">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-[#8A9A5B]/20 overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-slate-300" />
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#8A9A5B] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                        <Camera size={16} />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl w-full">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white text-[#697D58] shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
              <form id="patientForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {activeTab === 'pessoais' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider flex items-center gap-2">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('fullName')}
                                placeholder="Nome completo do paciente"
                                className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#8A9A5B]/50 focus:border-[#8A9A5B] transition-all"
                            />
                            {errors.fullName && <span className="text-red-500 text-xs font-bold">{errors.fullName.message}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Nome Social</label>
                                <input {...register('socialName')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">CPF</label>
                                <input {...register('cpf')} placeholder="000.000.000-00" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">RG</label>
                                <input {...register('rg')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Nascimento</label>
                                <input type="date" {...register('birthDate')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Gênero</label>
                                <select {...register('gender')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all">
                                    <option value="">Selecione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Estado Civil</label>
                                <select {...register('maritalStatus')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all">
                                    <option value="">Selecione</option>
                                    <option value="Solteiro">Solteiro</option>
                                    <option value="Casado">Casado</option>
                                    <option value="Divorciado">Divorciado</option>
                                    <option value="Viúvo">Viúvo</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Religião</label>
                                <input {...register('religion')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Profissão</label>
                                <input {...register('profession')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Escolaridade</label>
                                <input {...register('education')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'contato' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Telefone / WhatsApp</label>
                                <input {...register('phone')} placeholder="(00) 00000-0000" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">E-mail</label>
                                <input {...register('email')} placeholder="email@exemplo.com" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                                {errors.email && <span className="text-red-500 text-[10px] font-bold">{errors.email.message}</span>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider flex items-center gap-2">
                                <MapPin size={14} /> Endereço Completo
                            </label>
                            <input {...register('address')} placeholder="Rua, Número, Bairro, Cidade - UF" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Origem / Indicação</label>
                            <select {...register('origin')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all">
                                <option value="">Selecione</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Google">Google</option>
                                <option value="Indicação">Indicação de Amigo</option>
                                <option value="Passagem">Passagem/Fachada</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'clinico' && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Peso (kg)</label>
                                <input type="number" step="0.1" {...register('weight')} placeholder="0.0" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Altura (m)</label>
                                <input type="number" step="0.01" {...register('height')} placeholder="0.00" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="bg-[#8A9A5B]/5 p-4 rounded-xl border border-[#8A9A5B]/10 flex items-center justify-between">
                                <span className="text-xs font-black text-[#697D58] uppercase">É Fumante?</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" {...register('smoker')} />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8A9A5B]"></div>
                                </label>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Prioridade</label>
                                <select {...register('priority')} className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all">
                                    <option value="Normal">Normal</option>
                                    <option value="Preferencial CIT">Preferencial (CIT)</option>
                                    <option value="VIP">💎 VIP</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Alergias / Restrições</label>
                            <textarea {...register('allergies')} rows={2} placeholder="Descreva possíveis alergias..." className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all resize-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider flex items-center gap-2"><CreditCard size={14} /> Convênio</label>
                                <input {...register('insurance')} placeholder="Ex: Unimed, Bradesco" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Plano</label>
                                <input {...register('insurancePlan')} placeholder="Ex: Top Nacional" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#697D58] uppercase tracking-wider">Deficiência / PCD</label>
                            <input {...register('disability')} placeholder="Nenhuma" className="w-full bg-white border border-[#8A9A5B]/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all" />
                        </div>
                    </motion.div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#8A9A5B]/10 bg-white">
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="patientForm"
                  disabled={isSubmitting}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#8A9A5B] hover:bg-[#697D58] shadow-lg shadow-[#8A9A5B]/30 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {patient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
