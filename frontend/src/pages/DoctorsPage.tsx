import React, { useState } from 'react';
import { 
    Stethoscope, 
    Plus, 
    Search, 
    Phone, 
    Edit2, 
    Trash2,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorsPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        crm: '',
        phone: '',
        commission: 0,
        isActive: true
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
            closeModal();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => coreApi.updateDoctor(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            closeModal();
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
            name: doctor.name,
            specialty: doctor.specialty,
            crm: doctor.crm || '',
            phone: doctor.phone || '',
            commission: doctor.commission * 100, // DB stores 0.1, we show 10
            isActive: doctor.isActive
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDoctor(null);
        setFormData({
            name: '',
            specialty: '',
            crm: '',
            phone: '',
            commission: 0,
            isActive: true
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            commission: formData.commission / 100 // Convert percentage to factor
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

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
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
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[#8B936B] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#6c7453] transition-all shadow-lg shadow-[#8B936B]/20"
                >
                    <Plus size={20} />
                    Novo Médico
                </button>
            </header>

            {/* Content Card */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                {/* Search Bar */}
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

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidade / CRM</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão</th>
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
                                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{doc.crm || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                            <Phone size={14} className="text-[#8B936B]" />
                                            {doc.phone || 'Sem telefone'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#8B936B]/10 text-[#8B936B] text-xs font-black tracking-widest uppercase">
                                            {(doc.commission * 100).toFixed(0)}%
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

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {editingDoctor ? 'Editar Profissional' : 'Novo Profissional'}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-medium">Preencha os dados abaixo</p>
                                </div>
                                <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8B936B]/20 transition-all font-bold text-slate-700"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Especialidade</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8B936B]/20 transition-all font-bold text-slate-700"
                                            value={formData.specialty}
                                            onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">CRM</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8B936B]/20 transition-all font-bold text-slate-700"
                                            value={formData.crm}
                                            onChange={(e) => setFormData({...formData, crm: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Telefone</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8B936B]/20 transition-all font-bold text-slate-700"
                                            placeholder="(00) 00000-0000"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Comissão (%)</label>
                                        <input 
                                            type="number" 
                                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8B936B]/20 transition-all font-bold text-slate-700"
                                            value={formData.commission}
                                            onChange={(e) => setFormData({...formData, commission: Number(e.target.value)})}
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex items-center gap-3 p-4 bg-slate-50 rounded-[1.5rem] cursor-pointer" onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">{formData.isActive ? 'Conta Ativa' : 'Conta Inativa'}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-3 rounded-2xl font-bold text-slate-400 hover:bg-slate-100 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="px-8 py-3 bg-[#8B936B] text-white rounded-2xl font-bold hover:bg-[#6c7453] transition-all shadow-lg shadow-[#8B936B]/20 disabled:opacity-50"
                                    >
                                        {editingDoctor ? 'Salvar Alterações' : 'Cadastrar Médico'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoctorsPage;
