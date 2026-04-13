import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '../../../../services/api';
import {
    TrendingUp,
    Calendar,
    Clock,
    Target,
    User,
    Shield,
    AlertTriangle,
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardKPIProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: string;
    trend?: string;
}

const DashboardKPI = ({ title, value, subtitle, icon: Icon, color, trend }: DashboardKPIProps) => (
    <div className="bg-white rounded-3xl p-6 border border-[#8A9A5B]/5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
                <Icon size={20} />
            </div>
            {trend && (
                <span className="text-[10px] font-black text-[#8A9A5B] bg-[#8A9A5B]/10 px-2 py-1 rounded-full uppercase tracking-wider">
                    {trend}
                </span>
            )}
        </div>
        <div className="space-y-1">
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-slate-700">{value}</h3>
            {subtitle && <p className="text-slate-400 text-[11px] font-medium italic">{subtitle}</p>}
        </div>
    </div>
);

export const OverviewDashboard = ({ patient }: { patient: any }) => {
    const [activeTab, setActiveTab] = useState('geral');

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['patientDashboard', patient?.id],
        queryFn: () => coreApi.getPatientDashboard(patient.id).then(res => res.data),
        enabled: !!patient?.id
    });

    if (isLoading) {
        return (
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-slate-50 rounded-3xl" />
                ))}
            </div>
        );
    }

    const age = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : 'N/A';

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 w-full max-w-none">
            {/* 📊 CARDS DE KPI (Total Width - Grid 3) */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardKPI
                    title="Última Consulta"
                    value={dashboardData?.lastVisit ? format(new Date(dashboardData.lastVisit.date), "dd/MM/yyyy") : 'N/A'}
                    subtitle={dashboardData?.lastVisit?.procedure || 'Sem histórico'}
                    icon={Clock}
                    color="bg-[#8A9A5B]"
                />
                <DashboardKPI
                    title="Próximo Agendamento"
                    value={dashboardData?.nextAppointment ? format(new Date(dashboardData.nextAppointment.date), "dd 'de' MMMM", { locale: ptBR }) : 'Sem agendamento'}
                    subtitle={dashboardData?.nextAppointment ? `${dashboardData.nextAppointment.procedure} com ${dashboardData.nextAppointment.doctor}` : 'Nada previsto'}
                    icon={Calendar}
                    color="bg-blue-500"
                />
                <DashboardKPI
                    title="LTV (Lifetime Value)"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData?.ltv || 0)}
                    subtitle="Total histórico faturado"
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
            </div>

            {/* 🗂️ ABAS (Tabs) ALINHADAS À ESQUERDA */}
            <div className="w-full border-b border-slate-200">
                <div className="flex gap-8">
                    {[
                        { id: 'geral', label: 'Visão Geral' },
                        { id: 'timeline', label: 'Timeline Clínica' },
                        { id: 'finance', label: 'Fluxo Financeiro' },
                        { id: 'anexos', label: 'Anexos & Exames' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id
                                ? 'text-[#8A9A5B]'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#8A9A5B] rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 🏗️ CONTEÚDO (Grid Assimétrico 2/1 -> 8/4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                {/* Coluna Principal (Esquerda - span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    {/* Alertas Médicos (Destaque Horizontal) */}
                    <div className="bg-rose-50/50 rounded-[2rem] p-8 border border-rose-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <AlertTriangle size={120} className="text-rose-500" />
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-rose-900 tracking-tight text-lg">Alertas Críticos & Alergias</h3>
                                    <p className="text-rose-600/70 text-[10px] font-bold uppercase tracking-widest">Atenção Médica Imediata</p>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-rose-200/30 min-h-[100px] flex items-center">
                                <p className="text-rose-900 font-bold text-base leading-relaxed">
                                    {patient.allergies || patient.historyOfAllergies || "Nenhum alerta crítico registrado para este paciente."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Informações Demográficas Expandidas */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-[#8A9A5B]/10 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-[#F5F5DC] text-[#8A9A5B] rounded-2xl">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Prontuário de Identificação</h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Dados básicos e demográficos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                            <InfoField label="Ocupação / Profissão" value={patient.profession} />
                            <InfoField label="Convênio / Plano" value={patient.healthInsurance || 'Particular'} icon={<Shield size={14} className="text-blue-400" />} />
                            <InfoField label="Idade Atual" value={`${age} anos`} />
                            <InfoField label="Gênero" value={patient.gender || 'Não informado'} />
                            <InfoField label="Indicação / Origem" value={patient.origin || 'Direto'} />
                            <InfoField label="Cidade / UF" value={patient.city ? `${patient.city}/${patient.state}` : 'Não informado'} />
                        </div>
                    </div>
                </div>

                {/* Coluna Secundária (Direita - span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    {/* Anotações Gerais */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-[#8A9A5B]/10 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h4 className="font-black text-slate-700 text-xs uppercase tracking-widest">Anotações Gerais</h4>
                            <Target size={18} className="text-slate-300" />
                        </div>

                        <div className="flex-1 space-y-6">
                            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-amber-900/70 text-xs font-medium italic leading-relaxed">
                                "Paciente apresenta interesse em procedimentos de rejuvenescimento facial. Recomenda-se acompanhamento trimestral."
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo de Status</label>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold">Fidelidade</span>
                                        <span className="text-[#8A9A5B] font-black">ALTA</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#8A9A5B] w-[85%]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="mt-8 w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-[#8A9A5B]/20 hover:text-[#8A9A5B] transition-all">
                            Adicionar Nova Nota
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente Auxiliar para Campos de Info
const InfoField = ({ label, value, icon }: { label: string, value: string, icon?: any }) => (
    <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
            {icon}
            <p className="font-black text-slate-700 text-sm">{value || '---'}</p>
        </div>
    </div>
);
