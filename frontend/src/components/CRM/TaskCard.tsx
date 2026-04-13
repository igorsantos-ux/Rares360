import React from 'react';
import {
  Clock,
  MessageSquare,
  MoreHorizontal,
  AlertCircle,
  User,
  ArrowRight
} from 'lucide-react';
import { format, formatDistanceToNow, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: any;
  onStatusChange: (status: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const procedures = (task.pendingProcedures as any[]) || [];

  // Calcular a última visita (maior transactionDate)
  const lastVisitDate = procedures.reduce((latest, proc) => {
    const procDate = new Date(proc.transactionDate);
    return procDate > latest ? procDate : latest;
  }, new Date(procedures[0]?.transactionDate || task.createdAt));

  // A data principal do card para fins de "Atrasado" global é a mais antiga
  const isOverdue = isBefore(new Date(task.dueDate), new Date()) && !isToday(new Date(task.dueDate));

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

    let procedureList = '';
    if (procedures.length > 0) {
      procedureList = procedures.map(p => p.name).join(' e ');
    } else {
      procedureList = task.title?.replace('Follow-up: ', '') || 'seu procedimento';
    }

    const message = encodeURIComponent(`Olá ${name}, tudo bem? Esperamos que esteja tendo um ótimo dia! Notamos que faz algum tempo desde a sua última visita para ${procedureList}. Gostaríamos de saber como você está e se deseja agendar um novo horário para mantermos seus resultados sempre impecáveis! ✨`);
    return `https://wa.me/55${phone}?text=${message}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
    >
      {/* Indicador de Prioridade */}
      <div className={`absolute top-0 right-0 w-1 h-full ${getPriorityColor(task.priority)} opacity-40`} />

      <div className="space-y-4">
        {/* Header do Card */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              {task.patient?.photoUrl ? (
                <img src={task.patient.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <User size={18} />
              )}
            </div>
            <div>
              <h4 className="font-black text-slate-700 text-sm leading-tight group-hover:text-[#8A9A5B] transition-colors">
                {task.patient?.fullName || 'Paciente não identificado'}
              </h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {task.patient?.phone || 'Sem telefone'}
              </p>
            </div>
          </div>
          <button className="text-slate-300 hover:text-slate-600 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Lista de Procedimentos (Badges) */}
        <div className="flex flex-wrap gap-2">
          {procedures.length > 0 ? (
            procedures.map((proc, idx) => {
              const procDate = new Date(proc.dueDate);
              const procOverdue = isBefore(procDate, new Date()) && !isToday(procDate);
              return (
                <div key={idx} className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 border ${procOverdue
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : 'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                  {proc.name}
                  <span className="opacity-60 font-medium">
                    ({formatDistanceToNow(procDate, { addSuffix: true, locale: ptBR })})
                  </span>
                </div>
              );
            })
          ) : (
            <div className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500 text-[9px] font-bold border border-slate-100">
              {task.title?.replace('Follow-up: ', '')}
            </div>
          )}
        </div>

        {/* Rodapé do Card */}
        <div className="pt-2 border-t border-slate-50 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Última visita: {format(lastVisitDate, 'dd/MM/yyyy')}</span>
            </div>
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
              {isOverdue ? <AlertCircle size={12} /> : null}
              {isToday(new Date(task.dueDate)) ? 'Hoje' : formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: ptBR })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                {task.assignedTo?.substring(0, 2).toUpperCase() || <User size={10} />}
              </div>
            </div>
            {isOverdue && (
              <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter animate-pulse">
                Atrasado
              </span>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          <a
            href={generateWhatsAppLink()}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all transform active:scale-95"
          >
            <MessageSquare size={14} />
            WhatsApp
          </a>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 hover:bg-[#8A9A5B] hover:text-white transition-all cursor-pointer">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
