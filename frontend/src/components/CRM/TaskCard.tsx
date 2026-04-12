import React from 'react';
import { 
    Clock, 
    MessageSquare, 
    MoreHorizontal,
    TrendingUp,
    AlertCircle,
    User,
    ArrowRight
} from 'lucide-react';
import { formatDistanceToNow, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface TaskCardProps {
    task: any;
    onStatusChange: (status: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => {
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
    const phone = task.patient?.phone?.replace(/\D/g, '');
    const name = task.patient?.fullName?.split(' ')[0];
    const message = encodeURIComponent(`Olá ${name}, tudo bem? Esperamos que esteja tendo um ótimo dia! Notamos que faz algum tempo desde o seu último procedimento conosco. Gostaríamos de saber como você está e se deseja agendar um novo horário para mantermos seus resultados sempre impecáveis! ✨`);
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
              <h4 className="font-black text-slate-700 text-sm leading-tight group-hover:text-[#8A9A5B] transition-colors">{task.patient?.fullName}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                {task.title.replace('Follow-up: ', '')}
              </p>
            </div>
          </div>
          <button className="text-slate-300 hover:text-slate-600 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Data / Prazo */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
          }`}>
            {isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
            {isToday(new Date(task.dueDate)) ? 'Hoje' : formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: ptBR })}
          </div>
          
          {isOverdue && (
              <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter animate-pulse">
                  Atrasado
              </span>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="pt-2 flex items-center gap-2">
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
