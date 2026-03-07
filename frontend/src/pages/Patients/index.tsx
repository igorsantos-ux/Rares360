import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '../../services/api';
import {
    Users,
    Search,
    UserPlus,
    MoreHorizontal,
    Filter,
    Calendar,
    Phone,
    Mail,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

const PatientsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: patients, isLoading } = useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const response = await coreApi.getPatients();
            return response.data;
        }
    });

    // Mock para visualização se não houver dados
    const displayPatients = patients?.length > 0 ? patients : [
        { id: '1', name: 'Ana Oliveira', email: 'ana@email.com', phone: '(11) 98888-7777', lastVisit: '2026-03-01', status: 'Ativo' },
        { id: '2', name: 'Bruno Santos', email: 'bruno@email.com', phone: '(11) 97777-6666', lastVisit: '2026-02-15', status: 'Ativo' },
        { id: '3', name: 'Carla Souza', email: 'carla@email.com', phone: '(11) 96666-5555', lastVisit: '2026-03-05', status: 'Inativo' },
    ].filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) return <div className="p-10 text-[#697D58] font-bold">Carregando pacientes...</div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Pacientes</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão completa da base de clientes da clínica.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <UserPlus size={20} />
                        Novo Paciente
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total de Pacientes"
                    value={displayPatients.length + 120}
                    icon={<Users size={20} />}
                    trend="+12 este mês"
                />
                <StatCard
                    title="Atendimentos Hoje"
                    value="14"
                    icon={<Calendar size={20} />}
                    trend="85% preenchido"
                />
                <StatCard
                    title="Taxa de Retorno"
                    value="78%"
                    icon={<TrendingUp size={20} />}
                    trend="Excelente"
                />
            </div>

            {/* List Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF ou e-mail..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                        <Filter size={16} />
                        Filtros Avançados
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Visita</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8A9A5B]/5">
                            {displayPatients.map((patient: any) => (
                                <tr key={patient.id} className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#DEB587]/20 text-[#697D58] rounded-full flex items-center justify-center font-black text-xs">
                                                {patient.name.split(' ').map((n: string) => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-700 text-sm">{patient.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">ID: #{patient.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Phone size={12} />
                                                <span className="text-xs font-medium">{patient.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Mail size={12} />
                                                <span className="text-xs font-medium">{patient.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                                            <Calendar size={14} className="text-[#8A9A5B]" />
                                            {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${patient.status === 'Ativo'
                                            ? 'bg-[#8A9A5B]/10 text-[#697D58]'
                                            : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-[#8A9A5B]">
                                                <MoreHorizontal size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-[#8A9A5B] rounded-lg transition-all text-slate-400 hover:text-white">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-slate-50/30 flex items-center justify-between border-t border-[#8A9A5B]/5">
                    <p className="text-xs font-bold text-slate-400">Mostrando {displayPatients.length} de {displayPatients.length + 120} pacientes</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-[#8A9A5B]/10 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed">Anterior</button>
                        <button className="px-4 py-2 bg-white border border-[#8A9A5B]/10 rounded-xl text-xs font-bold text-[#697D58] hover:bg-[#8A9A5B]/5 transition-all">Próximo</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, trend }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-[#8A9A5B]/10 shadow-sm flex items-center gap-5">
        <div className="w-12 h-12 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center text-[#8A9A5B]">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h5 className="text-2xl font-black text-[#1A202C]">{value}</h5>
            <p className="text-[10px] text-[#697D58] font-black">{trend}</p>
        </div>
    </div>
);

export default PatientsPage;
