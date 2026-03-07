import React, { useState, useEffect } from 'react';
import {
    Building2,
    Users,
    Plus,
    Settings,
    LogOut,
    Search,
    LayoutDashboard
} from 'lucide-react';
import { saasApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SaaSManagement = () => {
    const { logout, user } = useAuth();
    const [clinics, setClinics] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'clinics' | 'users'>('clinics');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form States
    const [newClinic, setNewClinic] = useState({ name: '', cnpj: '', address: '' });
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'CLINIC_ADMIN', clinicId: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [clinicsRes, usersRes] = await Promise.all([
                saasApi.getClinics(),
                saasApi.getUsers()
            ]);
            setClinics(clinicsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Failed to fetch SaaS data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClinic = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saasApi.createClinic(newClinic);
            setIsModalOpen(false);
            setNewClinic({ name: '', cnpj: '', address: '' });
            fetchData();
        } catch (error) {
            alert('Erro ao criar clínica');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saasApi.createUser(newUser);
            setIsModalOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'CLINIC_ADMIN', clinicId: '' });
            fetchData();
        } catch (error) {
            alert('Erro ao criar usuário');
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0C11] text-white p-6 md:p-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-8 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                        Painel Global Admin
                    </h1>
                    <p className="text-slate-500 font-medium">Bem-vindo, {user?.name}. Gerencie todas as instâncias do Heath Finance.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={logout}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-bold text-red-400"
                    >
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar (Inner) */}
                <div className="lg:col-span-1 space-y-4">
                    <button
                        onClick={() => setActiveTab('clinics')}
                        className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 ${activeTab === 'clinics' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
                    >
                        <Building2 size={24} />
                        <span className="font-black border-l border-white/10 pl-4 uppercase tracking-widest text-xs">Clínicas</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 ${activeTab === 'users' ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}
                    >
                        <Users size={24} />
                        <span className="font-black border-l border-white/10 pl-4 uppercase tracking-widest text-xs">Usuários</span>
                    </button>

                    {/* Stats Card */}
                    <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutDashboard size={80} />
                        </div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Total Ativo</p>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black">{activeTab === 'clinics' ? clinics.length : users.length}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder={`Buscar ${activeTab === 'clinics' ? 'clínica' : 'usuário'}...`}
                                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 text-sm font-medium"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                        >
                            <Plus size={20} /> Novo {activeTab === 'clinics' ? 'Clínica' : 'Usuário'}
                        </button>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                        {isLoading ? (
                            <div className="p-20 flex justify-center">
                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Nome</th>
                                        <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">{activeTab === 'clinics' ? 'CNPJ' : 'E-mail'}</th>
                                        <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">{activeTab === 'clinics' ? 'Status' : 'Role'}</th>
                                        <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {(activeTab === 'clinics' ? clinics : users).map((item) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                            >
                                                <td className="p-6">
                                                    <div className="font-bold flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${activeTab === 'clinics' ? (item.isActive ? 'bg-emerald-400' : 'bg-red-400') : 'bg-blue-400'}`}></div>
                                                        {item.name}
                                                    </div>
                                                    {activeTab === 'users' && <span className="text-[10px] text-slate-500 block mt-1">{item.clinic?.name || 'Acesso Global'}</span>}
                                                </td>
                                                <td className="p-6 text-slate-400 font-medium text-sm">
                                                    {activeTab === 'clinics' ? item.cnpj || 'Não info' : item.email}
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight uppercase ${activeTab === 'clinics' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                        {activeTab === 'clinics' ? (item.isActive ? 'Ativo' : 'Inativo') : item.role}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                                                        <Settings size={18} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#161B22] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-3xl"
                        >
                            <h2 className="text-2xl font-black mb-6">Novo {activeTab === 'clinics' ? 'Clínica' : 'Usuário'}</h2>

                            {activeTab === 'clinics' ? (
                                <form onSubmit={handleCreateClinic} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-4">Nome da Clínica</label>
                                        <input
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                            value={newClinic.name}
                                            onChange={e => setNewClinic({ ...newClinic, name: e.target.value })}
                                            placeholder="Nome fantasia"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-4">CNPJ</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                                value={newClinic.cnpj}
                                                onChange={e => setNewClinic({ ...newClinic, cnpj: e.target.value })}
                                                placeholder="00.000.000/0001-00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-4">Endereço</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                                value={newClinic.address}
                                                onChange={e => setNewClinic({ ...newClinic, address: e.target.value })}
                                                placeholder="Cidade - UF"
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-blue-600 rounded-2xl font-black mt-6 shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        CRIAR CLÍNICA
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-4">Nome Completo</label>
                                        <input
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                            value={newUser.name}
                                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-4">E-mail</label>
                                            <input
                                                required
                                                type="email"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                                value={newUser.email}
                                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-4">Senha Inicial</label>
                                            <input
                                                required
                                                type="password"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                                value={newUser.password}
                                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-4">Vincular Clínica</label>
                                        <select
                                            className="w-full bg-[#161B22] border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none"
                                            value={newUser.clinicId}
                                            onChange={e => setNewUser({ ...newUser, clinicId: e.target.value })}
                                        >
                                            <option value="">Acesso Global (Sem Clínica)</option>
                                            {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-teal-600 rounded-2xl font-black mt-6 shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        CRIAR USUÁRIO
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SaaSManagement;
