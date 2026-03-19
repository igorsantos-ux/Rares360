import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../services/api';
import { 
    CheckSquare, 
    Clock, 
    Phone, 
    CheckCircle2, 
    Search, 
    Filter,
    Loader2,
    Calendar,
    MessageSquare,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TarefasPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks-daily'],
        queryFn: () => tasksApi.getDaily().then(res => res.data),
    });

    const { data: summary } = useQuery({
        queryKey: ['tasks-summary'],
        queryFn: () => tasksApi.getSummary().then(res => res.data),
    });

    const completeMutation = useMutation({
        mutationFn: (id: string) => tasksApi.complete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks-daily'] });
            queryClient.invalidateQueries({ queryKey: ['tasks-summary'] });
            toast.success('Tarefa concluída!');
        }
    });

    const filteredTasks = (tasks || []).filter((task: any) => 
        task.patient?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={40} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando agenda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Agenda de Tarefas</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de contatos, follow-ups e produtividade diária.</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center text-[#8A9A5B] group-hover:scale-110 transition-transform">
                        <Phone size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contatos hoje</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">{summary?.patientsToContactToday || 0}</h5>
                        <p className="text-[10px] text-[#697D58] font-black uppercase tracking-tight">Pacientes pendentes</p>
                    </div>
                </div>

                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-[#DEB587]/10 rounded-2xl flex items-center justify-center text-[#DEB587] group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Dia</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">
                            {(tasks || []).length > 0 ? 'Em andamento' : 'Finalizado'}
                        </h5>
                        <p className="text-[10px] text-[#DEB587] font-black uppercase tracking-tight">Fluxo de atendimento</p>
                    </div>
                </div>

                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Qualidade</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">100%</h5>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tight">Taxa de follow-up</p>
                    </div>
                </div>
            </div>

            {/* List Control */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por paciente ou título..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                            <Filter size={16} />
                            Filtros
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 flex flex-col items-center justify-center gap-4"
                            >
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                                    <CheckSquare size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-700">Tudo em dia!</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest text-center max-w-xs">
                                    Você não tem tarefas pendentes para hoje.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredTasks.map((task: any) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white p-6 rounded-3xl border border-[#8A9A5B]/10 hover:border-[#8A9A5B]/30 hover:shadow-lg hover:shadow-[#8A9A5B]/5 transition-all group"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center text-[#697D58] shrink-0">
                                                    <Calendar size={24} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-slate-700 text-base leading-tight">
                                                            {task.title}
                                                        </h4>
                                                        <span className="px-2 py-0.5 bg-[#DEB587]/10 text-[#DEB587] text-[9px] font-black rounded-lg uppercase tracking-wider">
                                                            Follow-up
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5">
                                                            <Phone size={12} className="text-[#8A9A5B]" />
                                                            {task.patient?.phone || 'Sem telefone'}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock size={12} />
                                                            Hoje
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <a 
                                                    href={`https://wa.me/55${task.patient?.phone?.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 text-emerald-600 rounded-2xl font-bold text-xs hover:bg-emerald-50 transition-all shadow-sm"
                                                >
                                                    <MessageSquare size={16} />
                                                    WhatsApp
                                                </a>
                                                <button 
                                                    onClick={() => completeMutation.mutate(task.id)}
                                                    className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-xs shadow-lg shadow-[#8A9A5B]/10 hover:bg-[#697D58] transition-all"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    Marcar como Contatado
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Info */}
                <div className="p-8 bg-slate-50/30 border-t border-[#8A9A5B]/5 flex items-center gap-3">
                    <AlertCircle size={16} className="text-[#DEB587]" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        DICA: O contato humanizado no pós-procedimento aumenta a taxa de fidelização em até 40%.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TarefasPage;
