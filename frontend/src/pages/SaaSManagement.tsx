import React, { useState, useEffect } from 'react';
import {
    Building2,
    Users,
    Plus,
    Settings,
    LogOut,
    Search,
    LayoutDashboard,
    FileDown,
    CreditCard,
    Edit3,
    Check,
    X as XIcon,
    Trash2,
    Image as ImageIcon,
    Upload,
    MessageSquare,
    Star,
    Phone
} from 'lucide-react';
import { saasApi, leadsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AlertDialog from '../components/ui/AlertDialog';

const InputField = ({ label, value, onChange, placeholder = '', type = 'text', required = false }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[#697D58] ml-2 block">{label}{required && '*'}</label>
        <input
            type={type}
            required={required}
            className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold text-sm"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

const SelectField = ({ label, value, onChange, options, required = false }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-[#697D58] ml-2 block">{label}{required && '*'}</label>
        <select
            required={required}
            className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold text-sm appearance-none"
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            <option value="">Selecione...</option>
            {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const SaaSManagement = () => {
    const { logout, user } = useAuth();
    const [clinics, setClinics] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [billingData, setBillingData] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'clinics' | 'users' | 'billing' | 'leads'>('clinics');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState<string>('');

    // Form States
    const [newClinic, setNewClinic] = useState({
        name: '', razaoSocial: '', cnpj: '', inscricaoEstadual: '', inscricaoMunicipal: '', cnae: '', regimeTributario: '', dataAbertura: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
        telefone: '', whatsapp: '', email: '', site: '',
        codigoServico: '', aliquotaISS: '', certificadoDigitalUrl: '',
        banco: '', agencia: '', conta: '', tipoConta: '', chavePix: '',
        logo: '', corMarca: '', responsavelAdmin: '', responsavelTecnico: '', crmResponsavel: '',
        registroVigilancia: '', cnes: '', pricePerUser: '50.0'
    });
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'CLINIC_ADMIN', clinicId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formSection, setFormSection] = useState<number>(1);

    // Management Modal States
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<any>(null);
    const [managementTab, setManagementTab] = useState<'perfil' | 'acesso' | 'usuarios'>('perfil');

    // User Management Modal States
    const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userManagementTab, setUserManagementTab] = useState<'perfil' | 'seguranca' | 'acesso'>('perfil');

    useEffect(() => {
        fetchData();
    }, []);

    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'clinic' | 'user' } | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Buscamos dados essenciais primeiro
            const [clinicsRes, usersRes, billingRes] = await Promise.all([
                saasApi.getClinics(),
                saasApi.getUsers(),
                saasApi.getBilling()
            ]);
            
            setClinics(clinicsRes.data);
            setUsers(usersRes.data);
            setBillingData(billingRes.data);

            try {
                const leadsRes = await leadsApi.getLeads();
                setLeads(leadsRes.data);
            } catch (err: any) {
                console.warn('Módulo de Leads ainda não disponível ou erro na busca:', err);
                const status = err.response?.status;
                if (status === 403) {
                    toast.error('Você não tem permissão para visualizar Leads.');
                } else if (status === 404) {
                    console.info('Endpoint de leads não encontrado (deploy em andamento?)');
                } else {
                    toast.error('Erro ao carregar Leads. Verifique a conexão.');
                }
                setLeads([]);
            }
        } catch (error) {
            console.error('Failed to fetch critical SaaS data', error);
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
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await saasApi.createClinic(newClinic);
            setIsModalOpen(false);
            setFormSection(1);
            setNewClinic({
                name: '', razaoSocial: '', cnpj: '', inscricaoEstadual: '', inscricaoMunicipal: '', cnae: '', regimeTributario: '', dataAbertura: '',
                cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
                telefone: '', whatsapp: '', email: '', site: '',
                codigoServico: '', aliquotaISS: '', certificadoDigitalUrl: '',
                banco: '', agencia: '', conta: '', tipoConta: '', chavePix: '',
                logo: '', corMarca: '', responsavelAdmin: '', responsavelTecnico: '', crmResponsavel: '',
                registroVigilancia: '', cnes: '', pricePerUser: '50.0'
            });
            fetchData();
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao criar clínica';
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await saasApi.createUser(newUser);
            setIsModalOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'CLINIC_ADMIN', clinicId: '' });
            fetchData();
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao criar usuário';
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenManagement = (clinic: any) => {
        setSelectedClinic({ ...clinic });
        setManagementTab('perfil');
        setIsManagementModalOpen(true);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await saasApi.uploadLogo(formData);
            const logoUrl = response.data.url;

            if (isNew) {
                setNewClinic({ ...newClinic, logo: logoUrl });
            } else if (selectedClinic) {
                setSelectedClinic({ ...selectedClinic, logo: logoUrl });
            }
        } catch (error) {
            console.error('Erro ao fazer upload da logo:', error);
            alert('Erro ao fazer upload da imagem.');
        }
    };

    const handleUpdateClinicStatus = async (status: boolean) => {
        if (!selectedClinic) return;
        setIsSubmitting(true);
        try {
            await saasApi.updateClinic(selectedClinic.id, { isActive: status });
            setSelectedClinic({ ...selectedClinic, isActive: status });
            fetchData();
        } catch (error) {
            alert('Erro ao atualizar status da clínica');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveClinicProfile = async () => {
        if (!selectedClinic) return;
        setIsSubmitting(true);
        try {
            await saasApi.updateClinic(selectedClinic.id, selectedClinic);
            fetchData();
            setIsManagementModalOpen(false);
        } catch (error) {
            alert('Erro ao atualizar dados da clínica');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClinic = (clinicId: string, clinicName: string) => {
        setItemToDelete({ id: clinicId, name: clinicName, type: 'clinic' });
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteClinic = async (clinicId: string) => {
        setIsLoading(true);
        try {
            await saasApi.deleteClinic(clinicId);
            fetchData();
            setIsConfirmDeleteOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao excluir clínica');
        } finally {
            setIsLoading(false);
        }
    };

    // User Management Functions
    const handleOpenUserManagement = (user: any) => {
        setSelectedUser({ ...user });
        setUserManagementTab('perfil');
        setIsUserManagementModalOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            await saasApi.updateUser(selectedUser.id, selectedUser);
            fetchData();
            setIsUserManagementModalOpen(false);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao atualizar usuário');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetUserPassword = async () => {
        if (!selectedUser) return;
        if (!confirm('Deseja resetar a senha deste usuário para "admin123" (provisório)?')) return;

        setIsSubmitting(true);
        try {
            await saasApi.updateUser(selectedUser.id, { password: 'admin123' });
            alert('Senha resetada com sucesso para: admin123');
            setIsUserManagementModalOpen(false);
        } catch (error: any) {
            alert('Erro ao resetar senha');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUserStatus = async (status: boolean) => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            await saasApi.updateUser(selectedUser.id, { isActive: status });
            setSelectedUser({ ...selectedUser, isActive: status });
            fetchData();
        } catch (error) {
            alert('Erro ao atualizar status do usuário');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = (userId: string, userName: string) => {
        setItemToDelete({ id: userId, name: userName, type: 'user' });
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteUser = async (userId: string) => {
        setIsLoading(true);
        try {
            await saasApi.deleteUser(userId);
            fetchData();
            setIsConfirmDeleteOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao excluir usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateLeadStatus = async (leadId: string, status: string) => {
        setIsSubmitting(true);
        try {
            await leadsApi.updateStatus(leadId, status);
            fetchData();
        } catch (error) {
            alert('Erro ao atualizar status do lead');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'NOVO': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'EM_CONTATO': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'CONVERTIDO': return 'bg-green-100 text-green-700 border-green-200';
            case 'ARQUIVADO': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
                    <p className="text-slate-500 font-medium mt-1">Bem-vindo, {user?.name}. Gerencie todas as instâncias do Rares360.</p>
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
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 border ${activeTab === 'leads' ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20 border-transparent' : 'bg-white/50 text-[#697D58] border-[#8A9A5B]/10 hover:bg-white'}`}
                    >
                        <MessageSquare size={24} />
                        <span className="font-black border-l border-current/10 pl-4 uppercase tracking-widest text-xs">Leads</span>
                    </button>

                    {/* Stats Card */}
                    <div className="p-8 rounded-[2.5rem] bg-[#697D58] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LayoutDashboard size={80} />
                        </div>
                        <p className="text-[#F0EAD6]/60 text-xs font-black uppercase tracking-[0.2em] mb-4">Total Ativo</p>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black">
                                {activeTab === 'clinics' ? clinics.length : activeTab === 'users' ? users.length : activeTab === 'billing' ? billingData.length : leads.length}
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
                                placeholder={`Buscar ${activeTab === 'clinics' ? 'clínica' : activeTab === 'users' ? 'usuário' : activeTab === 'leads' ? 'lead' : 'fatura'}...`}
                                className="bg-white border border-[#8A9A5B]/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 w-64 text-sm font-medium shadow-sm transition-all"
                            />
                        </div>
                        {activeTab !== 'leads' && activeTab !== 'billing' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#8A9A5B] hover:scale-[1.02] active:scale-95 text-white p-4 rounded-2xl shadow-xl shadow-[#8A9A5B]/20 transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                            >
                                <Plus size={20} /> Novo {activeTab === 'clinics' ? 'Clínica' : 'Usuário'}
                            </button>
                        )}
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
                                            {activeTab === 'clinics' ? 'CNPJ' : activeTab === 'users' ? 'E-mail' : activeTab === 'leads' ? 'Contato' : 'Usuários Reg.'}
                                        </th>
                                        <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">
                                            {activeTab === 'clinics' ? 'Status' : activeTab === 'users' ? 'Role' : activeTab === 'leads' ? 'Score' : 'Vl. por Usuário'}
                                        </th>
                                        <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest text-right">
                                            {activeTab === 'billing' ? 'Total Fatura' : activeTab === 'leads' ? 'Status e Ações' : 'Ações'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {(activeTab === 'clinics' ? clinics : activeTab === 'users' ? users : activeTab === 'billing' ? billingData : leads).map((item) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="border-b border-[#8A9A5B]/5 hover:bg-white transition-colors group"
                                            >
                                                <td className="p-6">
                                                    <div className="font-extrabold flex items-center gap-3 text-[#1A202C]">
                                                        {activeTab === 'leads' ? (
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#8A9A5B]/10 flex items-center justify-center text-[#697D58]">
                                                                <Users size={18} />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-2 h-2 rounded-full ${activeTab === 'clinics' ? (item.isActive ? 'bg-[#8A9A5B]' : 'bg-[#DEB587]') : activeTab === 'users' ? 'bg-[#697D58]' : 'bg-[#DEB587]'}`}></div>
                                                        )}
                                                        <div>
                                                            <p className="font-extrabold">{item.name}</p>
                                                            {activeTab === 'leads' && (
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    {new Date(item.createdAt).toLocaleDateString()} às {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {activeTab === 'users' && <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">{item.clinic?.name || 'Acesso Global'}</span>}
                                                </td>
                                                <td className="p-6 text-slate-500 font-semibold text-sm">
                                                    {activeTab === 'clinics' ? (item.cnpj || 'Não info') : activeTab === 'users' ? item.email : activeTab === 'leads' ? (
                                                        <div className="space-y-1">
                                                            <p className="text-slate-800 font-bold">{item.email}</p>
                                                            <p className="text-[10px]">{item.whatsapp}</p>
                                                        </div>
                                                    ) : `${item.userCount} usuários`}
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
                                                    ) : activeTab === 'leads' ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${item.score >= 80 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                                <Star size={12} className={item.score >= 80 ? 'fill-orange-500' : ''} />
                                                                <span className="text-xs font-black">{item.score}</span>
                                                            </div>
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
                                                    ) : activeTab === 'leads' ? (
                                                        <div className="flex items-center justify-end gap-4">
                                                            <select 
                                                                value={item.status}
                                                                onChange={(e) => handleUpdateLeadStatus(item.id, e.target.value)}
                                                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border focus:outline-none transition-all cursor-pointer ${getStatusStyles(item.status)}`}
                                                            >
                                                                <option value="NOVO">Novo</option>
                                                                <option value="EM_CONTATO">Em Contato</option>
                                                                <option value="CONVERTIDO">Convertido</option>
                                                                <option value="ARQUIVADO">Arquivado</option>
                                                            </select>
                                                            <div className="flex items-center gap-1">
                                                                <a 
                                                                    href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}?text=Olá ${item.name}, tudo bem? Sou consultor da Rares360. Recebi seu interesse no assunto "${item.subject}". Podemos conversar?`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 bg-[#25D366] text-white rounded-lg hover:scale-110 transition-all shadow-md shadow-[#25D366]/20"
                                                                    title="Chamar no WhatsApp"
                                                                >
                                                                    <Phone size={16} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (activeTab === 'clinics') {
                                                                        handleOpenManagement(item);
                                                                    } else if (activeTab === 'users') {
                                                                        handleOpenUserManagement(item);
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-[#8A9A5B]/10 rounded-lg text-slate-400 hover:text-[#697D58] transition-all"
                                                            >
                                                                <Settings size={18} />
                                                            </button>
                                                            {(activeTab === 'clinics' || activeTab === 'users') && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (activeTab === 'clinics') {
                                                                            handleDeleteClinic(item.id, item.name);
                                                                        } else if (activeTab === 'users') {
                                                                            handleDeleteUser(item.id, item.name);
                                                                        }
                                                                    }}
                                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-500 transition-all"
                                                                    title={activeTab === 'clinics' ? "Excluir Clínica" : "Excluir Usuário"}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1A202C]/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white border border-[#8A9A5B]/10 w-full max-w-4xl rounded-[2.5rem] p-10 relative z-10 shadow-3xl text-[#1A202C] my-auto"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-all">
                                <XIcon size={24} className="text-slate-400" />
                            </button>

                            <h2 className="text-3xl font-black mb-1 text-[#697D58]">
                                {activeTab === 'clinics' ? 'Configurar Nova Clínica' : 'Cadastrar Novo Usuário'}
                            </h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">Gestão SaaS Rares360</p>

                            {activeTab === 'clinics' ? (
                                <form onSubmit={handleCreateClinic} className="space-y-8">
                                    {/* Form Tabs / Navigation */}
                                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
                                        {[
                                            { id: 1, label: 'Empresa' },
                                            { id: 2, label: 'Endereço' },
                                            { id: 3, label: 'Contato' },
                                            { id: 4, label: 'Fiscal' },
                                            { id: 5, label: 'Bancos' },
                                            { id: 6, label: 'Sistema' }
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setFormSection(s.id)}
                                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${formSection === s.id ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400 hover:text-[#697D58]'}`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="min-h-[400px]">
                                        {/* Section 1: Empresa */}
                                        {formSection === 1 && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden flex-shrink-0">
                                                        {newClinic.logo ? (
                                                            <img src={newClinic.logo} alt="Preview" className="w-full h-full object-contain p-2" />
                                                        ) : (
                                                            <ImageIcon className="text-slate-200" size={32} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">Logo da Clínica</p>
                                                        <p className="text-[10px] text-slate-400 font-bold mb-3">Recomendado: fundo transparente (PNG/WEBP)</p>
                                                        <label className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-[#697D58] uppercase tracking-widest cursor-pointer hover:bg-[#8A9A5B]/5 hover:border-[#8A9A5B]/30 transition-all">
                                                            <Upload size={14} className="mr-2" /> Selecionar Arquivo
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, true)} />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <InputField label="Nome de Exibição" required value={newClinic.name} onChange={(v: any) => setNewClinic({ ...newClinic, name: v })} placeholder="Ex: Clínica Rares360" />
                                                    <InputField label="Razão Social" value={newClinic.razaoSocial} onChange={(v: any) => setNewClinic({ ...newClinic, razaoSocial: v })} />
                                                    <InputField label="CNPJ" required value={newClinic.cnpj} onChange={(v: any) => setNewClinic({ ...newClinic, cnpj: v })} placeholder="00.000.000/0001-00" />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <InputField label="Insc. Estadual" value={newClinic.inscricaoEstadual} onChange={(v: any) => setNewClinic({ ...newClinic, inscricaoEstadual: v })} />
                                                        <InputField label="Insc. Municipal" value={newClinic.inscricaoMunicipal} onChange={(v: any) => setNewClinic({ ...newClinic, inscricaoMunicipal: v })} />
                                                    </div>
                                                    <InputField label="CNAE (Principal)" value={newClinic.cnae} onChange={(v: any) => setNewClinic({ ...newClinic, cnae: v })} />
                                                    <SelectField label="Regime Tributário" value={newClinic.regimeTributario} onChange={(v: any) => setNewClinic({ ...newClinic, regimeTributario: v })} options={[
                                                        { label: 'Simples Nacional', value: 'SIMPLES' },
                                                        { label: 'Lucro Presumido', value: 'PRESUMIDO' },
                                                        { label: 'Lucro Real', value: 'REAL' },
                                                        { label: 'MEI', value: 'MEI' }
                                                    ]} />
                                                    <InputField label="Data de Abertura" type="date" value={newClinic.dataAbertura} onChange={(v: any) => setNewClinic({ ...newClinic, dataAbertura: v })} />
                                                    <InputField label="Mensalidade Padrão" type="number" value={newClinic.pricePerUser} onChange={(v: any) => setNewClinic({ ...newClinic, pricePerUser: v })} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Section 2: Endereço */}
                                        {formSection === 2 && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <InputField label="CEP" value={newClinic.cep} onChange={(v: any) => setNewClinic({ ...newClinic, cep: v })} placeholder="00000-000" />
                                                <div className="md:col-span-2">
                                                    <InputField label="Logradouro (Rua/Av)" value={newClinic.logradouro} onChange={(v: any) => setNewClinic({ ...newClinic, logradouro: v })} />
                                                </div>
                                                <InputField label="Número" value={newClinic.numero} onChange={(v: any) => setNewClinic({ ...newClinic, numero: v })} />
                                                <InputField label="Complemento" value={newClinic.complemento} onChange={(v: any) => setNewClinic({ ...newClinic, complemento: v })} />
                                                <InputField label="Bairro" value={newClinic.bairro} onChange={(v: any) => setNewClinic({ ...newClinic, bairro: v })} />
                                                <div className="md:col-span-2">
                                                    <InputField label="Cidade" value={newClinic.cidade} onChange={(v: any) => setNewClinic({ ...newClinic, cidade: v })} />
                                                </div>
                                                <InputField label="Estado (UF)" value={newClinic.estado} onChange={(v: any) => setNewClinic({ ...newClinic, estado: v })} />
                                            </div>
                                        )}

                                        {/* Section 3: Contato */}
                                        {formSection === 3 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <InputField label="Telefone Fixo" value={newClinic.telefone} onChange={(v: any) => setNewClinic({ ...newClinic, telefone: v })} />
                                                <InputField label="WhatsApp" value={newClinic.whatsapp} onChange={(v: any) => setNewClinic({ ...newClinic, whatsapp: v })} />
                                                <InputField label="E-mail da Clínica" type="email" value={newClinic.email} onChange={(v: any) => setNewClinic({ ...newClinic, email: v })} />
                                                <InputField label="Site Oficial" value={newClinic.site} onChange={(v: any) => setNewClinic({ ...newClinic, site: v })} placeholder="https://..." />
                                            </div>
                                        )}

                                        {/* Section 4: Fiscal */}
                                        {formSection === 4 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <InputField label="Cód. Serviço Prefeitura" value={newClinic.codigoServico} onChange={(v: any) => setNewClinic({ ...newClinic, codigoServico: v })} />
                                                <InputField label="Alíquota ISS (%)" type="number" value={newClinic.aliquotaISS} onChange={(v: any) => setNewClinic({ ...newClinic, aliquotaISS: v })} />
                                                <div className="md:col-span-2">
                                                    <InputField label="URL Certificado Digital (Opcional)" value={newClinic.certificadoDigitalUrl} onChange={(v: any) => setNewClinic({ ...newClinic, certificadoDigitalUrl: v })} placeholder="Link para storage ou serviço" />
                                                </div>
                                                <div className="md:col-span-2 p-6 bg-amber-50 rounded-2xl border border-amber-200">
                                                    <p className="text-amber-800 text-[10px] font-black uppercase tracking-widest mb-1">Atenção</p>
                                                    <p className="text-amber-700 text-xs font-semibold">Configurações fiscais impactam diretamente na emissão de faturamento automático pelo SaaS.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Section 5: Bancos */}
                                        {formSection === 5 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <InputField label="Banco" value={newClinic.banco} onChange={(v: any) => setNewClinic({ ...newClinic, banco: v })} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InputField label="Agência" value={newClinic.agencia} onChange={(v: any) => setNewClinic({ ...newClinic, agencia: v })} />
                                                    <InputField label="Conta" value={newClinic.conta} onChange={(v: any) => setNewClinic({ ...newClinic, conta: v })} />
                                                </div>
                                                <SelectField label="Tipo de Conta" value={newClinic.tipoConta} onChange={(v: any) => setNewClinic({ ...newClinic, tipoConta: v })} options={[
                                                    { label: 'Conta Corrente PJ', value: 'CORRENTE_PJ' },
                                                    { label: 'Conta Corrente PF', value: 'CORRENTE_PF' },
                                                    { label: 'Conta Poupança', value: 'POUPANCA' }
                                                ]} />
                                                <InputField label="Chave PIX Principal" value={newClinic.chavePix} onChange={(v: any) => setNewClinic({ ...newClinic, chavePix: v })} />
                                            </div>
                                        )}

                                        {/* Section 6: Sistema */}
                                        {formSection === 6 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <InputField label="Responsável Admin" value={newClinic.responsavelAdmin} onChange={(v: any) => setNewClinic({ ...newClinic, responsavelAdmin: v })} />
                                                <InputField label="Responsável Técnico" value={newClinic.responsavelTecnico} onChange={(v: any) => setNewClinic({ ...newClinic, responsavelTecnico: v })} />
                                                <InputField label="CRM do Responsável" value={newClinic.crmResponsavel} onChange={(v: any) => setNewClinic({ ...newClinic, crmResponsavel: v })} />
                                                <InputField label="CNES (Opcional)" value={newClinic.cnes} onChange={(v: any) => setNewClinic({ ...newClinic, cnes: v })} />
                                                <InputField label="Reg. Vigilância Sanitária" value={newClinic.registroVigilancia} onChange={(v: any) => setNewClinic({ ...newClinic, registroVigilancia: v })} />
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#697D58] ml-2 block">Cor da Marca</label>
                                                    <div className="flex gap-2">
                                                        <input type="color" className="w-12 h-10 rounded-lg p-0 border-none cursor-pointer" value={newClinic.corMarca || '#8A9A5B'} onChange={e => setNewClinic({ ...newClinic, corMarca: e.target.value })} />
                                                        <input type="text" className="flex-1 bg-slate-50 border border-[#8A9A5B]/10 rounded-xl px-4 py-2 font-bold text-sm" value={newClinic.corMarca} onChange={e => setNewClinic({ ...newClinic, corMarca: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-6 border-t border-[#8A9A5B]/10">
                                        <button
                                            type="button"
                                            disabled={formSection === 1}
                                            onClick={() => setFormSection(s => s - 1)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all disabled:opacity-30"
                                        >
                                            Anterior
                                        </button>
                                        {formSection < 6 ? (
                                            <button
                                                type="button"
                                                onClick={() => setFormSection(s => s + 1)}
                                                className="flex-[2] py-4 bg-[#697D58] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Próxima Seção
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-[2] py-4 bg-[#8A9A5B] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleCreateUser} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Nome Completo" required value={newUser.name} onChange={(v: any) => setNewUser({ ...newUser, name: v })} />
                                        <InputField label="E-mail de Acesso" required type="email" value={newUser.email} onChange={(v: any) => setNewUser({ ...newUser, email: v })} />
                                        <InputField label="Senha Inicial" required type="password" value={newUser.password} onChange={(v: any) => setNewUser({ ...newUser, password: v })} />
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#697D58] ml-2 block">Vincular Clínica</label>
                                            <select
                                                className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold text-sm appearance-none"
                                                value={newUser.clinicId}
                                                onChange={e => setNewUser({ ...newUser, clinicId: e.target.value })}
                                            >
                                                <option value="">Acesso Global (Sem Clínica)</option>
                                                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-[#8A9A5B] text-white rounded-2xl font-black mt-6 shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'CRIANDO...' : 'CRIAR USUÁRIO'}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
                {isManagementModalOpen && selectedClinic && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1A202C]/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden"
                            onClick={(e: any) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-[#8A9A5B]/10 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h3 className="text-2xl font-black text-[#697D58]">Gestão da Clínica</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedClinic.name}</p>
                                </div>
                                <button onClick={() => setIsManagementModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                                    <XIcon size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex border-b border-[#8A9A5B]/10">
                                {['perfil', 'acesso', 'usuarios'].map((tab: any) => (
                                    <button
                                        key={tab}
                                        onClick={() => setManagementTab(tab)}
                                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${managementTab === tab ? 'text-[#697D58] border-b-2 border-[#697D58] bg-[#697D58]/5' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="p-8 max-h-[60vh] overflow-y-auto">
                                {managementTab === 'perfil' && (
                                    <div className="space-y-8">
                                        {/* Logo da Clínica */}
                                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 group hover:border-[#8A9A5B]/50 transition-all relative overflow-hidden">
                                            {selectedClinic.logo ? (
                                                <div className="relative group/logo">
                                                    <img src={selectedClinic.logo} alt="Logo" className="w-32 h-32 object-contain rounded-2xl bg-white p-2 shadow-sm" />
                                                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                                        <label htmlFor="logo-update" className="cursor-pointer text-white font-black text-[10px] uppercase tracking-widest">Alterar Logo</label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label htmlFor="logo-update" className="flex flex-col items-center cursor-pointer">
                                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm text-slate-300 group-hover:text-[#8A9A5B] transition-colors">
                                                        <Upload size={32} />
                                                    </div>
                                                    <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-[#697D58]">Clique para subir o Logo</p>
                                                    <p className="mt-1 text-[10px] text-slate-300 font-bold">PNG, JPG ou WEBP (Max 2MB)</p>
                                                </label>
                                            )}
                                            <input
                                                type="file"
                                                id="logo-update"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleLogoUpload(e)}
                                            />
                                        </div>

                                        {/* Seção 1: Dados Cadastrais */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Dados Cadastrais</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField label="Nome Fantasia" value={selectedClinic.name} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, name: v })} />
                                                <InputField label="Razão Social" value={selectedClinic.razaoSocial} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, razaoSocial: v })} />
                                                <InputField label="CNPJ" value={selectedClinic.cnpj} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, cnpj: v })} />
                                                <InputField label="Inscrição Estadual" value={selectedClinic.inscricaoEstadual} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, inscricaoEstadual: v })} />
                                                <InputField label="Inscrição Municipal" value={selectedClinic.inscricaoMunicipal} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, inscricaoMunicipal: v })} />
                                                <InputField label="CNAE" value={selectedClinic.cnae} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, cnae: v })} />
                                                <SelectField
                                                    label="Regime Tributário"
                                                    value={selectedClinic.regimeTributario}
                                                    onChange={(v: any) => setSelectedClinic({ ...selectedClinic, regimeTributario: v })}
                                                    options={[
                                                        { label: 'Simples Nacional', value: 'SIMPLES_NACIONAL' },
                                                        { label: 'Lucro Presumido', value: 'LUCRO_PRESUMIDO' },
                                                        { label: 'Lucro Real', value: 'LUCRO_REAL' }
                                                    ]}
                                                />
                                                <InputField label="Data de Abertura" type="date" value={selectedClinic.dataAbertura ? new Date(selectedClinic.dataAbertura).toISOString().split('T')[0] : ''} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, dataAbertura: v })} />
                                            </div>
                                        </div>

                                        {/* Seção 2: Localização */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Localização</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <InputField label="CEP" value={selectedClinic.cep} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, cep: v })} />
                                                <div className="md:col-span-2">
                                                    <InputField label="Logradouro" value={selectedClinic.logradouro} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, logradouro: v })} />
                                                </div>
                                                <InputField label="Número" value={selectedClinic.numero} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, numero: v })} />
                                                <InputField label="Bairro" value={selectedClinic.bairro} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, bairro: v })} />
                                                <InputField label="Cidade" value={selectedClinic.cidade} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, cidade: v })} />
                                                <InputField label="Estado" value={selectedClinic.estado} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, estado: v })} />
                                            </div>
                                        </div>

                                        {/* Seção 3: Contato */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Contato e Digital</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField label="E-mail" value={selectedClinic.email} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, email: v })} />
                                                <InputField label="Telefone" value={selectedClinic.telefone} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, telefone: v })} />
                                                <InputField label="WhatsApp" value={selectedClinic.whatsapp} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, whatsapp: v })} />
                                                <InputField label="Site" value={selectedClinic.site} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, site: v })} />
                                            </div>
                                        </div>

                                        {/* Seção 4: Fiscais e Bancários */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Fiscal e Bancário</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField label="Cód. Serviço" value={selectedClinic.codigoServico} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, codigoServico: v })} />
                                                <InputField label="Alíquota ISS (%)" type="number" value={selectedClinic.aliquotaISS} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, aliquotaISS: v })} />
                                                <InputField label="Banco" value={selectedClinic.banco} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, banco: v })} />
                                                <InputField label="Agência" value={selectedClinic.agencia} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, agencia: v })} />
                                                <InputField label="Conta" value={selectedClinic.conta} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, conta: v })} />
                                                <InputField label="Chave PIX" value={selectedClinic.chavePix} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, chavePix: v })} />
                                            </div>
                                        </div>

                                        {/* Seção 5: Responsáveis e Operação */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Responsáveis e Operação</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField label="Responsável Admin" value={selectedClinic.responsavelAdmin} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, responsavelAdmin: v })} />
                                                <InputField label="Responsável Técnico" value={selectedClinic.responsavelTecnico} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, responsavelTecnico: v })} />
                                                <InputField label="CRM Responsável" value={selectedClinic.crmResponsavel} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, crmResponsavel: v })} />
                                                <InputField label="Reg. Vigilância" value={selectedClinic.registroVigilancia} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, registroVigilancia: v })} />
                                                <InputField label="CNES" value={selectedClinic.cnes} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, cnes: v })} />
                                                <InputField label="Preço por Usuário (R$)" type="number" value={selectedClinic.pricePerUser} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, pricePerUser: v })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {managementTab === 'acesso' && (
                                    <div className="space-y-8 py-4 text-center">
                                        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${selectedClinic.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <Building2 size={48} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800">Status de Acesso</h4>
                                            <p className="text-sm font-bold text-slate-400 mt-2">
                                                A clínica está atualmente <strong>{selectedClinic.isActive ? 'ATIVA' : 'BLOQUEADA'}</strong>.
                                            </p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleUpdateClinicStatus(true)}
                                                disabled={isSubmitting || selectedClinic.isActive}
                                                className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                            >
                                                Ativar Acesso
                                            </button>
                                            <button
                                                onClick={() => handleUpdateClinicStatus(false)}
                                                disabled={isSubmitting || !selectedClinic.isActive}
                                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                            >
                                                Bloquear Acesso
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {managementTab === 'usuarios' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-black text-[#697D58] uppercase tracking-widest">Usuários Vinculados</h4>
                                            <button
                                                onClick={() => {
                                                    setNewUser({ ...newUser, clinicId: selectedClinic.id });
                                                    setActiveTab('users');
                                                    setIsManagementModalOpen(false);
                                                    setIsModalOpen(true);
                                                }}
                                                className="flex items-center gap-2 text-[10px] font-black text-[#8A9A5B] hover:text-[#697D58] transition-all uppercase tracking-widest"
                                            >
                                                <Plus size={14} /> Incluir Novo Usuário
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {users.filter(u => u.clinicId === selectedClinic.id).length > 0 ? (
                                                users.filter(u => u.clinicId === selectedClinic.id).map(u => (
                                                    <div key={u.id} className="p-4 bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-black text-slate-700">{u.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-[#8A9A5B]/10 text-[#697D58] rounded-full text-[9px] font-black uppercase tracking-tighter">
                                                            {u.role}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-[#8A9A5B]/20">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum usuário exclusivo vinculado</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {managementTab === 'perfil' && (
                                <div className="p-6 border-t border-[#8A9A5B]/10 flex-shrink-0 bg-slate-50">
                                    <button
                                        onClick={handleSaveClinicProfile}
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-[#697D58] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Salvando...' : 'Salvar Todas as Alterações'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Gestão de Usuário */}
            <AnimatePresence>
                {isUserManagementModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsUserManagementModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="bg-[#697D58] p-6 text-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                        <Users className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">Gestão de Usuário</h2>
                                        <p className="text-[#F0EAD6]/80 text-sm font-medium mt-0.5">{selectedUser.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsUserManagementModalOpen(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-md"
                                >
                                    <XIcon size={20} />
                                </button>
                            </div>

                            <div className="flex border-b border-[#8A9A5B]/10 shrink-0 overflow-x-auto">
                                <button
                                    onClick={() => setUserManagementTab('perfil')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap px-4 ${userManagementTab === 'perfil' ? 'text-[#697D58] border-b-2 border-[#697D58] bg-[#8A9A5B]/5' : 'text-slate-400 hover:text-[#8A9A5B] hover:bg-slate-50'}`}
                                >
                                    Perfil
                                </button>
                                <button
                                    onClick={() => setUserManagementTab('seguranca')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap px-4 ${userManagementTab === 'seguranca' ? 'text-[#697D58] border-b-2 border-[#697D58] bg-[#8A9A5B]/5' : 'text-slate-400 hover:text-[#8A9A5B] hover:bg-slate-50'}`}
                                >
                                    Segurança
                                </button>
                                <button
                                    onClick={() => setUserManagementTab('acesso')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap px-4 ${userManagementTab === 'acesso' ? 'text-[#697D58] border-b-2 border-[#697D58] bg-[#8A9A5B]/5' : 'text-slate-400 hover:text-[#8A9A5B] hover:bg-slate-50'}`}
                                >
                                    Acesso
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {userManagementTab === 'perfil' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputField label="Nome Completo" value={selectedUser.name} onChange={(v: any) => setSelectedUser({ ...selectedUser, name: v })} />
                                            <InputField label="E-mail" value={selectedUser.email} onChange={(v: any) => setSelectedUser({ ...selectedUser, email: v })} />

                                            <SelectField
                                                label="Cargo (Role)"
                                                value={selectedUser.role}
                                                onChange={(v: any) => setSelectedUser({ ...selectedUser, role: v })}
                                                options={[
                                                    { value: 'CLINIC_ADMIN', label: 'Administrador de Clínica' },
                                                    { value: 'ADMIN_GLOBAL', label: 'Administrador Global' }
                                                ]}
                                            />

                                            {selectedUser.role !== 'ADMIN_GLOBAL' && (
                                                <SelectField
                                                    label="Clínica Vinculada"
                                                    value={selectedUser.clinicId || ''}
                                                    onChange={(v: any) => setSelectedUser({ ...selectedUser, clinicId: v })}
                                                    options={[
                                                        { value: '', label: 'Nenhuma / Administrador' },
                                                        ...clinics.map(c => ({ value: c.id, label: c.name }))
                                                    ]}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {userManagementTab === 'seguranca' && (
                                    <div className="space-y-8 py-4 text-center">
                                        <div className="mx-auto w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Edit3 size={48} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800">Redefinir Senha</h4>
                                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-md mx-auto">
                                                Ao confirmar, a senha do usuário será redefinida para a senha padrão <strong className="text-orange-600">admin123</strong>.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleResetUserPassword}
                                            disabled={isSubmitting}
                                            className="mx-auto block px-8 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                        >
                                            Resetar Senha para "admin123"
                                        </button>
                                    </div>
                                )}

                                {userManagementTab === 'acesso' && (
                                    <div className="space-y-8 py-4 text-center">
                                        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${selectedUser.isActive !== false ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <Users size={48} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800">Status de Acesso</h4>
                                            <p className="text-sm font-bold text-slate-400 mt-2">
                                                O usuário está atualmente <strong className={selectedUser.isActive !== false ? "text-green-600" : "text-red-600"}>{selectedUser.isActive !== false ? 'ATIVO' : 'BLOQUEADO'}</strong>.
                                            </p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleUpdateUserStatus(true)}
                                                disabled={isSubmitting || selectedUser.isActive !== false}
                                                className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                            >
                                                Ativar Acesso
                                            </button>
                                            <button
                                                onClick={() => handleUpdateUserStatus(false)}
                                                disabled={isSubmitting || selectedUser.isActive === false}
                                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                            >
                                                Bloquear Acesso
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {userManagementTab === 'perfil' && (
                                <div className="p-6 border-t border-[#8A9A5B]/10 bg-slate-50 shrink-0">
                                    <button
                                        onClick={handleUpdateUser}
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-[#697D58] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Salvando...' : 'Salvar Perfil'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AlertDialog
                isOpen={isConfirmDeleteOpen}
                onClose={() => { setIsConfirmDeleteOpen(false); setItemToDelete(null); }}
                onConfirm={() => {
                    if (itemToDelete?.type === 'clinic') {
                        confirmDeleteClinic(itemToDelete.id);
                    } else if (itemToDelete?.type === 'user') {
                        confirmDeleteUser(itemToDelete.id);
                    }
                }}
                title={itemToDelete?.type === 'clinic' ? 'Remover Clínica' : 'Remover Usuário'}
                description={
                    itemToDelete?.type === 'clinic' ? (
                        <>
                            Você está prestes a excluir a clínica <span className="font-bold text-slate-800">"{itemToDelete.name}"</span>. 
                            Esta ação é <span className="text-red-500 font-black uppercase tracking-widest text-[10px]">irreversível</span> e todos os dados vinculados (usuários, registros, etc) serão apagados permanentemente.
                        </>
                    ) : (
                        <>
                            Deseja realmente excluir o usuário <span className="font-bold text-slate-800">"{itemToDelete?.name}"</span>?
                            Esta operação não poderá ser desfeita.
                        </>
                    )
                }
                confirmText={itemToDelete?.type === 'clinic' ? 'Sim, Excluir APP/Clínica' : 'Confirmar Exclusão'}
                cancelText="Cancelar"
                icon={Trash2}
                variant="danger"
                isPending={isLoading}
            />
        </div>
    );
};

export default SaaSManagement;
