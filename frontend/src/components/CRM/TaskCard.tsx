import React from 'react';
import {
  useNavigate
} from 'react-router-dom';
import {
  Clock,
  MoreHorizontal,
  AlertCircle,
  User,
  ExternalLink,
  ChevronDown,
  Edit2,
  CheckCircle2,
  XCircle,
  Phone
} from 'lucide-react';
import { format, formatDistanceToNow, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskCardProps {
  task: any;
  onStatusChange: (status: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = React.useState(false);
  // Filtrar apenas se tivermos procedimentos reais (não apenas o fallback do backend se ele existir)
  const rawProcedures = (task.pendingProcedures as any[]) || [];

  const procedures = rawProcedures
    .filter(p => p.transactionDate && p.transactionDate !== task.createdAt) // Tentar filtrar o fallback do backend se possível
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 1);

  // Se não houver procedimentos reais, tentamos usar o primeiro disponível mesmo assim, mas marcamos como fallback
  const displayProcedure = procedures.length > 0 ? procedures[0] : (rawProcedures[0] || null);
  const isFallbackDate = !procedures.length && displayProcedure;

  // Calcular a última visita (Apenas se houver um procedimento real)
  const lastVisitDate = procedures.length > 0 ? new Date(procedures[0].transactionDate) : null;

  // Vencimento da tarefa (O que define o Kanban)
  const taskDueDate = new Date(task.dueDate);
  const now = new Date();

  const isActuallyOverdue = isBefore(taskDueDate, now) && !isToday(taskDueDate) && (!lastVisitDate || isBefore(lastVisitDate, taskDueDate));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-rose-500';
      case 'MEDIUM': return 'bg-amber-500';
      case 'LOW': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const generateWhatsAppLink = () => {
    const patient = task.patient || {};
    const phone = patient.phone?.replace(/\D/g, '') || '';
    const name = patient.fullName?.split(' ')[0] || 'Paciente';

    let procedureList = displayProcedure?.name || task.title?.replace('Follow-up: ', '').replace('Oportunidade: ', '') || 'seu procedimento';
    const message = encodeURIComponent(`Olá ${name}, tudo bem? Esperamos que esteja tendo um ótimo dia! Notamos que faz algum tempo desde a sua última visita para ${procedureList}. Gostaríamos de saber como você está e se deseja agendar um novo horário para mantermos seus resultados sempre impecáveis! ✨`);
    return `https://wa.me/55${phone}?text=${message}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[2.5rem] border ${isExpanded ? 'border-[#8A9A5B]/30 shadow-xl shadow-[#8A9A5B]/5' : 'border-slate-100 shadow-sm'} transition-all group relative overflow-hidden`}
    >
      {/* Indicador de Prioridade */}
      <div className={`absolute top-0 right-0 w-1.5 h-full ${getPriorityColor(task.priority)} opacity-40`} />

      <div className="p-5 space-y-4">
        {/* Header do Card */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
              {task.patient?.photoUrl ? (
                <img src={task.patient.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/patients/${task.patientId}`);
                }}
                className="group/name cursor-pointer flex items-center gap-1.5 transition-all w-fit"
              >
                <h4 className="font-black text-slate-700 text-[14px] leading-tight group-hover/name:text-[#8A9A5B] transition-all">
                  {task.patient?.fullName || 'Paciente não identificado'}
                </h4>
                <ExternalLink size={12} className="text-[#8A9A5B] opacity-0 group-hover/name:opacity-100 transition-all transform -translate-y-0.5" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Phone size={10} className="text-slate-300" />
                {task.patient?.phone || 'Sem telefone'}
              </p>
            </div>
          </div>
          <button className="text-slate-200 hover:text-slate-400 transition-colors p-1">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Procedimento Principal (Badge única) */}
        <div className="flex flex-wrap gap-2">
          {displayProcedure ? (
            <div className="px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border bg-slate-50 text-slate-600 border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
              {displayProcedure.name}
              {!isFallbackDate && (
                <span className="opacity-50 font-bold lowercase">
                  ({formatDistanceToNow(new Date(displayProcedure.transactionDate), { addSuffix: true, locale: ptBR })})
                </span>
              )}
            </div>
          ) : (
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
              {task.title?.replace('Follow-up: ', '').replace('Oportunidade: ', '')}
            </div>
          )}
        </div>

        {/* Rodapé do Card */}
        <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
              <Clock size={12} className="text-slate-300" />
              <span>
                {lastVisitDate
                  ? `Última visita: ${format(lastVisitDate, 'dd/MM/yyyy')}`
                  : 'Sem registro de visita'}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter ${isActuallyOverdue ? 'text-rose-500' : 'text-[#8A9A5B]'}`}>
              {isActuallyOverdue ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
              {isActuallyOverdue
                ? (isToday(taskDueDate) ? 'Vence Hoje' : `Vence ${formatDistanceToNow(taskDueDate, { addSuffix: true, locale: ptBR })}`)
                : 'Aguardando Próximo Ciclo'
              }
            </div>
          </div>

          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${isExpanded ? 'bg-[#8A9A5B] text-white border-[#8A9A5B] shadow-lg shadow-[#8A9A5B]/20' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
          >
            <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Área Expandida (Drawer) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-slate-100 overflow-hidden"
          >
            {/* 1. Container Principal (Otimizado para Kanban estreito) */}
            <div className="w-full bg-[#FAFBFC] p-5 flex flex-col gap-5 rounded-b-[2.5rem]">

              {/* 2. Bloco de Observações (Ocupa largura total) */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  Observações:
                </p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed italic px-1">
                  {task.notes || "Nenhuma observação interna registrada."}
                </p>
              </div>

              {/* 3. Bloco de Ações (Grid 2 colunas estável) */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <a
                  href={generateWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-2 py-3 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all transform active:scale-95 shadow-sm"
                >
                  <Phone size={14} />
                  WhatsApp
                </a>

                <button className="flex items-center justify-center gap-2 px-2 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-[#8A9A5B] hover:text-[#8A9A5B] transition-all transform active:scale-95 shadow-sm group">
                  <Edit2 size={14} className="opacity-40 group-hover:opacity-100" />
                  Editar
                </button>

                <button className="flex items-center justify-center gap-2 px-2 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all transform active:scale-95 shadow-sm group">
                  <CheckCircle2 size={14} className="opacity-40 group-hover:opacity-100" />
                  Confirmar
                </button>

                <button className="flex items-center justify-center gap-2 px-2 py-3 bg-white text-rose-500 border border-slate-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all transform active:scale-95 shadow-sm group">
                  <XCircle size={14} className="opacity-40 group-hover:opacity-100" />
                  Cancelar
                </button>
              </div>

              {/* 4. Rodapé Interno (Link e Info) */}
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100/50">
                <button
                  onClick={() => navigate(`/patients/${task.patientId}`)}
                  className="flex items-center justify-center gap-2 py-3 w-full text-[9px] font-black text-[#8A9A5B] uppercase tracking-widest bg-white border border-[#8A9A5B]/20 rounded-xl hover:bg-[#8A9A5B] hover:text-white transition-all group shadow-sm"
                >
                  Acessar Prontuário Completo
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                <div className="flex items-center justify-center gap-2 text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                  <Clock size={10} />
                  Criado há {formatDistanceToNow(new Date(task.createdAt), { locale: ptBR })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
