import React, { useState, useEffect } from 'react';
import {
    Building2,
    Users,
    Plus,
    Settings,
    Search,
    LayoutDashboard,
    FileDown,
    CreditCard,
    Edit3,
    X as XIcon,
    Trash2,
    Image as ImageIcon,
    Upload,
    MessageSquare,
    Star,
    Phone,
    Cpu,
    Mail,
    ChevronLeft,
    ChevronRight,
    Lock as LockIcon,
    TrendingUp,
    BarChart3
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'clinics' | 'users' | 'billing' | 'leads' | 'reports' | 'settings' | 'audit' | 'security'>('dashboard');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [planFilter, setPlanFilter] = useState('Todos');

    // Novo Drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<any>(null);
    const [drawerTab, setDrawerTab] = useState('overview');


    const [isGenerateBillingModalOpen, setIsGenerateBillingModalOpen] = useState(false);
    const [billingGenerationStatus, setBillingGenerationStatus] = useState<'idle' | 'processing'>('idle');

    // Faturamento e Accordion States
    const [expandedClinics, setExpandedClinics] = useState<Record<string, boolean>>({});
    const [expandedClinicInvoices, setExpandedClinicInvoices] = useState<Record<string, any[]>>({});
    const [loadingInvoices, setLoadingInvoices] = useState<Record<string, boolean>>({});
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [contractConfig, setContractConfig] = useState<any>(null);

    // Form States
    const [newClinic, setNewClinic] = useState({
        name: '', razaoSocial: '', cnpj: '', inscricaoEstadual: '', inscricaoMunicipal: '', cnae: '', regimeTributario: '', dataAbertura: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
        telefone: '', whatsapp: '', email: '', site: '',
        codigoServico: '', aliquotaISS: '', certificadoDigitalUrl: '',
        banco: '', agencia: '', conta: '', tipoConta: '', chavePix: '',
        logo: '', corMarca: '', responsavelAdmin: '', responsavelTecnico: '', crmResponsavel: '',
        registroVigilancia: '', cnes: '', pricePerUser: '50.0',
        implementationFee: '0', monthlyFee: '0', proposalUrl: '', plan: 'Essencial'
    });
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'CLINIC_ADMIN', clinicId: '' });
    const [newLead, setNewLead] = useState({
        name: '',
        email: '',
        whatsapp: '',
        subject: 'Contato CRM',
        status: 'NOVO',
        diagnostic: {
            clinicType: '',
            operationTime: '',
            professionalsCount: '',
            mainChallenge: '',
            monthlyRevenue: '',
            hasDRE: '',
            hasDFC: '',
            organizedCosts: '',
            knowsMargin: '',
            knowsRevenueGoal: '',
            knowsHighMarginProcedures: '',
            identifiedNegativeMargin: '',
            knowsMonthlyLeads: '',
            monitorsConversion: '',
            structuredFollowUp: '',
            reliableInventory: '',
            knowsSupplyCosts: '',
            patientReturnControl: '',
            pricingFactors: [] as string[]
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formSection, setFormSection] = useState<number>(1);

    // Management Modal States
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const [managementTab, setManagementTab] = useState<'perfil' | 'precificacao' | 'acesso' | 'usuarios'>('perfil');

    // User Management Modal States
    const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userManagementTab, setUserManagementTab] = useState<'perfil' | 'seguranca' | 'acesso'>('perfil');

    // Lead Diagnostic Modal States
    const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);

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


    const handleToggleInvoices = async (clinicId: string) => {
        if (expandedClinics[clinicId]) {
            setExpandedClinics(prev => ({ ...prev, [clinicId]: false }));
            return;
        }

        setExpandedClinics(prev => ({ ...prev, [clinicId]: true }));
        if (!expandedClinicInvoices[clinicId]) {
            setLoadingInvoices(prev => ({ ...prev, [clinicId]: true }));
            try {
                const res = await saasApi.getClinicInvoices(clinicId);
                setExpandedClinicInvoices(prev => ({ ...prev, [clinicId]: res.data }));
            } catch (error) {
                toast.error('Erro ao buscar faturas.');
            } finally {
                setLoadingInvoices(prev => ({ ...prev, [clinicId]: false }));
            }
        }
    };

    const handleOpenContractModal = (clinic: any) => {
        setContractConfig({
            id: clinic.id,
            name: clinic.name,
            contractDurationMonths: clinic.contractDurationMonths || 12,
            monthlyFee: clinic.pricePerUser, // em billing mapped
            setupValue: clinic.setupValue || 0,
            setupPaymentType: clinic.setupPaymentType || 'DILUIDO_NA_MENSALIDADE',
            setupInstallments: clinic.setupInstallments || 1
        });
        setIsContractModalOpen(true);
    };

    const handleSaveContractConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await saasApi.updateClinic(contractConfig.id, {
                monthlyFee: contractConfig.monthlyFee,
                setupValue: contractConfig.setupValue,
                setupPaymentType: contractConfig.setupPaymentType,
                setupInstallments: contractConfig.setupInstallments,
                contractDurationMonths: contractConfig.contractDurationMonths,
                setupRemainingInstallments: contractConfig.setupInstallments // Reset setup parcels when config changes on this fast screen
            });
            toast.success('Contrato atualizado com sucesso!');
            setIsContractModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Erro ao salvar contrato');
        } finally {
            setIsSubmitting(false);
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
                registroVigilancia: '', cnes: '', pricePerUser: '50.0',
                implementationFee: '0', monthlyFee: '0', proposalUrl: '', plan: 'Essencial'
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

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await leadsApi.createLead(newLead);
            setIsModalOpen(false);
            setNewLead({
                name: '', email: '', whatsapp: '', subject: 'Contato CRM', status: 'NOVO',
                diagnostic: {
                    clinicType: '', operationTime: '', professionalsCount: '', mainChallenge: '', monthlyRevenue: '',
                    hasDRE: '', hasDFC: '', organizedCosts: '', knowsMargin: '', knowsRevenueGoal: '',
                    knowsHighMarginProcedures: '', identifiedNegativeMargin: '', knowsMonthlyLeads: '',
                    monitorsConversion: '', structuredFollowUp: '', reliableInventory: '', knowsSupplyCosts: '',
                    patientReturnControl: '', pricingFactors: []
                }
            });
            fetchData();
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao criar lead';
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
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

    const handleProposalUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await saasApi.uploadLogo(formData); // Reutilizando a mesma rota de upload
            const fileUrl = response.data.url;

            if (isNew) {
                setNewClinic({ ...newClinic, proposalUrl: fileUrl });
            } else if (selectedClinic) {
                setSelectedClinic({ ...selectedClinic, proposalUrl: fileUrl });
            }
            toast.success('Proposta anexada com sucesso!');
        } catch (error) {
            console.error('Erro ao fazer upload da proposta:', error);
            alert('Erro ao anexar arquivo.');
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

    const handleGenerateBilling = () => {
        setIsGenerateBillingModalOpen(true);
    };

    const confirmGenerateBilling = async () => {
        setBillingGenerationStatus('processing');
        try {
            await saasApi.generateMonthlyInvoices();
            toast.success('Faturas processadas com sucesso para as clínicas.');
            fetchData();
            setIsGenerateBillingModalOpen(false);
        } catch (error) {
            toast.error('Erro ao processar faturamento.');
        } finally {
            setBillingGenerationStatus('idle');
        }
    };

    const handleImpersonate = async (clinicId: string) => {
        try {
            toast.loading('Acessando painel da clínica...', { id: 'impersonate' });
            const response = await saasApi.impersonateClinic(clinicId);
            const { token } = response.data;

            // Set the new token
            localStorage.setItem('heath_finance_token', token);

            // Força reload completo para resetar estados e aplicar o novo token em todas as instâncias da API e Contexto
            toast.success(`Acessando como administrador da clínica...`, { id: 'impersonate' });
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);

        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao tentar acessar a clínica.', { id: 'impersonate' });
        }
    };

    // User Management Functions
    const handleOpenUserManagement = (userItem: any) => {
        setSelectedUser({ ...userItem });
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
            toast.error('Erro ao atualizar status do lead');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData('leadId', leadId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        if (leadId) {
            // Atualização otimista
            setLeads(prevLeads => prevLeads.map(l => l.id === leadId ? { ...l, status: targetStatus } : l));
            await handleUpdateLeadStatus(leadId, targetStatus);
        }
    };

    const handleUpdateLeadNotes = async (leadId: string, notes: string) => {
        try {
            await leadsApi.updateNotes(leadId, notes);
            fetchData(); // atualiza a lista por tras
        } catch (error) {
            toast.error('Erro ao salvar anotações.');
        }
    };

    const handleDownloadInvoice = async (clinicId: string, clinicName: string) => {
        try {
            toast.loading('Gerando PDF...', { id: 'download-pdf' });
            const response = await saasApi.downloadInvoicePDF(clinicId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fatura-${clinicName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF baixado com sucesso!', { id: 'download-pdf' });
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            toast.error('Erro ao gerar PDF da fatura.', { id: 'download-pdf' });
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'NOVO': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'EM_CONTATO': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'DEMONSTRACAO': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'FECHADO': return 'bg-green-100 text-green-700 border-green-200';
            case 'PERDIDO': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };


    return (
        <div className="flex h-screen bg-gray-50 text-[#1A202C] overflow-hidden animate-in fade-in duration-700">
            {/* Sidebar Fixa (Esquerda) */}
            <div className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-white border-r border-gray-200 flex-shrink-0 flex flex-col justify-between z-10 transition-all duration-300 ease-in-out relative relative`}>

                {/* Toggle Seta */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-8 bg-white border border-[#8A9A5B]/30 rounded-full p-1.5 text-[#697D58] hover:bg-[#8A9A5B] hover:text-white transition-all shadow-md z-20"
                >
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                <div>
                    <div className={`p-6 border-b border-[#8A9A5B]/10 transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden py-0 border-0'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-[#8A9A5B] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">Admin Global</span>
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#1A202C]">
                            Rares360 <span className="text-[#8A9A5B]">HQ</span>
                        </h1>
                        <p className="text-slate-400 font-bold text-[10px] mt-1 tracking-widest uppercase">{user?.name}</p>
                    </div>
                    {/* Logo ícone qdo fechado */}
                    {!isSidebarOpen && (
                        <div className="p-6 flex justify-center border-b border-[#8A9A5B]/10">
                            <LayoutDashboard size={24} className="text-[#697D58]" />
                        </div>
                    )}

                    <nav className="p-4 space-y-6 mt-2 overflow-y-auto custom-scrollbar">
                        {[
                            {
                                label: 'PLATAFORMA', items: [
                                    { id: 'dashboard', icon: <LayoutDashboard size={isSidebarOpen ? 18 : 22} />, label: 'Dashboard Home' },
                                    { id: 'clinics', icon: <Building2 size={isSidebarOpen ? 18 : 22} />, label: 'Clínicas' },
                                    { id: 'users', icon: <Users size={isSidebarOpen ? 18 : 22} />, label: 'Usuários' }
                                ]
                            },
                            {
                                label: 'FINANCEIRO', items: [
                                    { id: 'billing', icon: <CreditCard size={isSidebarOpen ? 18 : 22} />, label: 'Faturamento SaaS' },
                                    { id: 'reports', icon: <FileDown size={isSidebarOpen ? 18 : 22} />, label: 'Relatórios' }
                                ]
                            },
                            {
                                label: 'COMERCIAL', items: [
                                    { id: 'leads', icon: <MessageSquare size={isSidebarOpen ? 18 : 22} />, label: 'Pipeline de Leads' }
                                ]
                            },
                            {
                                label: 'SISTEMA', items: [
                                    { id: 'settings', icon: <Settings size={isSidebarOpen ? 18 : 22} />, label: 'Configurações' },
                                    { id: 'audit', icon: <Cpu size={isSidebarOpen ? 18 : 22} />, label: 'Logs de Auditoria' },
                                    { id: 'security', icon: <LockIcon size={isSidebarOpen ? 18 : 22} />, label: 'Segurança' }
                                ]
                            }
                        ].map((group) => (
                            <div key={group.label} className="space-y-1">
                                {isSidebarOpen && (
                                    <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] mb-2">{group.label}</h3>
                                )}
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as any)}
                                        className={`w-full flex items-center ${isSidebarOpen ? 'justify-start gap-3 px-4' : 'justify-center px-0'} py-2.5 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-[#8A9A5B] text-white shadow-md shadow-[#8A9A5B]/20 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-[#697D58] font-medium'}`}
                                        title={!isSidebarOpen ? item.label : ''}
                                    >
                                        {item.icon}
                                        {isSidebarOpen && <span className="text-sm tracking-wide font-bold">{item.label}</span>}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="p-4">
                    <div className={`bg-[#697D58] text-white shadow-xl relative overflow-hidden transition-all duration-300 flex items-center ${isSidebarOpen ? 'p-4 rounded-xl gap-3' : 'p-3 rounded-xl justify-center flex-col gap-1'}`}>
                        <div className={`absolute top-0 right-0 p-4 opacity-10 transition-opacity ${!isSidebarOpen && 'hidden'}`}>
                            <LayoutDashboard size={40} />
                        </div>

                        <div className={isSidebarOpen ? 'relative z-10' : 'hidden'}>
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-0.5">Total Ativo</p>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-black leading-none">
                                    {activeTab === 'clinics' ? clinics.length : activeTab === 'users' ? users.length : activeTab === 'billing' ? billingData.length : activeTab === 'leads' ? leads.length : 0}
                                </span>
                            </div>
                        </div>

                        {!isSidebarOpen && (
                            <>
                                <span className="text-[8px] uppercase tracking-widest font-black text-white/70">Total</span>
                                <span className="text-xl font-black leading-none relative z-10">
                                    {activeTab === 'clinics' ? clinics.length : activeTab === 'users' ? users.length : activeTab === 'billing' ? billingData.length : activeTab === 'leads' ? leads.length : 0}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area (Direita) */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header Topo */}
                <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 z-10 shadow-sm">
                    <h2 className="text-3xl font-extrabold text-[#697D58] tracking-tight">
                        {activeTab === 'dashboard' ? 'Visão Geral da Plataforma' : activeTab === 'clinics' ? 'Gestão de Clínicas' : activeTab === 'users' ? 'Usuários Globais' : activeTab === 'billing' ? 'Faturamento SaaS' : activeTab === 'leads' ? 'Pipeline de Leads' : 'Configurações'}
                    </h2>

                    <div className="flex items-center gap-4 hover:bg-white/60 p-2 pr-5 rounded-[2rem] transition-all cursor-pointer border border-transparent hover:border-[#8A9A5B]/20 shadow-sm" onClick={logout}>
                        <div className="w-10 h-10 rounded-full bg-white flex flex-col justify-center items-center text-[#DEB587] font-black shadow-sm border border-[#DEB587]/30">
                            {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-extrabold text-[#1A202C] leading-tight">{user?.name}</p>
                            <p className="text-[10px] uppercase tracking-widest text-[#8A9A5B] font-bold">Sair da Conta</p>
                        </div>
                    </div>
                </header>

                {/* Sub-Header / Scrollable Area */}
                <div className="flex-1 overflow-auto p-6 md:p-10 relative space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9A5B]" size={18} />
                                <input
                                    type="text"
                                    placeholder={`Buscar ${activeTab === 'clinics' ? 'clínica' : activeTab === 'users' ? 'usuário' : activeTab === 'leads' ? 'lead' : 'fatura'}...`}
                                    className="bg-white border border-[#8A9A5B]/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 w-64 text-sm font-medium shadow-sm transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={fetchData}
                                disabled={isLoading}
                                className="p-3 bg-white border border-[#8A9A5B]/10 rounded-2xl text-[#8A9A5B] hover:bg-[#8A9A5B]/5 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                title="Atualizar dados"
                            >
                                <motion.div
                                    animate={isLoading ? { rotate: 360 } : {}}
                                    transition={isLoading ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}
                                >
                                    <Plus className={`transform ${isLoading ? '' : 'rotate-45'}`} size={20} />
                                </motion.div>
                            </button>
                        </div>
                        {activeTab === 'clinics' && (
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner gap-2 flex-wrap items-center animate-in fade-in slide-in-from-right-4 duration-300">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#697D58] ml-2 flex items-center gap-1">
                                    <Search size={12} /> Filtros:
                                </span>
                                <select
                                    className="bg-white border border-[#8A9A5B]/10 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all appearance-none cursor-pointer"
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="Todos">Status: Todos</option>
                                    <option value="Ativos">Ativos</option>
                                    <option value="Inativos">Inativos</option>
                                </select>
                                <select
                                    className="bg-white border border-[#8A9A5B]/10 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 transition-all appearance-none cursor-pointer"
                                    value={planFilter}
                                    onChange={e => setPlanFilter(e.target.value)}
                                >
                                    <option value="Todos">Plano: Todos</option>
                                    <option value="Essencial">Essencial</option>
                                    <option value="Profissional">Profissional</option>
                                    <option value="Excellence">Excellence</option>
                                </select>

                                <div className="text-[10px] font-black text-white bg-[#697D58] px-2 py-1.5 rounded-xl ml-auto mr-2">
                                    {clinics.filter(item => {
                                        const matchesStatus = statusFilter === 'Todos' || (statusFilter === 'Ativos' && item.isActive) || (statusFilter === 'Inativos' && !item.isActive);
                                        const matchesPlan = planFilter === 'Todos' || (item.plan || 'Essencial') === planFilter;
                                        return matchesStatus && matchesPlan;
                                    }).length} Resultados
                                </div>

                                {(statusFilter !== 'Todos' || planFilter !== 'Todos' || searchTerm !== '') && (
                                    <button
                                        onClick={() => { setStatusFilter('Todos'); setPlanFilter('Todos'); setSearchTerm(''); }}
                                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-xl transition-all flex items-center gap-1 border border-red-100"
                                    >
                                        <XIcon size={12} /> Limpar
                                    </button>
                                )}
                            </div>
                        )}
                        {activeTab === 'leads' && (
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-[#697D58]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Kanban
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#697D58]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Lista
                                </button>
                            </div>
                        )}
                        {activeTab === 'billing' && (
                            <button
                                onClick={handleGenerateBilling}
                                disabled={isSubmitting}
                                className="bg-[#697D58] hover:scale-[1.02] active:scale-95 text-white p-4 rounded-2xl shadow-xl shadow-[#697D58]/20 transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest disabled:opacity-50"
                            >
                                <Settings size={20} /> Processar Motor Faturas
                            </button>
                        )}
                        {activeTab !== 'billing' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#8A9A5B] hover:scale-[1.02] active:scale-95 text-white p-4 rounded-2xl shadow-xl shadow-[#8A9A5B]/20 transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                            >
                                <Plus size={20} /> Novo {activeTab === 'clinics' ? 'Clínica' : activeTab === 'users' ? 'Usuário' : 'Lead'}
                            </button>
                        )}
                    </div>

                    {activeTab === 'dashboard' ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Card MRR */}
                            <div className="bg-gradient-to-br from-[#697D58] to-[#3B6D11] p-6 rounded-3xl shadow-xl shadow-[#697D58]/20 text-white relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">MRR Total Estimado</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-extrabold leading-none">
                                        R$ {billingData.reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/80">
                                    <TrendingUp size={14} /> Faturamento recorrente
                                </div>
                            </div>

                            {/* Card Clínicas */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#8A9A5B]/10 hover:shadow-lg transition-shadow">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Clínicas Ativas</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-extrabold text-[#1A202C]">{clinics.length}</span>
                                    <div className="w-10 h-10 rounded-xl bg-[#8A9A5B]/10 flex items-center justify-center text-[#697D58]">
                                        <Building2 size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Card Usuários */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#8A9A5B]/10 hover:shadow-lg transition-shadow">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total de Usuários</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-extrabold text-[#1A202C]">{users.length}</span>
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Users size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Card Leads */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#8A9A5B]/10 hover:shadow-lg transition-shadow">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Leads em Pipeline</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-extrabold text-[#1A202C]">{leads.length}</span>
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                        <MessageSquare size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'leads' && viewMode === 'kanban' ? (
                        <div className="flex pb-4 gap-6 min-h-[600px] h-[calc(100vh-250px)] overflow-x-auto items-start w-full">
                            {[
                                { id: 'NOVO', title: 'Novo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                { id: 'EM_CONTATO', title: 'Em Contato', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                                { id: 'DEMONSTRACAO', title: 'Diagnóstico Realizado', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                                { id: 'FECHADO', title: 'Fechado', color: 'bg-green-100 text-green-700 border-green-200' }
                            ].map(col => {
                                const colLeads = leads
                                    .filter(l => l.status === col.id)
                                    .filter(item =>
                                        !searchTerm ||
                                        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        item.whatsapp?.includes(searchTerm)
                                    );

                                return (
                                    <div
                                        key={col.id}
                                        className="flex-1 min-w-[280px] bg-gray-200 rounded-lg p-4 flex flex-col h-full overflow-hidden border border-gray-300/50 shadow-sm"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, col.id)}
                                    >
                                        <div className="flex justify-between items-center mb-4 px-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-extrabold text-slate-700 uppercase tracking-widest text-sm">{col.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${col.color}`}>
                                                    {colLeads.length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-10">
                                            {colLeads.map(lead => (
                                                <div
                                                    key={lead.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, lead.id)}
                                                    className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100 cursor-grab active:cursor-grabbing group"
                                                    onClick={(e) => {
                                                        // avoid opening drawer if clicked on specific buttons
                                                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                                                        setSelectedLead(lead);
                                                        setIsDiagnosticModalOpen(true);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex gap-3 items-center">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-[#8A9A5B]/20 flex items-center justify-center text-[#697D58] font-black text-xs">
                                                                {lead.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-extrabold text-[#1A202C] leading-tight">{lead.name}</h4>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{lead.diagnostic?.clinicType || lead.subject || 'Lead Rares360'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 mb-4 text-xs">
                                                        <div className="space-y-0.5">
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Contato</span>
                                                            <span className="font-bold text-slate-700 break-all">{lead.email}</span>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Interação</span>
                                                            <span className="font-bold text-slate-700">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="space-y-0.5 col-span-2">
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Score</span>
                                                            <div className={`px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${lead.score >= 80 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                                <Star size={10} className={lead.score >= 80 ? 'fill-orange-500' : ''} />
                                                                <span className="text-[10px] font-black">{lead.score} / 100</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                                        <a
                                                            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}?text=Olá ${lead.name}, tudo bem? Sou consultor da Rares360.`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white rounded-lg hover:scale-105 transition-all shadow-md shadow-[#25D366]/20 font-black text-[10px] uppercase tracking-widest"
                                                        >
                                                            <Phone size={12} /> WhatsApp
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                            {colLeads.length === 0 && (
                                                <div className="py-8 text-center text-slate-400 font-medium text-xs border-2 border-dashed border-slate-200 rounded-2xl">
                                                    Arraste leads para cá
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
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
                                                {activeTab === 'clinics' ? 'CNPJ' : activeTab === 'users' ? 'E-mail' : activeTab === 'leads' ? 'Contato' : 'Status / Setup'}
                                            </th>
                                            {activeTab === 'clinics' && (
                                                <>
                                                    <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">Plano</th>
                                                    <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">MRR</th>
                                                    <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">Setup</th>
                                                    <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">Usuários Ativos</th>
                                                </>
                                            )}
                                            <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest">
                                                {activeTab === 'clinics' ? 'Status' : activeTab === 'users' ? 'Role' : activeTab === 'leads' ? 'Score' : 'Mensalidade Vl.'}
                                            </th>
                                            <th className="p-6 text-xs font-black text-[#697D58] uppercase tracking-widest text-right">
                                                {activeTab === 'billing' ? 'Total & Detalhamento' : activeTab === 'leads' ? 'Status e Ações' : 'Ações'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {(activeTab === 'clinics' ? clinics : activeTab === 'users' ? users : activeTab === 'billing' ? billingData : leads)
                                                .filter(item =>
                                                    !searchTerm ||
                                                    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    item.cnpj?.includes(searchTerm) ||
                                                    item.whatsapp?.includes(searchTerm)
                                                )
                                                .filter((item: any) => {
                                                    if (activeTab !== 'clinics') return true;
                                                    const matchesStatus = statusFilter === 'Todos' || (statusFilter === 'Ativos' && item.isActive) || (statusFilter === 'Inativos' && !item.isActive);
                                                    const matchesPlan = planFilter === 'Todos' || (item.plan || 'Essencial') === planFilter;
                                                    return matchesStatus && matchesPlan;
                                                })
                                                .map((item: any) => {

                                                    // Renovation Alert Logic
                                                    let isExpiring = false;
                                                    if (activeTab === 'billing' && item.contractStartDate && item.contractDurationMonths) {
                                                        const start = new Date(item.contractStartDate).getTime();
                                                        const now = new Date().getTime();
                                                        const diffMonths = (now - start) / (1000 * 60 * 60 * 24 * 30);
                                                        isExpiring = diffMonths >= (item.contractDurationMonths - 1);
                                                    }

                                                    return (
                                                        <React.Fragment key={item.id}>
                                                            <motion.tr
                                                                onClick={() => activeTab === 'billing' && handleToggleInvoices(item.id)}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className={`border-b border-[#8A9A5B]/5 transition-colors group ${isExpiring ? 'bg-yellow-50 hover:bg-yellow-100' : ''} ${activeTab === 'billing' ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-white'}`}
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
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="font-extrabold flex items-center gap-2">{item.name}</p>
                                                                                {activeTab === 'billing' && (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleOpenContractModal(item); }}
                                                                                        className="p-1 rounded bg-[#8A9A5B]/10 text-[#697D58] hover:bg-[#8A9A5B] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                                                        title="Configurar Contrato e Valores"
                                                                                    >
                                                                                        <Edit3 size={12} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            {activeTab === 'leads' && (
                                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                                    {new Date(item.createdAt).toLocaleDateString()} às {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {activeTab === 'users' && (
                                                                        <div className="flex gap-2 mt-1">
                                                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{item.clinic?.name || 'Acesso Global'}</span>
                                                                            {item.mustChangePassword && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-black rounded uppercase tracking-widest border border-yellow-200">Senha Temp. Ativa</span>}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="p-6 text-slate-500 font-semibold text-sm">
                                                                    {activeTab === 'clinics' ? (item.cnpj || 'Não info') : activeTab === 'users' ? (
                                                                        <div>
                                                                            {item.email}
                                                                            {item.lastLoginAt && <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mt-1">Último Login: {new Date(item.lastLoginAt).toLocaleDateString()}</span>}
                                                                        </div>
                                                                    ) : activeTab === 'leads' ? (
                                                                        <div className="space-y-1">
                                                                            <p className="text-slate-800 font-bold flex items-center gap-2"><Mail size={12} /> {item.email}</p>
                                                                            <p className="text-[10px] flex items-center gap-2"><Phone size={12} /> {item.whatsapp}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-1 text-xs">
                                                                            <p className="font-bold text-slate-700">{item.userCount} usuários ativos</p>
                                                                            {isExpiring && <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded font-black uppercase text-[9px] tracking-widest">Atenção: Renovação &lt; 30d</span>}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                {activeTab === 'clinics' && (
                                                                    <>
                                                                        <td className="p-6">
                                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-tight uppercase border transition-all shadow-sm ${(item.plan || 'Essencial') === 'Essencial' ? 'bg-[#D3D1C7]/30 text-[#5F5E5A] border-[#D3D1C7]/50' :
                                                                                (item.plan || 'Essencial') === 'Profissional' ? 'bg-[#B5D4F4]/50 text-[#185FA5] border-[#B5D4F4]/70' :
                                                                                    'bg-[#FAC775]/50 text-[#854F0B] border-[#FAC775]/70'
                                                                                }`}>
                                                                                {item.plan || 'Essencial'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-6">
                                                                            <span className="font-extrabold text-[#3B6D11] bg-[#3B6D11]/10 px-2 py-1 rounded-lg">
                                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.monthlyFee || item.pricePerUser || 0)}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-6">
                                                                            <span className="font-extrabold text-[#697D58] bg-[#697D58]/10 px-2 py-1 rounded-lg">
                                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.implementationFee || 0)}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-6">
                                                                            <div
                                                                                className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl w-fit cursor-pointer hover:bg-blue-100 hover:scale-105 transition-all shadow-sm group/users"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSearchTerm(item.name.substring(0, 5));
                                                                                    setActiveTab('users');
                                                                                }}
                                                                                title="Filtrar Usuários dessa Clínica"
                                                                            >
                                                                                <Users size={14} className="group-hover/users:rotate-12 transition-transform" />
                                                                                <span className="font-bold text-xs">{item._count?.users || 0} usuários</span>
                                                                            </div>
                                                                        </td>
                                                                    </>
                                                                )}
                                                                <td className="p-6">
                                                                    {activeTab === 'billing' ? (
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[#1A202C] font-bold">R$ {item.pricePerUser?.toFixed(2)} / mês</span>
                                                                        </div>
                                                                    ) : activeTab === 'leads' ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${item.score >= 80 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                                                <Star size={12} className={item.score >= 80 ? 'fill-orange-500' : ''} />
                                                                                <span className="text-xs font-black">{item.score}</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-tight uppercase border flex items-center gap-2 w-fit ${activeTab === 'clinics' ? (item.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200') : item.role === 'ADMIN_GLOBAL' ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' : 'bg-[#DEB587]/10 text-[#697D58] border-[#DEB587]/20 shadow-sm'}`}>
                                                                            {activeTab === 'clinics' ? (
                                                                                <>
                                                                                    <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${item.isActive ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-red-500'}`}></div>
                                                                                    {item.isActive ? 'Ativo' : 'Inativo'}
                                                                                </>
                                                                            ) : item.role}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-6">
                                                                    {activeTab === 'billing' ? (
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-extrabold text-[#697D58]">R$ {item.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                                                {item.invoices && item.invoices.length > 0 ? (
                                                                                    <div className="flex flex-col mt-1 gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                                                        {item.invoices.map((inv: any) => (
                                                                                            <span key={inv.id} className="text-[#8A9A5B]">
                                                                                                [{inv.type}] {inv.description}: R$ {inv.totalAmount.toFixed(2)}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">S/ Faturas Pendentes</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDownloadInvoice(item.id, item.name);
                                                                                    }}
                                                                                    className="p-2 bg-[#697D58] hover:scale-105 rounded-xl transition-all flex items-center gap-1 text-[10px] font-bold shadow-md shadow-[#697D58]/20"
                                                                                >
                                                                                    <FileDown size={14} /> Fatura OnTheFly
                                                                                </button>
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
                                                                                <option value="DEMONSTRACAO">Demonstração</option>
                                                                                <option value="FECHADO">Fechado</option>
                                                                                <option value="PERDIDO">Perdido</option>
                                                                            </select>
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setSelectedLead(item);
                                                                                        setIsDiagnosticModalOpen(true);
                                                                                    }}
                                                                                    className="p-2 bg-[#8A9A5B]/10 text-[#697D58] rounded-lg hover:bg-[#8A9A5B] hover:text-white transition-all shadow-sm"
                                                                                    title="Ver Diagnóstico"
                                                                                >
                                                                                    <Search size={16} />
                                                                                </button>
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
                                                                            {activeTab === 'clinics' ? (
                                                                                <>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleImpersonate(item.id);
                                                                                        }}
                                                                                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 border border-blue-100 rounded-xl text-blue-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm group/imp"
                                                                                        title="Acessar como Administrador da Clínica"
                                                                                    >
                                                                                        <LayoutDashboard size={14} className="group-hover/imp:scale-110 transition-transform" /> Acessar
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setSelectedClinic(item);
                                                                                            setNewClinic({ ...newClinic, ...item });
                                                                                            setIsDrawerOpen(true);
                                                                                        }}
                                                                                        className="px-2.5 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                                                                                        title="Ações e Detalhamento da Clínica"
                                                                                    >
                                                                                        Configurar
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDeleteClinic(item.id, item.name);
                                                                                        }}
                                                                                        className="p-1.5 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl text-red-400 hover:text-red-600 transition-all shadow-sm"
                                                                                        title="Excluir Clínica"
                                                                                    >
                                                                                        <Trash2 size={16} />
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleOpenUserManagement(item);
                                                                                        }}
                                                                                        className="p-2 hover:bg-[#8A9A5B]/10 rounded-lg text-slate-400 hover:text-[#697D58] transition-all"
                                                                                        title="Configurações"
                                                                                    >
                                                                                        <Settings size={18} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDeleteUser(item.id, item.name);
                                                                                        }}
                                                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-500 transition-all"
                                                                                        title="Excluir Usuário"
                                                                                    >
                                                                                        <Trash2 size={18} />
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                </td>
                                                            </motion.tr>
                                                            {
                                                                activeTab === 'billing' && expandedClinics[item.id] && (
                                                                    <tr className="bg-slate-50/50 border-b border-[#8A9A5B]/10">
                                                                        <td colSpan={4} className="p-0">
                                                                            <motion.div
                                                                                initial={{ opacity: 0, height: 0 }}
                                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                                exit={{ opacity: 0, height: 0 }}
                                                                                className="p-6 border-l-4 border-l-[#8A9A5B]"
                                                                            >
                                                                                <div className="flex items-center justify-between mb-4">
                                                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#697D58]">Histórico de Faturas</h5>
                                                                                </div>
                                                                                {loadingInvoices[item.id] ? (
                                                                                    <div className="flex justify-center p-4">
                                                                                        <div className="w-6 h-6 border-2 border-[#8A9A5B]/20 border-t-[#8A9A5B] rounded-full animate-spin"></div>
                                                                                    </div>
                                                                                ) : expandedClinicInvoices[item.id]?.length > 0 ? (
                                                                                    <div className="space-y-2">
                                                                                        {expandedClinicInvoices[item.id].map(inv => (
                                                                                            <div key={inv.id} className="flex items-center justify-between p-3 bg-white border border-[#8A9A5B]/10 rounded-xl relative group/inv">
                                                                                                <div className="flex-1">
                                                                                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                                                                                        {inv.month.toString().padStart(2, '0')}/{inv.year} - {inv.description}
                                                                                                        {inv.type.includes('SETUP') && <span className="px-1.5 py-0.5 bg-[#8A9A5B]/10 text-[#697D58] rounded text-[8px] uppercase font-black">Inc. Setup</span>}
                                                                                                    </p>
                                                                                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                                                                                                        Criada em: {new Date(inv.createdAt).toLocaleDateString()} | Vencimento: {new Date(inv.dueDate).toLocaleDateString()}
                                                                                                    </p>
                                                                                                    {/* Tooltip Split Details */}
                                                                                                    <div className="absolute top-10 w-64 p-3 bg-[#1A202C] text-white rounded-xl shadow-xl z-10 opacity-0 group-hover/inv:opacity-100 transition-opacity pointer-events-none text-xs font-bold space-y-1">
                                                                                                        <div className="flex justify-between"><span>Mensalidade:</span><span>R$ {inv.saasAmount.toFixed(2)}</span></div>
                                                                                                        <div className="flex justify-between"><span>Setup:</span><span>R$ {inv.setupAmount.toFixed(2)}</span></div>
                                                                                                        <div className="border-t border-slate-700 my-1"></div>
                                                                                                        <div className="flex justify-between text-[#A0B071]"><span>Total:</span><span>R$ {inv.totalAmount.toFixed(2)}</span></div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-6">
                                                                                                    <span className="font-black text-[#697D58]">R$ {inv.totalAmount.toFixed(2)}</span>
                                                                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.status === 'PAGO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                                                        {inv.status}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className="text-xs font-bold text-slate-400 text-center py-4 bg-white rounded-xl border border-dashed border-[#8A9A5B]/20">Nenhuma fatura encontrada no histórico.</p>
                                                                                )}
                                                                            </motion.div>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            }
                                                        </React.Fragment>
                                                    );
                                                })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
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
                                {activeTab === 'clinics' ? 'Configurar Nova Clínica' : activeTab === 'users' ? 'Cadastrar Novo Usuário' : 'Cadastrar Novo Lead'}
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
                                            { id: 6, label: 'Sistema' },
                                            { id: 7, label: 'Precificação' }
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

                                        {/* Section 7: Precificação */}
                                        {formSection === 7 && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <InputField label="Valor de Implementação" type="number" value={newClinic.implementationFee} onChange={(v: any) => setNewClinic({ ...newClinic, implementationFee: v })} />
                                                    <InputField label="Valor da Mensalidade" type="number" value={newClinic.monthlyFee} onChange={(v: any) => setNewClinic({ ...newClinic, monthlyFee: v })} />
                                                </div>

                                                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">Anexo da Proposta</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mb-3">PDF, Imagens ou Documentos da Proposta Comercial</p>

                                                    {newClinic.proposalUrl ? (
                                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#8A9A5B]/20 mb-3">
                                                            <div className="w-10 h-10 bg-[#8A9A5B]/10 rounded-lg flex items-center justify-center text-[#8A9A5B]">
                                                                <Plus size={20} className="rotate-45" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="text-xs font-bold truncate">Proposta Anexada</p>
                                                                <a href={newClinic.proposalUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#8A9A5B] font-black uppercase tracking-widest hover:underline">Visualizar Arquivo</a>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewClinic({ ...newClinic, proposalUrl: '' })}
                                                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-[#697D58] uppercase tracking-widest cursor-pointer hover:bg-[#8A9A5B]/5 hover:border-[#8A9A5B]/30 transition-all">
                                                            <Upload size={14} className="mr-2" /> Anexar Proposta
                                                            <input type="file" className="hidden" onChange={(e) => handleProposalUpload(e, true)} />
                                                        </label>
                                                    )}
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
                                        {formSection < 7 ? (
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
                            ) : activeTab === 'users' ? (
                                <form onSubmit={handleCreateUser} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Nome Completo" required value={newUser.name} onChange={(v: any) => setNewUser({ ...newUser, name: v })} />
                                        <InputField label="E-mail de Acesso" required type="email" value={newUser.email} onChange={(v: any) => setNewUser({ ...newUser, email: v })} />
                                        <InputField label="Senha Inicial" required type="password" value={newUser.password} onChange={(v: any) => setNewUser({ ...newUser, password: v })} />
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#697D58] ml-2 block">Papel do Usuário (Role)</label>
                                            <select
                                                className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold text-sm appearance-none"
                                                value={newUser.role}
                                                onChange={e => {
                                                    const newRole = e.target.value;
                                                    setNewUser({
                                                        ...newUser,
                                                        role: newRole,
                                                        // Se for Admin Global, limpa a clínica obrigatoriamente
                                                        clinicId: newRole === 'ADMIN_GLOBAL' ? '' : newUser.clinicId
                                                    });
                                                }}
                                            >
                                                <option value="CLINIC_ADMIN">Administrador da Clínica</option>
                                                <option value="ADMIN_GLOBAL">Administrador Global (Acesso Total)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#697D58] ml-2 block">Vincular Clínica</label>
                                            <select
                                                className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-bold text-sm appearance-none"
                                                disabled={newUser.role === 'ADMIN_GLOBAL'}
                                                value={newUser.clinicId}
                                                onChange={e => setNewUser({ ...newUser, clinicId: e.target.value })}
                                            >
                                                <option value="">{newUser.role === 'ADMIN_GLOBAL' ? 'Acesso Global' : 'Selecione uma Clínica...'}</option>
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
                            ) : activeTab === 'leads' ? (
                                <form onSubmit={handleCreateLead} className="space-y-6">
                                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-8 custom-scrollbar">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Informações de Contato</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField label="Nome do Lead / Empresa" required value={newLead.name} onChange={(v: any) => setNewLead({ ...newLead, name: v })} />
                                                <InputField label="E-mail" required type="email" value={newLead.email} onChange={(v: any) => setNewLead({ ...newLead, email: v })} />
                                                <InputField label="WhatsApp" required value={newLead.whatsapp} onChange={(v: any) => setNewLead({ ...newLead, whatsapp: v })} />
                                                <InputField label="Assunto/Motivo" required value={newLead.subject} onChange={(v: any) => setNewLead({ ...newLead, subject: v })} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Sobre a Clínica</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <SelectField label="Tipo de Clínica" value={newLead.diagnostic.clinicType} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, clinicType: v } })} options={[
                                                    { label: 'Estética', value: 'Estética' },
                                                    { label: 'Odontologia', value: 'Odontologia' },
                                                    { label: 'Dermatologia', value: 'Dermatologia' },
                                                    { label: 'Outro', value: 'Outro' }
                                                ]} />
                                                <InputField label="Tempo de Operação" value={newLead.diagnostic.operationTime} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, operationTime: v } })} placeholder="Ex: 5 anos" />
                                                <InputField label="Nº de Profissionais" value={newLead.diagnostic.professionalsCount} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, professionalsCount: v } })} />
                                            </div>
                                            <InputField label="Principal Desafio" value={newLead.diagnostic.mainChallenge} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, mainChallenge: v } })} placeholder="Qual o maior problema hoje?" />
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Gestão Financeira</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <SelectField label="Faturamento Mensal" value={newLead.diagnostic.monthlyRevenue} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, monthlyRevenue: v } })} options={[
                                                    { label: 'Até R$ 30k', value: 'Até R$ 30k' },
                                                    { label: 'R$ 30k - R$ 100k', value: 'R$ 30k - R$ 100k' },
                                                    { label: 'Acima de R$ 100k', value: 'Acima de R$ 100k' }
                                                ]} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <SelectField label="Possui DRE?" value={newLead.diagnostic.hasDRE} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, hasDRE: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                    <SelectField label="Possui DFC?" value={newLead.diagnostic.hasDFC} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, hasDFC: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                </div>
                                                <SelectField label="Custos Organizados?" value={newLead.diagnostic.organizedCosts} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, organizedCosts: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                <SelectField label="Sabe a Margem?" value={newLead.diagnostic.knowsMargin} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, knowsMargin: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                <SelectField label="Meta de Faturamento?" value={newLead.diagnostic.knowsRevenueGoal} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, knowsRevenueGoal: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                <SelectField label="Destaque: Proc. Alta Margem" value={newLead.diagnostic.knowsHighMarginProcedures} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, knowsHighMarginProcedures: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Operação e Controle</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <SelectField label="Controla Leads?" value={newLead.diagnostic.knowsMonthlyLeads} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, knowsMonthlyLeads: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                <SelectField label="Monitora Conversão?" value={newLead.diagnostic.monitorsConversion} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, monitorsConversion: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                <SelectField label="Follow-up Estruturado?" value={newLead.diagnostic.structuredFollowUp} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, structuredFollowUp: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                <SelectField label="Estoque Confiável?" value={newLead.diagnostic.reliableInventory} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, reliableInventory: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                <SelectField label="Custo de Insumos?" value={newLead.diagnostic.knowsSupplyCosts} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, knowsSupplyCosts: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                                <SelectField label="Controle de Retorno?" value={newLead.diagnostic.patientReturnControl} onChange={(v: any) => setNewLead({ ...newLead, diagnostic: { ...newLead.diagnostic, patientReturnControl: v } })} options={[{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]} />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-[#8A9A5B] text-white rounded-2xl font-black mt-6 shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'CRIANDO...' : 'CRIAR LEAD COMPLETO'}
                                    </button>
                                </form>
                            ) : null}
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
                                {['perfil', 'precificacao', 'acesso', 'usuarios'].map((tab: any) => (
                                    <button
                                        key={tab}
                                        onClick={() => setManagementTab(tab)}
                                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${managementTab === tab ? 'text-[#697D58] border-b-2 border-[#697D58] bg-[#697D58]/5' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {tab === 'precificacao' ? 'precificação' : tab}
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
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {managementTab === 'precificacao' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Configurações de Mensalidade</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField label="Valor da Mensalidade (R$)" type="number" value={selectedClinic.monthlyFee ?? 0} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, monthlyFee: parseFloat(v) })} />
                                                <InputField label="Valor Padrão P/ Usuário Extra (R$)" type="number" value={selectedClinic.pricePerUser ?? 0} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, pricePerUser: parseFloat(v) })} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Vigência de Contrato</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <InputField label="Data Inicial do Contrato" type="date" value={selectedClinic.contractStartDate ? new Date(selectedClinic.contractStartDate).toISOString().split('T')[0] : ''} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, contractStartDate: v })} />
                                                <InputField label="Duração (Meses)" type="number" value={selectedClinic.contractDurationMonths ?? 12} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, contractDurationMonths: parseInt(v) })} />
                                                <SelectField
                                                    label="Status do Contrato"
                                                    value={selectedClinic.contractStatus || 'ATIVO'}
                                                    onChange={(v: any) => setSelectedClinic({ ...selectedClinic, contractStatus: v })}
                                                    options={[
                                                        { label: 'Ativo', value: 'ATIVO' },
                                                        { label: 'Em Renovação / Alerta', value: 'RENOVAÇÃO' },
                                                        { label: 'Encerrado', value: 'ENCERRADO' }
                                                    ]}
                                                />
                                            </div>
                                            {/* Progress Bar Visual de Contrato */}
                                            {selectedClinic.contractStartDate && selectedClinic.contractDurationMonths && (
                                                <div className="mt-4 p-4 bg-slate-50 border border-[#8A9A5B]/10 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
                                                    {(() => {
                                                        const start = new Date(selectedClinic.contractStartDate).getTime();
                                                        const now = new Date().getTime();
                                                        const monthsPassed = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30));
                                                        const pct = Math.min(100, Math.max(0, (monthsPassed / selectedClinic.contractDurationMonths) * 100));
                                                        return (
                                                            <>
                                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#697D58]">
                                                                    <span>Mês {Math.min(monthsPassed, selectedClinic.contractDurationMonths)}</span>
                                                                    <span>Mês {selectedClinic.contractDurationMonths}</span>
                                                                </div>
                                                                <div className="w-full h-2 rounded-full bg-slate-200">
                                                                    <div className={`h-full rounded-full ${pct > 90 ? 'bg-yellow-400' : 'bg-[#697D58]'}`} style={{ width: `${pct}%` }}></div>
                                                                </div>
                                                                {pct > 90 && <p className="text-[9px] text-yellow-600 font-bold mt-1 text-center uppercase tracking-widest">Contrato próximo do vencimento</p>}
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Taxa de Implementação (Setup)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputField label="Valor Total de Setup (R$)" type="number" value={selectedClinic.setupValue ?? (selectedClinic.implementationFee ?? 0)} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, setupValue: parseFloat(v), implementationFee: parseFloat(v) })} />
                                                <SelectField
                                                    label="Tipo de Pagamento"
                                                    value={selectedClinic.setupPaymentType || 'DILUIDO_NA_MENSALIDADE'}
                                                    onChange={(v: any) => setSelectedClinic({ ...selectedClinic, setupPaymentType: v })}
                                                    options={[
                                                        { label: 'Diluído na Mensalidade (Fatura Única)', value: 'DILUIDO_NA_MENSALIDADE' },
                                                        { label: 'Parcelado Separado (2 Faturas)', value: 'PARCELADO_SEPARADO' }
                                                    ]}
                                                />
                                                <InputField label="Nº de Parcelas Setup" type="number" value={selectedClinic.setupInstallments ?? 1} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, setupInstallments: parseInt(v) })} />
                                                <InputField label="Parcelas Restantes a Cobrar" type="number" value={selectedClinic.setupRemainingInstallments ?? 0} onChange={(v: any) => setSelectedClinic({ ...selectedClinic, setupRemainingInstallments: parseInt(v) })} />
                                            </div>
                                            {(selectedClinic.setupRemainingInstallments || 0) > 0 && selectedClinic.setupValue && selectedClinic.setupInstallments && (
                                                <p className="text-xs text-slate-500 font-bold bg-slate-100 p-3 rounded-lg border border-slate-200">
                                                    Restam <span className="text-[#8A9A5B] font-black">{selectedClinic.setupRemainingInstallments}x</span> parcelas de <span className="text-[#8A9A5B] font-black">R$ {(selectedClinic.setupValue / selectedClinic.setupInstallments).toFixed(2)}</span> para faturar como Setup.
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Proposta Comercial Anexada</h4>
                                            <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                {selectedClinic.proposalUrl ? (
                                                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#8A9A5B]/20">
                                                        <div className="w-12 h-12 bg-[#8A9A5B]/10 rounded-xl flex items-center justify-center text-[#8A9A5B]">
                                                            <Plus size={24} className="rotate-45" />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-xs font-black text-slate-700 truncate">Proposta Anexada</p>
                                                            <div className="flex gap-3 mt-1">
                                                                <a href={selectedClinic.proposalUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#8A9A5B] font-black uppercase tracking-widest hover:underline">Ver Proposta</a>
                                                                <button onClick={() => setSelectedClinic({ ...selectedClinic, proposalUrl: '' })} className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:underline">Remover</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <label className="cursor-pointer flex flex-col items-center group">
                                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-300 group-hover:text-[#8A9A5B] transition-colors mb-4">
                                                                <Upload size={24} />
                                                            </div>
                                                            <p className="text-[10px] font-black text-[#697D58] uppercase tracking-widest">Anexar Proposta Comercial</p>
                                                            <input type="file" className="hidden" onChange={(e) => handleProposalUpload(e, false)} />
                                                        </label>
                                                    </div>
                                                )}
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

                            {(managementTab === 'perfil' || managementTab === 'precificacao') && (
                                <div className="p-6 border-t border-[#8A9A5B]/10 flex-shrink-0 bg-slate-50 mt-4 rounded-b-[32px]">
                                    <button
                                        onClick={handleSaveClinicProfile}
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-[#697D58] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Salvando...' : 'Salvar Todas as Configurações'}
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

            {/* Modal de Diagnóstico do Lead */}
            <AnimatePresence>
                {isDiagnosticModalOpen && selectedLead && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsDiagnosticModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="bg-[#697D58] p-8 text-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <MessageSquare className="text-white" size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">Diagnóstico Completo</h2>
                                        <p className="text-[#F0EAD6]/80 text-sm font-medium mt-0.5">Lead: {selectedLead.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDiagnosticModalOpen(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-md"
                                >
                                    <XIcon size={24} />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto space-y-8 bg-slate-50">
                                {/* Informações de Contato */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail</p>
                                        <p className="text-sm font-bold text-slate-700 break-all">{selectedLead.email}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                                        <p className="text-sm font-bold text-slate-700">{selectedLead.whatsapp}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                                        <div className="flex items-center gap-2">
                                            <Star size={14} className={selectedLead.score >= 80 ? 'text-orange-500 fill-orange-500' : 'text-slate-400'} />
                                            <p className="text-sm font-black text-slate-700">{selectedLead.score} pontos</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedLead.diagnostic ? (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-[#697D58] uppercase tracking-[0.2em] border-b border-[#8A9A5B]/10 pb-2">Respostas do Diagnóstico</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                <DiagnosticItem label="Tipo de Clínica" value={selectedLead.diagnostic.clinicType} />
                                                <DiagnosticItem label="Tempo de Operação" value={selectedLead.diagnostic.operationTime} />
                                                <DiagnosticItem label="Nº de Profissionais" value={selectedLead.diagnostic.professionalsCount} />
                                                <DiagnosticItem label="Principal Desafio" value={selectedLead.diagnostic.mainChallenge} />
                                                <DiagnosticItem label="Faturamento Mensal" value={selectedLead.diagnostic.monthlyRevenue} />
                                                <DiagnosticItem label="Possui DRE?" value={selectedLead.diagnostic.hasDRE} />
                                                <DiagnosticItem label="Possui DFC?" value={selectedLead.diagnostic.hasDFC} />
                                                <DiagnosticItem label="Custos Organizados?" value={selectedLead.diagnostic.organizedCosts} />
                                                <DiagnosticItem label="Sabe a Margem?" value={selectedLead.diagnostic.knowsMargin} />
                                                <DiagnosticItem label="Meta de Faturamento?" value={selectedLead.diagnostic.knowsRevenueGoal} />
                                                <DiagnosticItem label="Destaque: Proc. Alta Margem" value={selectedLead.diagnostic.knowsHighMarginProcedures} />
                                                <DiagnosticItem label="Identificou Margem Negativa?" value={selectedLead.diagnostic.identifiedNegativeMargin} />
                                                <DiagnosticItem label="Controle de Leads" value={selectedLead.diagnostic.knowsMonthlyLeads} />
                                                <DiagnosticItem label="Moniitara Conversão?" value={selectedLead.diagnostic.monitorsConversion} />
                                                <DiagnosticItem label="Follow-up Estruturado?" value={selectedLead.diagnostic.structuredFollowUp} />
                                                <DiagnosticItem label="Estoque Confiável?" value={selectedLead.diagnostic.reliableInventory} />
                                                <DiagnosticItem label="Custo de Insumos?" value={selectedLead.diagnostic.knowsSupplyCosts} />
                                                <DiagnosticItem label="Controle de Retorno?" value={selectedLead.diagnostic.patientReturnControl} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-[#697D58] uppercase tracking-[0.2em] border-b border-[#8A9A5B]/10 pb-2">Fatores de Precificação</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedLead.diagnostic.pricingFactors?.length > 0 ? (
                                                    selectedLead.diagnostic.pricingFactors.map((f: string) => (
                                                        <span key={f} className="px-3 py-1.5 bg-[#8A9A5B]/10 text-[#697D58] border border-[#8A9A5B]/20 rounded-lg text-[10px] font-black uppercase">
                                                            {f}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-bold">Nenhum fator selecionado</span>
                                                )}
                                            </div>
                                        </div>

                                        {selectedLead.message && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black text-[#697D58] uppercase tracking-[0.2em]">Observações do Lead</h4>
                                                <div className="p-4 bg-white rounded-2xl border border-slate-100 italic text-slate-600 font-medium text-sm">
                                                    "{selectedLead.message}"
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ) : (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                                            <MessageSquare size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Este lead não enviou dados de diagnóstico (formulário legado)</p>
                                        {selectedLead.message && (
                                            <div className="mt-6 text-left max-w-sm mx-auto space-y-2">
                                                <h4 className="text-xs font-black text-[#697D58] uppercase tracking-[0.2em] text-center">Mensagem</h4>
                                                <div className="p-4 bg-white rounded-2xl border border-slate-100 italic text-slate-600 font-medium text-sm">
                                                    "{selectedLead.message}"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* NOVO: CAMPO DE ANOTAÇÕES DO VENDEDOR (Sempre visível) */}
                                <div className="space-y-2 pt-8 mt-8 border-t border-[#8A9A5B]/10">
                                    <h4 className="text-xs font-black text-[#697D58] uppercase tracking-[0.2em] flex justify-between items-center">
                                        Anotações do Vendedor
                                        <span className="text-[9px] text-slate-400">visível apenas aqui</span>
                                    </h4>
                                    <textarea
                                        rows={4}
                                        className="w-full bg-slate-50 border border-[#8A9A5B]/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#8A9A5B]/50 outline-none transition-all font-medium text-sm text-slate-700 resize-y"
                                        placeholder="Digite aqui o histórico de conversas e anotações sobre este lead..."
                                        value={selectedLead.notes || ''}
                                        onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                                        onBlur={(e) => handleUpdateLeadNotes(selectedLead.id, e.target.value)}
                                    />
                                    <p className="text-[9px] text-slate-400 text-right uppercase tracking-widest font-black pt-1">É salvo automaticamente ao sair do campo</p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#8A9A5B]/10 bg-white shrink-0 flex gap-4">
                                <button
                                    onClick={() => setIsDiagnosticModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Fechar
                                </button>
                                <a
                                    href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}?text=Olá ${selectedLead.name}, analisei seu diagnóstico estratégico...`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-[2] py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#25D366]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    Iniciar Consultoria no WhatsApp <Phone size={16} />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal "Configurar Contrato" específico para aba Faturamento */}
            <AnimatePresence>
                {isContractModalOpen && contractConfig && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsContractModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="bg-[#697D58] p-8 text-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Edit3 className="text-white" size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">Configurar Contrato</h2>
                                        <p className="text-[#F0EAD6]/80 text-sm font-medium mt-0.5">{contractConfig.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsContractModalOpen(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-md"
                                >
                                    <XIcon size={24} />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto space-y-6 bg-slate-50 flex-1">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Mensalidade (SaaS)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField
                                            label="Valor da Mensalidade (R$)"
                                            type="number"
                                            value={contractConfig.monthlyFee}
                                            onChange={(v: any) => setContractConfig({ ...contractConfig, monthlyFee: parseFloat(v) })}
                                        />
                                        <InputField
                                            label="Duração do Contrato (Meses)"
                                            type="number"
                                            value={contractConfig.contractDurationMonths}
                                            onChange={(v: any) => setContractConfig({ ...contractConfig, contractDurationMonths: parseInt(v) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] border-b border-[#8A9A5B]/10 pb-2">Valor de Implementação (Setup)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField
                                            label="Valor Total de Setup (R$)"
                                            type="number"
                                            value={contractConfig.setupValue}
                                            onChange={(v: any) => setContractConfig({ ...contractConfig, setupValue: parseFloat(v) })}
                                        />
                                        <SelectField
                                            label="Parcelamento do Setup"
                                            value={contractConfig.setupPaymentType}
                                            onChange={(v: any) => setContractConfig({ ...contractConfig, setupPaymentType: v })}
                                            options={[
                                                { label: 'Diluído na Mensalidade (Fatura Única)', value: 'DILUIDO_NA_MENSALIDADE' },
                                                { label: 'Parcelado Separado (2 Faturas)', value: 'PARCELADO_SEPARADO' }
                                            ]}
                                        />
                                        <InputField
                                            label="Nº de Parcelas"
                                            type="number"
                                            value={contractConfig.setupInstallments}
                                            onChange={(v: any) => setContractConfig({ ...contractConfig, setupInstallments: parseInt(v) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#8A9A5B]/10 bg-white shrink-0 flex gap-4">
                                <button
                                    onClick={() => setIsContractModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                                    type="button"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveContractConfig}
                                    disabled={isSubmitting}
                                    className="flex-[2] py-4 bg-[#697D58] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Salvando...' : 'Salvar e Atualizar Motor'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Confirmação de Motor de Faturamento */}
            <AnimatePresence>
                {isGenerateBillingModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md"
                        // Não permite fechar clicando fora para segurança financeira
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#FAFAF9] rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col items-center p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-[#697D58]/10 rounded-full flex items-center justify-center mb-6">
                                {billingGenerationStatus === 'processing' ? (
                                    <div className="w-10 h-10 border-4 border-[#8A9A5B]/20 border-t-[#697D58] rounded-full animate-spin"></div>
                                ) : (
                                    <Cpu className="text-[#697D58]" size={40} />
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-[#1A202C] mb-3">Executar Motor de Faturamento</h2>
                            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
                                Você está prestes a processar e gerar as faturas do mês atual para todas as clínicas ativas. Esta ação disparará os cálculos de mensalidade e parcelas de setup conforme configurado nos contratos.
                            </p>

                            <div className="flex w-full gap-4">
                                <button
                                    onClick={() => !billingGenerationStatus && setIsGenerateBillingModalOpen(false)}
                                    disabled={billingGenerationStatus === 'processing'}
                                    className="flex-1 py-4 bg-transparent border-2 border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-slate-300 transition-all disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmGenerateBilling}
                                    disabled={billingGenerationStatus === 'processing'}
                                    className="flex-[2] py-4 bg-[#697D58] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {billingGenerationStatus === 'processing' ? 'Processando...' : 'Sim, Processar Agora'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Drawer Lateral (Sheet) para Detalhamento da Clínica */}
            <AnimatePresence>
                {isDrawerOpen && selectedClinic && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setIsDrawerOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-2xl bg-[#FAFAF9] h-full relative z-10 shadow-2xl flex flex-col border-l border-[#8A9A5B]/20"
                        >
                            {/* Drawer Header */}
                            <div className="bg-white p-8 border-b border-[#8A9A5B]/10 shrink-0">
                                <button onClick={() => setIsDrawerOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                                    <XIcon size={24} />
                                </button>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-slate-50 border border-[#8A9A5B]/20 rounded-2xl flex items-center justify-center p-2 shadow-sm">
                                        {selectedClinic.logo ? (
                                            <img src={selectedClinic.logo} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Building2 className="text-[#8A9A5B]" size={28} />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[#697D58] leading-tight">{selectedClinic.name}</h2>
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{selectedClinic.cnpj || 'Sem CNPJ'}</p>
                                    </div>
                                </div>

                                {/* Navigator Tabs */}
                                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                                    {[
                                        { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={14} /> },
                                        { id: 'users', label: 'Usuários', icon: <Users size={14} /> },
                                        { id: 'settings', label: 'Configurações', icon: <Settings size={14} /> }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setDrawerTab(t.id)}
                                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${drawerTab === t.id ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400 hover:text-[#697D58]'}`}
                                        >
                                            {t.icon} {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-8 scene-content">
                                {drawerTab === 'overview' && (
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-black text-[#1A202C] uppercase tracking-widest border-b border-slate-200 pb-2">Status da Conta</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plano Atual</p>
                                                <p className="text-lg font-extrabold text-[#697D58]">{selectedClinic.plan || 'Essencial'}</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Mensal (MRR)</p>
                                                <p className="text-lg font-extrabold text-[#3B6D11]">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedClinic.monthlyFee || selectedClinic.pricePerUser || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuários Administrativos</p>
                                                <p className="text-lg font-extrabold text-blue-600">{selectedClinic._count?.users || 0}</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Ativo</p>
                                                <p className="text-lg font-extrabold text-slate-700">{selectedClinic.isActive ? 'Sim' : 'Não'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-8 bg-white p-6 rounded-3xl border border-dashed border-[#8A9A5B]/30 flex flex-col items-center justify-center text-center space-y-3">
                                            <BarChart3 className="text-[#8A9A5B]/40" size={48} />
                                            <h4 className="font-bold text-sm text-slate-500">Histórico de Uso</h4>
                                            <p className="text-xs text-slate-400">O gráfico de faturamento e uso detalhado estará disponível nos próximos relatórios da clínica.</p>
                                        </div>
                                    </div>
                                )}
                                {drawerTab === 'users' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
                                            <h3 className="text-sm font-black text-[#1A202C] uppercase tracking-widest">Acessos</h3>
                                            <button
                                                onClick={() => {
                                                    setNewUser({ name: '', email: '', password: '', role: 'CLINIC_ADMIN', clinicId: selectedClinic.id });
                                                    setActiveTab('users');
                                                    setIsDrawerOpen(false);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-[10px] font-black text-white bg-[#8A9A5B] px-3 py-1.5 rounded-lg hover:bg-[#697D58] transition-colors shadow-sm"
                                            >
                                                + Adicionar
                                            </button>
                                        </div>
                                        {users.filter(u => u.clinicId === selectedClinic.id).length > 0 ? (
                                            users.filter(u => u.clinicId === selectedClinic.id).map(u => (
                                                <div key={u.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                                    <div>
                                                        <p className="font-extrabold text-sm text-[#1A202C] flex items-center gap-2">
                                                            {u.name}
                                                            {u.mustChangePassword && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-black rounded uppercase tracking-widest border border-yellow-200">Senha Temp.</span>}
                                                        </p>
                                                        <p className="text-xs font-bold text-slate-500 mt-1">{u.email}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                                        {u.role}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs font-bold text-slate-400 text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">Nenhum usuário exclusivo associado a esta clínica.</p>
                                        )}
                                    </div>
                                )}
                                {drawerTab === 'settings' && (
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        await handleCreateClinic(e);
                                        setIsDrawerOpen(false);
                                    }} className="space-y-6">
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">Atenção</p>
                                            <p className="text-xs font-semibold text-amber-700">Edições feitas aqui terão impacto direto nos novos faturamentos e em todos os cadastros associados à clínica.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <InputField label="Nome de Exibição" required value={newClinic.name} onChange={(v: any) => setNewClinic({ ...newClinic, name: v })} />
                                            <InputField label="Razão Social" value={newClinic.razaoSocial} onChange={(v: any) => setNewClinic({ ...newClinic, razaoSocial: v })} />
                                            <InputField label="CNPJ" required value={newClinic.cnpj} onChange={(v: any) => setNewClinic({ ...newClinic, cnpj: v })} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <SelectField label="Plano SaaS" value={newClinic.plan || 'Essencial'} onChange={(v: any) => setNewClinic({ ...newClinic, plan: v })} options={[
                                                    { label: 'Essencial', value: 'Essencial' },
                                                    { label: 'Profissional', value: 'Profissional' },
                                                    { label: 'Excellence', value: 'Excellence' }
                                                ]} />
                                                <InputField label="Mensalidade(MRR)" type="number" value={newClinic.monthlyFee} onChange={(v: any) => setNewClinic({ ...newClinic, monthlyFee: v })} />
                                            </div>
                                            <InputField label="Responsável" value={newClinic.responsavelAdmin} onChange={(v: any) => setNewClinic({ ...newClinic, responsavelAdmin: v })} />
                                        </div>
                                        <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-[#697D58] hover:bg-[#526442] active:scale-[0.98] transition-all text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-[#697D58]/20 disabled:opacity-50">
                                            {isSubmitting ? 'Salvando Alterações...' : 'Salvar Configurações'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

const DiagnosticItem = ({ label, value }: { label: string; value: any }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value || '-'}</p>
    </div>
);

export default SaaSManagement;
