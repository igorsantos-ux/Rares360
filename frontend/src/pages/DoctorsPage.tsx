import React, { useState } from 'react';
import { 
    Stethoscope, 
    Plus, 
    Search, 
    Phone, 
    Edit2, 
    Trash2,
    CheckCircle2,
    XCircle,
    User,
    Briefcase,
    DollarSign,
    Calendar,
    X,
    Clock,
    Save
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS_OF_WEEK = [
    { key: 'mon', label: 'Segunda-feira' },
    { key: 'tue', label: 'Terça-feira' },
    { key: 'wed', label: 'Quarta-feira' },
    { key: 'thu', label: 'Quinta-feira' },
    { key: 'fri', label: 'Sexta-feira' },
    { key: 'sat', label: 'Sábado' },
    { key: 'sun', label: 'Domingo' }
];

const DoctorsPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [editingDoctor, setEditingDoctor] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState<any>({
        name: '',
        cpf: '',
        birthDate: '',
        email: '',
        phone: '',
        specialty: '',
        crm: '',
        crmUf: '',
        rqe: '',
        consultationValue: 0,
        repasseType: 'PERCENTAGE',
        repasseValue: 0,
        pixKey: '',
        defaultDuration: 30,
        isActive: true,
        availability: {
            mon: { active: true, start: '08:00', end: '18:00' },
            tue: { active: true, start: '08:00', end: '18:00' },
            wed: { active: true, start: '08:00', end: '18:00' },
            thu: { active: true, start: '08:00', end: '18:00' },
            fri: { active: true, start: '08:00', end: '18:00' },
            sat: { active: false, start: '08:00', end: '12:00' },
            sun: { active: false, start: '08:00', end: '12:00' }
        }
    });

    const { data: doctors = [], isLoading } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const response = await coreApi.getDoctors();
            return response.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => coreApi.createDoctor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            closeDrawer();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => coreApi.updateDoctor(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            closeDrawer();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => coreApi.deleteDoctor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
        }
    });

    const handleEdit = (doctor: any) => {
        setEditingDoctor(doctor);
        setFormData({
            ...doctor,
            birthDate: doctor.birthDate ? new Date(doctor.birthDate).toISOString().split('T')[0] : '',
            availability: doctor.availability || {
                mon: { active: true, start: '08:00', end: '18:00' },
                tue: { active: true, start: '08:00', end: '18:00' },
                wed: { active: true, start: '08:00', end: '18:00' },
                thu: { active: true, start: '08:00', end: '18:00' },
                fri: { active: true, start: '08:00', end: '18:00' },
                sat: { active: false, start: '08:00', end: '12:00' },
                sun: { active: false, start: '08:00', end: '12:00' }
            },
            consultationValue: doctor.consultationValue || 0,
            repasseValue: doctor.repasseValue || 0,
            repasseType: doctor.repasseType || 'PERCENTAGE',
            defaultDuration: doctor.defaultDuration || 30
        });
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setEditingDoctor(null);
        setActiveTab('personal');
        setFormData({
            name: '',
            cpf: '',
            birthDate: '',
            email: '',
            phone: '',
            specialty: '',
            crm: '',
            crmUf: '',
            rqe: '',
            consultationValue: 0,
            repasseType: 'PERCENTAGE',
            repasseValue: 0,
            pixKey: '',
            defaultDuration: 30,
            isActive: true,
            availability: {
                mon: { active: true, start: '08:00', end: '18:00' },
                tue: { active: true, start: '08:00', end: '18:00' },
                wed: { active: true, start: '08:00', end: '18:00' },
                thu: { active: true, start: '08:00', end: '18:00' },
                fri: { active: true, start: '08:00', end: '18:00' },
                sat: { active: false, start: '08:00', end: '12:00' },
                sun: { active: false, start: '08:00', end: '12:00' }
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            commission: formData.repasseType === 'PERCENTAGE' ? formData.repasseValue / 100 : 0
        };

        if (editingDoctor) {
            updateMutation.mutate({ id: editingDoctor.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const filteredDoctors = doctors.filter((doc: any) => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.crm && doc.crm.includes(searchTerm))
    );

    const tabs = [
        { id: 'personal', label: 'Dados Pessoais', icon: <User size={18} /> },
        { id: 'professional', label: 'Profissional', icon: <Briefcase size={18} /> },
        { id: 'financial', label: 'Financeiro', icon: <DollarSign size={18} /> },
        { id: 'availability', label: 'Agenda', icon: <Calendar size={18} /> }
    ];

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-[#8B936B] rounded-xl text-white shadow-lg shadow-[#8B936B]/20">
                            <Stethoscope size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Corpo Clínico</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-12">Gestão de médicos e comissões</p>
                </div>
                
                <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-2 bg-[#8B936B] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#6c7453] transition-all shadow-lg shadow-[#8B936B]/20"
                >
                    <Plus size={20} />
                    Novo Médico
                </button>
            </header>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, CRM ou especialidade..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8B936B]/20 transition-all font-medium text-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidade / CRM</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Repasse</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">Nenhum médico encontrado.</td>
                                </tr>
                            ) : filteredDoctors.map((doc: any) => (
                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#8B936B]/10 flex items-center justify-center text-[#8B936B] font-bold">
                                                {doc.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700 tracking-tight">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-600">{doc.specialty}</span>
                                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{doc.crm || 'N/A'} - {doc.crmUf || 'UF'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1 text-slate-500 font-medium text-xs">
                                            <div className="flex items-center gap-2">
                                                <Phone size={12} className="text-[#8B936B]" />
                                                {doc.phone || 'Sem telefone'}
                                            </div>
                                            <div className="text-[10px] opacity-70 truncate max-w-[150px]">{doc.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#8B936B]/10 text-[#8B936B] text-xs font-black tracking-widest uppercase">
                                            {doc.repasseType === 'PERCENTAGE' ? `${doc.repasseValue || 0}%` : `R$ ${doc.repasseValue || 0}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center">
                                            {doc.isActive ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                                    <CheckCircle2 size={12} />
                                                    Ativo
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                                    <XCircle size={12} />
                                                    Inativo
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEdit(doc)}
                                                className="p-2 text-slate-400 hover:text-[#8B936B] hover:bg-[#8B936B]/10 rounded-xl transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (confirm('Deseja realmente excluir este médico?')) {
                                                        deleteMutation.mutate(doc.id);
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isDrawerOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeDrawer}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {editingDoctor ? 'Editar Profissional' : 'Novo Profissional'}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-medium">Gestão completa de dados e agenda</p>
                                </div>
                                <button onClick={closeDrawer} className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex px-8 border-b border-slate-100 shrink-0 overflow-x-auto no-scrollbar bg-white sticky top-0 z-20">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-bold text-sm whitespace-nowrap ${
                                            activeTab === tab.id 
                                            ? 'border-[#8B936B] text-[#8B936B] bg-[#8B936B]/5' 
                                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'personal' && (
                                        <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
                                                    <input required type="text" className="drawer-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CPF</label>
                                                    <input type="text" className="drawer-input" placeholder="000.000.000-00" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data de Nascimento</label>
                                                    <input type="date" className="drawer-input" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail Profissional</label>
                                                    <input type="email" className="drawer-input" placeholder="medico@clinica.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Telefone / WhatsApp</label>
                                                    <input type="text" className="drawer-input" placeholder="(00) 00000-0000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'professional' && (
                                        <motion.div key="prof" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Especialidade Principal</label>
                                                    <select required className="drawer-input" value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})}>
                                                        <option value="">Selecione...</option>
                                                        <option value="Dermatologia">Dermatologia</option>
                                                        <option value="Endocrinologia">Endocrinologia</option>
                                                        <option value="Ginecologia">Ginecologia</option>
                                                        <option value="Nutrologia">Nutrologia</option>
                                                        <option value="Estética Avançada">Estética Avançada</option>
                                                        <option value="Cirurgia Plástica">Cirurgia Plástica</option>
                                                        <option value="Outros">Outros</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CRM (Número)</label>
                                                    <input type="text" className="drawer-input" value={formData.crm} onChange={(e) => setFormData({...formData, crm: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">UF do CRM</label>
                                                    <select className="drawer-input" value={formData.crmUf} onChange={(e) => setFormData({...formData, crmUf: e.target.value})}>
                                                        <option value="">Selecione...</option>
                                                        {['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS', 'MS', 'MT', 'GO', 'DF', 'AM', 'AC', 'PA', 'RO', 'RR', 'AP', 'MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">RQE (Registro de Especialista)</label>
                                                    <input type="text" className="drawer-input" value={formData.rqe} onChange={(e) => setFormData({...formData, rqe: e.target.value})} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'financial' && (
                                        <motion.div key="fin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Padrão da Consulta (R$)</label>
                                                    <input type="number" className="drawer-input" value={formData.consultationValue} onChange={(e) => setFormData({...formData, consultationValue: Number(e.target.value)})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tipo de Repasse</label>
                                                    <select className="drawer-input" value={formData.repasseType} onChange={(e) => setFormData({...formData, repasseType: e.target.value})}>
                                                        <option value="PERCENTAGE">Porcentagem (%)</option>
                                                        <option value="FIXED">Valor Fixo (R$)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor/Porcentagem do Repasse</label>
                                                    <input type="number" className="drawer-input" value={formData.repasseValue} onChange={(e) => setFormData({...formData, repasseValue: Number(e.target.value)})} />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Chave PIX para Pagamento</label>
                                                    <input type="text" className="drawer-input" value={formData.pixKey} onChange={(e) => setFormData({...formData, pixKey: e.target.value})} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'availability' && (
                                        <motion.div key="avail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tempo Padrão da Consulta</label>
                                                <select className="drawer-input" value={formData.defaultDuration} onChange={(e) => setFormData({...formData, defaultDuration: Number(e.target.value)})}>
                                                    {[15, 30, 45, 60, 90, 120].map(dur => <option key={dur} value={dur}>{dur} minutos</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Configurar Expediente por Dia</label>
                                                <div className="space-y-3">
                                                    {DAYS_OF_WEEK.map((day) => (
                                                        <div key={day.key} className={`flex items-center gap-4 p-4 rounded-3xl border transition-all ${formData.availability[day.key]?.active ? 'bg-white border-[#8B936B]/20 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'}`}>
                                                            <div className="flex items-center gap-3 min-w-[140px]">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={formData.availability[day.key]?.active} 
                                                                    onChange={(e) => {
                                                                        const newAvail = { ...formData.availability };
                                                                        newAvail[day.key].active = e.target.checked;
                                                                        setFormData({ ...formData, availability: newAvail });
                                                                    }}
                                                                    className="w-5 h-5 rounded-lg border-slate-300 text-[#8B936B] focus:ring-[#8B936B]"
                                                                />
                                                                <span className="font-bold text-sm text-slate-700">{day.label}</span>
                                                            </div>
                                                            {formData.availability[day.key]?.active && (
                                                                <div className="flex items-center gap-3 flex-1 justify-end">
                                                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                                                                        <Clock size={12} className="text-slate-400" />
                                                                        <input type="time" className="bg-transparent border-none p-0 text-xs font-black text-slate-600 outline-none" value={formData.availability[day.key].start} onChange={(e) => {
                                                                            const newAvail = { ...formData.availability };
                                                                            newAvail[day.key].start = e.target.value;
                                                                            setFormData({ ...formData, availability: newAvail });
                                                                        }} />
                                                                    </div>
                                                                    <span className="text-slate-300 font-bold">às</span>
                                                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                                                                        <Clock size={12} className="text-slate-400" />
                                                                        <input type="time" className="bg-transparent border-none p-0 text-xs font-black text-slate-600 outline-none" value={formData.availability[day.key].end} onChange={(e) => {
                                                                            const newAvail = { ...formData.availability };
                                                                            newAvail[day.key].end = e.target.value;
                                                                            setFormData({ ...formData, availability: newAvail });
                                                                        }} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>

                            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{formData.isActive ? 'Ativo' : 'Inativo'}</span>
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={closeDrawer} className="px-6 py-4 font-bold text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
                                    <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 bg-[#8B936B] text-white px-10 py-4 rounded-[1.5rem] font-black hover:bg-[#6c7453] transition-all shadow-xl shadow-[#8B936B]/30 disabled:opacity-50">
                                        <Save size={20} />
                                        {editingDoctor ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .drawer-input { width: 100%; padding: 0.875rem 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 1rem; font-weight: 700; color: #1e293b; transition: all 0.2s; outline: none; }
                .drawer-input:focus { background: white; border-color: #8B936B; box-shadow: 0 0 0 4px rgba(139, 147, 107, 0.1); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default DoctorsPage;
