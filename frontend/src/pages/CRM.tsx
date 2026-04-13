import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../services/api';
import { 
    LayoutGrid, 
    List, 
    Phone, 
    CheckCircle2, 
    Search, 
    Filter,
    Loader2,
    TrendingUp,
    AlertCircle,
    MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanBoard } from '../components/CRM/KanbanBoard';

const CRMPage = () => {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks-crm'],
        queryFn: () => tasksApi.getCRM().then(res => res.data),
    });

    const { data: summary } = useQuery({
        queryKey: ['tasks-summary'],
        queryFn: () => tasksApi.getSummary().then(res => res.data),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) => tasksApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks-crm'] });
            queryClient.invalidateQueries({ queryKey: ['tasks-summary'] });
            toast.success('Status atualizado!');
        },
        onError: () => {
            toast.error('Erro ao atualizar status.');
        }
    });

    const filteredTasks = (tasks || []).filter((task: any) => {
        const searchLower = searchTerm.toLowerCase();
        const patientName = task.patient?.fullName || '';
        const taskTitle = task.title || '';
        
        return patientName.toLowerCase().includes(searchLower) ||
               taskTitle.toLowerCase().includes(searchLower);
    });

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={40} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando CRM...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">CRM Comercial</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de follow-ups e retenção de pacientes.</p>
                </div>
                
                <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                    <button 
                        onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            viewMode === 'kanban' ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <LayoutGrid size={14} />
                        Kanban
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            viewMode === 'list' ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <List size={14} />
                        Lista
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center text-[#8A9A5B] group-hover:scale-110 transition-transform">
                        <Phone size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendentes Agora</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">{summary?.patientsToContactToday || 0}</h5>
                        <p className="text-[10px] text-[#697D58] font-black uppercase tracking-tight">Para contato hoje</p>
                    </div>
                </div>

                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-[#DEB587]/10 rounded-2xl flex items-center justify-center text-[#DEB587] group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Oportunidades</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">{tasks?.length || 0}</h5>
                        <p className="text-[10px] text-[#DEB587] font-black uppercase tracking-tight">Em follow-up</p>
                    </div>
                </div>

                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversão</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">--%</h5>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tight">Taxa de retorno</p>
                    </div>
                </div>
            </div>

            {/* List Control */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar paciente ou tratamento..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                        <Filter size={16} />
                        Status: Todos
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'kanban' ? (
                    <motion.div
                        key="kanban"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <KanbanBoard 
                            tasks={filteredTasks} 
                            onTaskMove={(id, status) => updateStatusMutation.mutate({ id, status })}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Procedimento</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Limite</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTasks.map((task: any) => (
                                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#8A9A5B]/10 flex items-center justify-center text-[#8A9A5B]">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{task.patient?.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-medium text-slate-500">{task.title}</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-bold text-slate-600">
                                                    {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                    task.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                                                    task.status === 'TODO' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <button className="text-slate-400 hover:text-[#8A9A5B]">
                                                    <MessageSquare size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-3 p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                <AlertCircle size={18} className="text-[#DEB587]" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    O acompanhamento pós-procedimento é a chave para transformar um paciente ocasional em um cliente recorrente.
                    O CRM ajuda a automatizar o momento certo de falar com cada um.
                </p>
            </div>
        </div>
    );
};

const User = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
);

export default CRMPage;
