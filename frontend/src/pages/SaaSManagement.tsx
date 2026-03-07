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
import { FileDown, CreditCard, Edit3, Check, X as XIcon } from 'lucide-react';

const SaaSManagement = () => {
    const { logout, user } = useAuth();
    const [clinics, setClinics] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [billingData, setBillingData] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'clinics' | 'users' | 'billing'>('clinics');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState<string>('');

    // Form States
    const [newClinic, setNewClinic] = useState({ name: '', cnpj: '', address: '' });
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'CLINIC_ADMIN', clinicId: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [clinicsRes, usersRes, billingRes] = await Promise.all([
                saasApi.getClinics(),
                saasApi.getUsers(),
                saasApi.getBilling()
            ]);
            setClinics(clinicsRes.data);
            setUsers(usersRes.data);
            setBillingData(billingRes.data);
        } catch (error) {
            console.error('Failed to fetch SaaS data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePrice = async (clinicId: string) => {
        try {
            await saasApi.updateClinic(clinicId, { pricePerUser: parseFloat(tempPrice) });
            setEditingPrice(null);
            fetchData();
        } catch (error) {
            alert('Erro ao atualizar preço');
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
        <div className="min-h-screen bg-[#F0EAD6] text-[#1A202C] p-6 md:p-10 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-8 border-b border-[#8A9A5B]/10">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#697D58]">
                        Painel <span className="text-[#8A9A5B]">Global Admin</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Bem-vindo, {user?.name}. Gerencie todas as instâncias do Heath Finance.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={logout}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-6 bg-white border border-[#DEB587]/30 rounded-2xl hover:bg-[#DEB587]/5 transition-all font-bold text-[#697D58] shadow-sm"
                    >
                        <LogOut size={18} className="text-[#DEB587]" /> Sair
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar (Inner) */}
                <div className="lg:col-span-1 space-y-4">
                    <button
                        onClick={() => setActiveTab('clinics')}
                        className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 border ${activeTab === 'clinics' ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20 border-transparent' : 'bg-white/50 text-[#697D58] border-[#8A9A5B]/10 hover:bg-white'}`}
                    >
                        <Building2 size={24} />
                        <span className="font-black border-l border-current/10 pl-4 uppercase tracking-widest text-xs">Clínicas</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 border ${activeTab === 'users' ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20 border-transparent' : 'bg-white/50 text-[#697D58] border-[#8A9A5B]/10 hover:bg-white'}`}
                    >
                        <Users size={24} />
                        <span className="font-black border-l border-current/10 pl-4 uppercase tracking-widest text-xs">Usuários</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 border ${activeTab === 'billing' ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20 border-transparent' : 'bg-white/50 text-[#697D58] border-[#8A9A5B]/10 hover:bg-white'}`}
                    >
                        <CreditCard size={24} />
                        <span className="font-black border-l border-current/10 pl-4 uppercase tracking-widest text-xs">Faturamento</span>
                    </button>

                    {/* Stats Card */}
                    <div className="p-8 rounded-[2.5rem] bg-[#697D58] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutDashboard size={80} />
                        </div>
                        <p className="text-[#F0EAD6]/60 text-xs font-black uppercase tracking-[0.2em] mb-4">Total Ativo</p>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black">
                                {activeTab === 'clinics' ? clinics.length : activeTab === 'users' ? users.length : billingData.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={`Buscar ${activeTab === 'clinics' ? 'clínica' : activeTab === 'users' ? 'usuário' : 'fatura'}...`}
                                className="bg-white border border-[#8A9A5B]/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 w-64 text-sm font-medium shadow-sm transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#8A9A5B] hover:scale-[1.02] active:scale-95 text-white p-4 rounded-2xl shadow-xl shadow-[#8A9A5B]/20 transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                        >
                            <Plus size={20} /> Novo {activeTab === 'clinics' ? 'Clínica' : 'Usuário'}
                        </button>
                    </div>

                    <div className="bg-white/70 border border-[#8A9A5B]/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-xl">
                        {isLoading ? (
                            <div className="p-20 flex justify-center">
                                <div className="w-12 h-12 border-4 border-[#8A9A5B]/20 border-t-[#8A9A5B] rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#8A9A5B]/10 bg-[#8A9A5B]/5">
                                        <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">Nome</th>
                                        <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">
                                            {activeTab === 'clinics' ? 'CNPJ' : activeTab === 'users' ? 'E-mail' : 'Usuários Reg.'}
                                        </th>
                                        <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">
                                            {activeTab === 'clinics' ? 'Status' : activeTab === 'users' ? 'Role' : 'Vl. por Usuário'}
                                        </th>
                                        <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">
                                            {activeTab === 'billing' ? 'Total Fatura' : 'Ações'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {(activeTab === 'clinics' ? clinics : activeTab === 'users' ? users : billingData).map((item) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="border-b border-[#8A9A5B]/5 hover:bg-white transition-colors group"
                                            >
                                                <td className="p-6">
                                                    <div className="font-extrabold flex items-center gap-3 text-[#1A202C]">
                                                        <div className={`w-2 h-2 rounded-full ${activeTab === 'clinics' ? (item.isActive ? 'bg-[#8A9A5B]' : 'bg-[#DEB587]') : activeTab === 'users' ? 'bg-[#697D58]' : 'bg-[#DEB587]'}`}></div>
                                                        {item.name}
                                                    </div>
                                                    {activeTab === 'users' && <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">{item.clinic?.name || 'Acesso Global'}</span>}
                                                </td>
                                                <td className="p-6 text-slate-500 font-semibold text-sm">
                                                    {activeTab === 'clinics' ? (item.cnpj || 'Não info') : activeTab === 'users' ? item.email : `${item.userCount} usuários`}
                                                </td>
                                                <td className="p-6">
                                                    {activeTab === 'billing' ? (
                                                        <div className="flex items-center gap-2">
                                                            {editingPrice === item.id ? (
                                                                <>
                                                                    <input
                                                                        type="number"
                                                                        className="w-20 bg-white border border-[#8A9A5B]/30 rounded-lg px-2 py-1 text-sm outline-none font-bold"
                                                                        value={tempPrice}
                                                                        onChange={e => setTempPrice(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <button onClick={() => handleUpdatePrice(item.id)} className="text-[#8A9A5B] p-1 hover:bg-[#8A9A5B]/10 rounded"><Check size={14} /></button>
                                                                    <button onClick={() => setEditingPrice(null)} className="text-[#DEB587] p-1 hover:bg-[#DEB587]/10 rounded"><XIcon size={14} /></button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-[#1A202C] font-bold">R$ {item.pricePerUser?.toFixed(2)}</span>
                                                                    <button
                                                                        onClick={() => { setEditingPrice(item.id); setTempPrice(item.pricePerUser.toString()); }}
                                                                        className="p-1 hover:bg-[#8A9A5B]/10 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <Edit3 size={12} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight uppercase border ${activeTab === 'clinics' ? 'bg-[#8A9A5B]/10 text-[#697D58] border-[#8A9A5B]/20' : 'bg-[#DEB587]/10 text-[#697D58] border-[#DEB587]/20'}`}>
                                                            {activeTab === 'clinics' ? (item.isActive ? 'Ativo' : 'Inativo') : item.role}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-6">
                                                    {activeTab === 'billing' ? (
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-extrabold text-[#697D58]">R$ {item.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                            <div className="flex gap-2 text-white">
                                                                <a
                                                                    href={saasApi.getInvoicePDFUrl(item.id)}
                                                                    download
                                                                    className="p-2 bg-[#697D58] hover:scale-105 rounded-xl transition-all flex items-center gap-1 text-[10px] font-bold shadow-md shadow-[#697D58]/20"
                                                                >
                                                                    <FileDown size={14} /> PDF
                                                                </a>
                                                                <a
                                                                    href={saasApi.getInvoiceXMLUrl(item.id)}
                                                                    download
                                                                    className="p-2 bg-[#8A9A5B] hover:scale-105 rounded-xl transition-all flex items-center gap-1 text-[10px] font-bold shadow-md shadow-[#8A9A5B]/20"
                                                                >
                                                                    <FileDown size={14} /> XML
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button className="p-2 hover:bg-[#8A9A5B]/10 rounded-lg text-slate-400 hover:text-[#697D58] transition-all">
                                                            <Settings size={18} />
                                                        </button>
                                                    )}
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
                            className="absolute inset-0 bg-[#1A202C]/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white border border-[#8A9A5B]/10 w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-3xl text-[#1A202C]"
                        >
                            <h2 className="text-3xl font-black mb-6 text-[#697D58]">Novo {activeTab === 'clinics' ? 'Clínica' : 'Usuário'}</h2>

                            {activeTab === 'clinics' ? (
                                <form onSubmit={handleCreateClinic} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#697D58] ml-4">Nome da Clínica</label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold"
                                            value={newClinic.name}
                                            onChange={e => setNewClinic({ ...newClinic, name: e.target.value })}
                                            placeholder="Nome fantasia"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-[#697D58] ml-4">CNPJ</label>
                                            <input
                                                className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold"
                                                value={newClinic.cnpj}
                                                onChange={e => setNewClinic({ ...newClinic, cnpj: e.target.value })}
                                                placeholder="00.000.000/0001-00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-[#697D58] ml-4">Endereço</label>
                                            <input
                                                className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold"
                                                value={newClinic.address}
                                                onChange={e => setNewClinic({ ...newClinic, address: e.target.value })}
                                                placeholder="Cidade - UF"
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-[#697D58] text-white rounded-2xl font-black mt-6 shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        CRIAR CLÍNICA
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#697D58] ml-4">Nome Completo</label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold"
                                            value={newUser.name}
                                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-[#697D58] ml-4">E-mail</label>
                                            <input
                                                required
                                                type="email"
                                                className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold"
                                                value={newUser.email}
                                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-[#697D58] ml-4">Senha Inicial</label>
                                            <input
                                                required
                                                type="password"
                                                className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold"
                                                value={newUser.password}
                                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#697D58] ml-4">Vincular Clínica</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all appearance-none font-bold"
                                                value={newUser.clinicId}
                                                onChange={e => setNewUser({ ...newUser, clinicId: e.target.value })}
                                            >
                                                <option value="">Acesso Global (Sem Clínica)</option>
                                                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <Building2 size={18} />
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-[#8A9A5B] text-white rounded-2xl font-black mt-6 shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
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
