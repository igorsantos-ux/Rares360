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
    const [formSection, setFormSection] = useState<number>(1);

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
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">Gestão SaaS Heath Finance</p>

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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <InputField label="Nome de Exibição" required value={newClinic.name} onChange={(v: any) => setNewClinic({ ...newClinic, name: v })} placeholder="Ex: Clínica Roberta Alamino" />
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
                                                className="flex-[2] py-4 bg-[#8A9A5B] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Finalizar Cadastro
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
