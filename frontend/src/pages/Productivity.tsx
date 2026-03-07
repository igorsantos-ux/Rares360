import React, { useState } from 'react';
import {
    DollarSign,
    ArrowUpRight,
    TrendingUp,
    Award,
    Plus,
    X,
    UserPlus,
    Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../services/api';

const Productivity = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch productivity data
    const { data: doctors, isLoading } = useQuery({
        queryKey: ['productivity'],
        queryFn: async () => {
            const response = await coreApi.getProductivity();
            return response.data;
        }
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (newDoctor: any) => coreApi.createDoctor(newDoctor),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productivity'] });
            setIsModalOpen(false);
        }
    });

    const handleCreateDoctor = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            specialty: formData.get('specialty'),
            commission: Number(formData.get('commission')) / 100, // Converte % para decimal
        };
        createMutation.mutate(data);
    };

    const totalDoctorPart = doctors?.reduce((acc: number, doc: any) => acc + doc.doctorPart, 0) || 0;
    const totalClinicPart = doctors?.reduce((acc: number, doc: any) => acc + doc.clinicPart, 0) || 0;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Produtividade Médica</h2>
                    <p className="text-slate-500 mt-1">Acompanhamento detalhado de faturamento e divisão por profissional.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2 bg-[#10b981] text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <UserPlus size={18} /> Novo Médico
                    </button>
                    <button className="px-6 py-2 bg-[#0f172a] text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                        <Award size={18} className="text-emerald-400" /> Ranking de Performance
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Total Repassado aos Médicos" value={`R$ ${totalDoctorPart.toLocaleString()}`} icon={<DollarSign className="text-orange-500" />} subtitle="Mês Corrente" />
                <Card title="Retenção Líquida Clínica" value={`R$ ${totalClinicPart.toLocaleString()}`} icon={<TrendingUp className="text-emerald-500" />} subtitle="Consolidado" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-lg text-slate-800">Relatório de Split por Profissional</h3>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">Total: {doctors?.length || 0} médicos</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Profissional</th>
                                    <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Especialidade</th>
                                    <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Faturamento Bruto</th>
                                    <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Comissão</th>
                                    <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Parte do Médico</th>
                                    <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Saldo Clínica</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {doctors?.map((doc: any) => (
                                    <DocRow
                                        key={doc.id}
                                        name={doc.name}
                                        spec={doc.specialty}
                                        gross={doc.grossRevenue}
                                        rate={doc.commissionRate}
                                        docPart={doc.doctorPart}
                                        clinicPart={doc.clinicPart}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal Novo Médico */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">Novo Médico</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cadastro Profissional</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDoctor} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input name="name" required placeholder="Ex: Dr. João Pedro" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:border-emerald-500 focus:outline-none font-semibold transition-all" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade / Área</label>
                                    <input name="specialty" required placeholder="Ex: Dermatologia, Harmonização" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:border-emerald-500 focus:outline-none font-semibold transition-all" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Comissão (%)</label>
                                    <div className="relative">
                                        <input name="commission" type="number" step="0.1" required placeholder="Ex: 15" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:border-emerald-500 focus:outline-none font-semibold transition-all" />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={createMutation.isPending}
                                    className="flex-1 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Cadastrar Médico'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const Card = ({ title, value, icon, subtitle }: any) => (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 flex items-center justify-between group hover:border-[#10b981]/30 transition-all cursor-default shadow-sm hover:shadow-md">
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{title}</p>
            <h4 className="text-3xl font-extrabold text-[#0f172a]">{value}</h4>
            <p className="text-slate-400 text-[10px] mt-2 font-semibold uppercase">{subtitle}</p>
        </div>
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
    </div>
);

const DocRow = ({ name, spec, gross, rate, docPart, clinicPart }: any) => (
    <tr className="hover:bg-slate-50 transition-all duration-200 cursor-pointer group">
        <td className="px-8 py-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    {name[0]}
                </div>
                <span className="font-bold text-slate-800">{name}</span>
            </div>
        </td>
        <td className="px-8 py-6 text-slate-500 font-medium">{spec}</td>
        <td className="px-8 py-6 font-bold text-slate-800">R$ {gross.toLocaleString()}</td>
        <td className="px-8 py-6 text-center">
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black border border-emerald-100">{rate.toFixed(1)}%</span>
        </td>
        <td className="px-8 py-6">
            <div className="flex items-center gap-1.5 text-orange-600 font-bold">
                R$ {docPart.toLocaleString()}
            </div>
        </td>
        <td className="px-8 py-6 text-right">
            <div className="flex items-center justify-end gap-1.5 font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                R$ {clinicPart.toLocaleString()}
                <ArrowUpRight size={16} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </td>
    </tr>
);

export default Productivity;
