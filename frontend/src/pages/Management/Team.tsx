import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managementApi } from '../../services/api';
import {
    Users,
    UserPlus,
    Shield,
    MoreHorizontal,
    X,
    Building2,
    Lock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Simulação de componentes Shadcn (substitua pelos reais se disponíveis)
const Badge = ({ children, variant = 'default' }: any) => {
    const variants: any = {
        default: 'bg-slate-100 text-slate-700',
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        inactive: 'bg-rose-50 text-rose-600 border-rose-100',
        admin: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        owner: 'bg-amber-50 text-amber-600 border-amber-100'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${variants[variant]}`}>
            {children}
        </span>
    );
};

const TeamPage = () => {
    const queryClient = useQueryClient();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Matriz de módulos para permissões
    const modules = [
        { id: 'patients', label: 'Pacientes', icon: Users },
        { id: 'finance', label: 'Faturamento', icon: Building2 },
        { id: 'crm', label: 'CRM / Tarefas', icon: Users },
        { id: 'inventory', label: 'Estoque', icon: Lock },
        { id: 'management', label: 'Gestão de Equipe', icon: Shield, warning: 'Acesso Administrativo' }
    ];

    const { data: users } = useQuery({
        queryKey: ['management-users'],
        queryFn: async () => {
            const res = await managementApi.getUsers();
            return res.data;
        }
    });

    const createUserMutation = useMutation({
        mutationFn: (data: any) => managementApi.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['management-users'] });
            toast.success('Novo integrante convidado com sucesso!');
            setIsDrawerOpen(false);
        },
        onError: () => toast.error('Erro ao convidar integrante.')
    });

    const updateUserMutation = useMutation({
        mutationFn: (data: any) => managementApi.updateUser(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['management-users'] });
            toast.success('Permissões atualizadas!');
            setIsDrawerOpen(false);
        }
    });

    const handleSave = (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data: any = Object.fromEntries(formData);

        // Coleta permissões dos switches (simplificado para o exemplo)
        const permissions: any = {};
        modules.forEach(m => {
            const hasAccess = (e.target.elements as any)[`access-${m.id}`]?.checked;
            permissions[m.id] = hasAccess ? 'WRITE' : 'NONE';
        });

        data.permissions = permissions;

        if (selectedUser) {
            updateUserMutation.mutate({ ...selectedUser, ...data });
        } else {
            createUserMutation.mutate(data);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Equipe e Acessos</h1>
                    <p className="text-slate-500 font-medium">Gerencie sua equipe e defina o que cada um pode ver ou editar no Rares360.</p>
                </div>
                <button
                    onClick={() => { setSelectedUser(null); setIsDrawerOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] transition-all"
                >
                    <UserPlus size={18} />
                    Novo Integrante
                </button>
            </div>

            {/* Tabela de Usuários */}
            <div className="bg-white rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome / E-mail</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Perfil</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px) font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users?.map((user: any) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[#F5F5DC] rounded-full flex items-center justify-center font-black text-[#8A9A5B] shadow-sm">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-700">{user.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <Badge variant={user.role.toLowerCase()}>{user.role}</Badge>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <Badge variant={user.isActive ? 'active' : 'inactive'}>
                                        {user.isActive ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button
                                        onClick={() => { setSelectedUser(user); setIsDrawerOpen(true); }}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Drawer (Overlay simplificado) */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
                        <div className="p-10 space-y-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {selectedUser ? 'Editar Permissões' : 'Convidar para Clínica'}
                                    </h2>
                                    <p className="text-slate-500 text-sm">Configure o perfil e os níveis de acesso deste usuário.</p>
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-10">
                                {/* Dados Básicos */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Informações da Conta</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-700">Nome Completo</label>
                                            <input name="name" defaultValue={selectedUser?.name} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[#8A9A5B]/20 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-700">E-mail Corporativo</label>
                                            <input name="email" type="email" defaultValue={selectedUser?.email} disabled={!!selectedUser} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm disabled:opacity-50" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-700">Cargo / Perfil</label>
                                            <select name="role" defaultValue={selectedUser?.role || 'DOCTOR'} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none">
                                                <option value="DOCTOR">Médico (Doctor)</option>
                                                <option value="RECEPTIONIST">Recepção / Comercial</option>
                                                <option value="ADMIN">Administrador</option>
                                                <option value="OWNER">Dono (Owner)</option>
                                            </select>
                                        </div>
                                        {!selectedUser && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-700">Senha Provisória</label>
                                                <input name="password" type="text" placeholder="Ex: Rares@2026" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Matriz de Acessos */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Matriz de Permissões Granulares</h3>
                                    <div className="space-y-4">
                                        {modules.map(module => (
                                            <div key={module.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:border-[#8A9A5B]/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-[#8A9A5B]">
                                                        <module.icon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-700 text-sm">{module.label}</p>
                                                        {module.warning && <p className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><Shield size={10} /> {module.warning}</p>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            name={`access-${module.id}`}
                                                            defaultChecked={selectedUser?.permissions?.[module.id] !== 'NONE'}
                                                            className="w-5 h-5 accent-[#8A9A5B] cursor-pointer"
                                                        />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button type="submit" className="flex-1 py-4 bg-[#8A9A5B] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#8A9A5B]/20">
                                        {selectedUser ? 'Atualizar Acessos' : 'Convidar Equipe'}
                                    </button>
                                    <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPage;
