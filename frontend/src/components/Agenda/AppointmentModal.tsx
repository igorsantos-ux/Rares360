import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Save,
  Loader2,
  User,
  Clock,
  Calendar,
  MapPin,
  Cpu,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  FileText,
  UserRoundPen
} from 'lucide-react';
import { appointmentsApi, coreApi, proceduresApi } from '../../services/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Controller } from 'react-hook-form';
import { PatientSheet } from '../Patients/PatientSheet';
import { Combobox } from '../ui/Combobox';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente é obrigatório'),
  professionalId: z.string().min(1, 'Profissional é obrigatório'),
  procedureId: z.string().nullable().optional(),
  roomId: z.string().nullable().optional(),
  equipmentId: z.string().nullable().optional(),
  startTime: z.string().min(1, 'Início é obrigatório'),
  endTime: z.string().min(1, 'Fim é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
  isOverbook: z.boolean(),
  isReturn: z.boolean(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date | null;
  appointment?: any;
}

const AppointmentModal = ({ isOpen, onClose, onSuccess, selectedDate, appointment }: Props) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPatientSheetOpen, setIsPatientSheetOpen] = useState(false);
  const [initialPatientName, setInitialPatientName] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset, control } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      status: 'AGUARDANDO',
      isOverbook: false,
      isReturn: false,
      startTime: '',
      endTime: '',
    }
  });

  const watchedProcedureId = watch('procedureId');
  const watchedStartTime = watch('startTime');
  const watchedProfessionalId = watch('professionalId');
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);

  // Buscar Pacientes, Profissionais, Salas e Equipamentos
  const { data: patients } = useQuery({ queryKey: ['patients-list'], queryFn: () => coreApi.getPatients().then(res => res.data.data || res.data) });
  const { data: resources } = useQuery({ queryKey: ['agenda-resources'], queryFn: () => appointmentsApi.getResources().then(res => res.data) });
  const {
    data: proceduresData,
    isLoading: isLoadingProcedures,
    isError: isProceduresError
  } = useQuery({
    queryKey: ['procedures-list-v2'],
    queryFn: () => proceduresApi.list({ limit: 1000 }).then(res => res.data)
  });

  const procedures = proceduresData?.items || [];

  // Validar Disponibilidade do Médico
  useEffect(() => {
    if (watchedProfessionalId && watchedStartTime && resources?.professionals) {
      const doctor = resources.professionals.find((d: any) => d.id === watchedProfessionalId);
      if (doctor && doctor.availability) {
        const date = new Date(watchedStartTime);
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayKey = dayNames[date.getDay()];
        const config = doctor.availability[dayKey];

        if (!config || !config.active) {
          setAvailabilityWarning(`⚠️ Atenção: O(A) Dr(a) não atende neste dia da semana.`);
        } else {
          const [startH, startM] = config.start.split(':').map(Number);
          const [endH, endM] = config.end.split(':').map(Number);
          const currentH = date.getHours();
          const currentM = date.getMinutes();

          const startTimeNum = startH * 60 + startM;
          const endTimeNum = endH * 60 + endM;
          const currentTimeNum = currentH * 60 + currentM;

          if (currentTimeNum < startTimeNum || currentTimeNum >= endTimeNum) {
            setAvailabilityWarning(`⚠️ Horário fora do expediente configurado (${config.start} às ${config.end}).`);
          } else {
            setAvailabilityWarning(null);
          }
        }
      } else {
        setAvailabilityWarning(null);
      }
    } else {
      setAvailabilityWarning(null);
    }
  }, [watchedProfessionalId, watchedStartTime, resources]);

  // Efeito para sugerir Sala/Equipamento p/ Botox e calcular fim
  useEffect(() => {
    if (watchedProcedureId && procedures.length > 0) {
      const proc = procedures.find((p: any) => p.id === watchedProcedureId);
      if (proc) {
        // Cálculo de Tempo
        if (watchedStartTime) {
          const start = new Date(watchedStartTime);
          const duration = proc.durationMinutes || 30;
          const end = new Date(start.getTime() + duration * 60000);

          // Ajuste de fuso horário para o input datetime-local que espera YYYY-MM-DDTHH:mm
          const tzOffset = end.getTimezoneOffset() * 60000;
          const localEnd = new Date(end.getTime() - tzOffset).toISOString().slice(0, 16);
          setValue('endTime', localEnd);
        }

        // Sugestão Botox (Regra de Negócio)
        if (proc.name.toLowerCase().includes('botox')) {
          const firstRoom = resources?.rooms?.[0];
          const firstEquip = resources?.equipments?.[0];
          if (firstRoom) setValue('roomId', firstRoom.id);
          if (firstEquip) setValue('equipmentId', firstEquip.id);
          toast('Procedimento de Botox: Sala e Equipamento sugeridos.', { icon: '💉', duration: 3000 });
        }
      }
    }
  }, [watchedProcedureId, watchedStartTime, procedures, resources, setValue]);

  // Carregar dados se for edição ou nova data
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        const fmtStart = new Date(appointment.startTime);
        const fmtEnd = new Date(appointment.endTime);
        const tzOffset = fmtStart.getTimezoneOffset() * 60000;

        reset({
          ...appointment,
          startTime: new Date(fmtStart.getTime() - tzOffset).toISOString().slice(0, 16),
          endTime: new Date(fmtEnd.getTime() - tzOffset).toISOString().slice(0, 16),
          procedureId: appointment.procedureId || null,
          roomId: appointment.roomId || null,
          equipmentId: appointment.equipmentId || null,
        });
      } else if (selectedDate) {
        const start = new Date(selectedDate);
        const end = new Date(start.getTime() + 30 * 60000);
        const tzOffset = start.getTimezoneOffset() * 60000;

        reset({
          startTime: new Date(start.getTime() - tzOffset).toISOString().slice(0, 16),
          endTime: new Date(end.getTime() - tzOffset).toISOString().slice(0, 16),
          status: 'AGUARDANDO',
          isOverbook: false,
          isReturn: false,
          procedureId: null,
          roomId: null,
          equipmentId: null,
        });
      }
    }
  }, [appointment, selectedDate, isOpen, reset]);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Sanitização de IDs opcionais e ajuste de timezone
      const payload = {
        ...data,
        startTime: data.startTime ? new Date(data.startTime).toISOString() : data.startTime,
        endTime: data.endTime ? new Date(data.endTime).toISOString() : data.endTime,
        procedureId: data.procedureId || null,
        roomId: data.roomId || null,
        equipmentId: data.equipmentId || null,
      };

      if (appointment?.id) {
        await appointmentsApi.updateAppointment(appointment.id, payload);
        toast.success('Agendamento atualizado!');
      } else {
        await appointmentsApi.createAppointment(payload);
        toast.success('Agendamento criado com sucesso!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Submission Error:', error);
      if (error.response?.status === 409) {
        toast.error(error.response.data.message || 'Conflito de recursos!');
      } else {
        const detail = error.response?.data?.details || '';
        toast.error(`Erro ao salvar agendamento: ${detail.substring(0, 50)}${detail.length > 50 ? '...' : ''}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const procedureOptions = [
    { value: 'null', label: 'Apenas consulta / Outro' },
    ...procedures.map((p: any) => ({
      value: p.id,
      label: p.name,
      rightLabel: `${p.category || 'Geral'} | ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.basePrice)}`
    }))
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 flex flex-col max-h-[90vh]"
            >
              {/* PatientSheet Integration for Quick Registration */}
              {isPatientSheetOpen && (
                <PatientSheet 
                  isOpen={isPatientSheetOpen}
                  onClose={() => setIsPatientSheetOpen(false)}
                  onSave={() => queryClient.invalidateQueries({ queryKey: ['patients-list'] })}
                  initialName={initialPatientName}
                />
              )}
              {/* Header */}
              <div className="bg-[#697D58] p-8 text-white relative">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                    <Calendar size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">{appointment ? 'Detalhes do Agendamento' : 'Novo Agendamento - Rares360'}</h3>
                    <p className="text-white/70 text-sm font-medium">Preencha os dados do paciente e aloque os recursos.</p>
                  </div>
                </div>
                <button onClick={onClose} className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Paciente e Profissional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup label="Paciente" icon={<User size={14} />} error={errors.patientId?.message}>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Controller
                            control={control}
                            name="patientId"
                            render={({ field }) => (
                              <Combobox
                                options={patients?.map((p: any) => ({ value: p.id, label: p.fullName })) || []}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Selecione o paciente"
                                searchPlaceholder="Digite o nome do paciente..."
                                emptyMessage="Nenhum resultado encontrado."
                                onEmptyAction={(searchTerm: string) => {
                                  setInitialPatientName(searchTerm);
                                  setIsPatientSheetOpen(true);
                                }}
                                emptyActionLabel="Inserir Novo"
                              />
                            )}
                          />
                        </div>
                        {watch('patientId') && (
                          <div className="flex gap-1">
                            <button 
                              type="button"
                              onClick={() => window.open(`/patients/${watch('patientId')}`, '_blank')}
                              title="Ver Prontuário"
                              className="p-3 bg-white border border-slate-200 rounded-xl text-[#8A9A5B] hover:bg-slate-50 transition-all"
                            >
                              <FileText size={18} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => { /* Edit Patient Logic */ }}
                              title="Editar Cadastro"
                              className="p-3 bg-white border border-slate-200 rounded-xl text-blue-500 hover:bg-slate-50 transition-all"
                            >
                              <UserRoundPen size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {watch('patientId') && patients && (
                        <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                          <Clock size={10} />
                          <span>Última Visita:</span>
                          <span className="text-slate-600">
                            {patients.find((p: any) => p.id === watch('patientId'))?.lastVisit 
                              ? new Date(patients.find((p: any) => p.id === watch('patientId'))?.lastVisit).toLocaleDateString('pt-BR') 
                              : 'Primeira vez'}
                          </span>
                        </div>
                      )}
                    </FormGroup>

                  <FormGroup label="Profissional" icon={<Stethoscope size={14} />} error={errors.professionalId?.message}>
                    <select {...register('professionalId')} className="form-input">
                      <option value="">Selecione o médico</option>
                      {resources?.professionals?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </FormGroup>
                </div>

                {/* Procedimento (Coração da automação) */}
                <FormGroup label="Procedimento" icon={<CheckCircle2 size={14} />}>
                  <Controller
                    control={control}
                    name="procedureId"
                    render={({ field }) => (
                      <Combobox
                        options={procedureOptions}
                        value={field.value || 'null'}
                        onValueChange={(val: string) => field.onChange(val === 'null' ? null : val)}
                        placeholder="Busque um procedimento..."
                        searchPlaceholder="Digite o nome do procedimento..."
                        emptyMessage="Nenhum procedimento encontrado."
                        isLoading={isLoadingProcedures}
                        disabled={isProceduresError}
                        className="bg-[#8A9A5B]/5 border-[#8A9A5B]/20"
                      />
                    )}
                  />
                </FormGroup>

                {/* Horários */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <FormGroup label="Início" icon={<Clock size={14} />} error={errors.startTime?.message}>
                    <input type="datetime-local" {...register('startTime')} className="form-input bg-white" />
                  </FormGroup>
                  <FormGroup label="Fim (Automático)" icon={<Clock size={14} />} error={errors.endTime?.message}>
                    <input type="datetime-local" {...register('endTime')} className="form-input bg-white" />
                  </FormGroup>

                  {availabilityWarning && (
                    <div className="col-span-2 flex items-center gap-3 bg-amber-50 text-amber-700 p-4 rounded-2xl border border-amber-200 animate-in fade-in zoom-in duration-300">
                      <AlertCircle size={20} className="shrink-0" />
                      <p className="text-xs font-black uppercase tracking-tight">{availabilityWarning}</p>
                    </div>
                  )}
                </div>

                {/* Recursos Físicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormGroup label="Sala (Opcional)" icon={<MapPin size={14} />}>
                    <select {...register('roomId')} className="form-input">
                      <option value="">Nenhuma sala</option>
                      {resources?.rooms?.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </FormGroup>
                  <FormGroup label="Equipamento (Opcional)" icon={<Cpu size={14} />}>
                    <select {...register('equipmentId')} className="form-input">
                      <option value="">Nenhum equipamento</option>
                      {resources?.equipments?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </FormGroup>
                </div>

                {/* Flags e Status */}
                <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" {...register('isOverbook')} className="w-5 h-5 rounded-lg border-slate-300 text-[#697D58] focus:ring-[#697D58]" />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-[#697D58] transition-colors">📦 Encaixe</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" {...register('isReturn')} className="w-5 h-5 rounded-lg border-slate-300 text-[#697D58] focus:ring-[#697D58]" />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-[#697D58] transition-colors">🔄 Retorno</span>
                  </label>

                  <div className="ml-auto min-w-[150px]">
                    <select {...register('status')} className="form-input py-2 text-xs uppercase bg-[#697D58]/10 border-none text-[#697D58]">
                      <option value="AGUARDANDO">Aguardando</option>
                      <option value="AGUARDANDO_PAGAMENTO">Aguardando pagamento</option>
                      <option value="ATENDIDO">Atendido</option>
                      <option value="CANCELADO_PROFISSIONAL">Cancelado pelo profissional</option>
                      <option value="CHAMANDO">Chamando</option>
                      <option value="DESMARCADO_PACIENTE">Desmarcado pelo paciente</option>
                      <option value="EM_ATENDIMENTO">Em atendimento</option>
                      <option value="CONFIRMADO">Marcado - confirmado</option>
                      <option value="NAO_CONFIRMADO">Marcado - não confirmado</option>
                      <option value="FALTA">Não compareceu</option>
                      <option value="REMARCADO">Remarcado</option>
                    </select>
                  </div>
                </div>

                {/* Notas */}
                <FormGroup label="Observações Internas (Opcional)">
                  <textarea {...register('notes')} rows={2} className="form-input resize-none" placeholder="Ex: Paciente com medo de agulha..." />
                </FormGroup>
              </form>

              {/* Footer */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors">
                  Descartar
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="flex-[2] bg-[#697D58] hover:bg-[#556B2F] text-white py-4 rounded-2xl font-black shadow-xl shadow-[#697D58]/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {appointment ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>
            </motion.div>
          </div>

          <style>{`
            .form-input {
                width: 100%;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 1rem;
                padding: 0.75rem 1rem;
                font-size: 0.875rem;
                font-weight: 600;
                color: #1e293b;
                transition: all 0.2s;
                outline: none;
            }
            .form-input:focus {
                border-color: #8A9A5B;
                box-shadow: 0 0 0 4px rgba(138, 154, 91, 0.1);
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #e2e8f0;
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #cbd5e1;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

const FormGroup = ({ label, icon, children, error }: any) => (
  <div className="space-y-1.5 flex-1 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
      {icon}
      {label}
    </label>
    {children}
    {error && (
      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 ml-1">
        <AlertCircle size={10} /> {error}
      </p>
    )}
  </div>
);

export default AppointmentModal;
