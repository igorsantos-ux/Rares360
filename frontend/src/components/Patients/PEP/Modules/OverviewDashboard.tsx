import React from 'react';
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
    PlusCircle,
    FileText
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
    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['patientDashboard', patient?.id],
        queryFn: () => coreApi.getPatientDashboard(patient.id).then(res => res.data),
        enabled: !!patient?.id
    });

    if (isLoading) {
        return (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 bg-slate-50 rounded-3xl" />
                ))}
            </div>
        );
    }

    const age = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : 'N/A';

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardKPI
                    title="LTV Retroativo"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData?.ltv || 0)}
                    subtitle="Total histórico faturado"
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
                <DashboardKPI
                    title="Próximo Agendamento"
                    value={dashboardData?.nextAppointment ? format(new Date(dashboardData.nextAppointment.date), "dd 'de' MMMM", { locale: ptBR }) : 'Sem agendamento'}
                    subtitle={dashboardData?.nextAppointment ? `${dashboardData.nextAppointment.procedure} com ${dashboardData.nextAppointment.doctor}` : 'Nada previsto'}
                    icon={Calendar}
                    color="bg-blue-500"
                />
                <DashboardKPI
                    title="Última Consulta"
                    value={dashboardData?.lastVisit ? format(new Date(dashboardData.lastVisit.date), "dd/MM/yyyy") : 'N/A'}
                    subtitle={dashboardData?.lastVisit?.procedure || 'Sem histórico de faturamento'}
                    icon={Clock}
                    color="bg-[#8A9A5B]"
                />
                <DashboardKPI
                    title="Rentabilidade"
                    value={`${(patient.analytics?.profitabilityMargin || 0).toFixed(1)}%`}
                    subtitle="Margem de contribuição"
                    icon={Target}
                    color="bg-[#697D58]"
                    trend={patient.analytics?.isHighProfitability ? "Alta" : "Normal"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Bar / Demografia */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] p-8 border border-[#8A9A5B]/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#F5F5DC] text-[#8A9A5B] rounded-xl">
                                <User size={20} />
                            </div>
                            <h3 className="font-black text-slate-700 tracking-tight">Informações Demográficas</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupação</p>
                                <p className="font-bold text-slate-600">{patient.profession || 'Não informada'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Convênio / Plano</p>
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-blue-400" />
                                    <p className="font-bold text-slate-600">{patient.healthInsurance || 'Particular'}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Idade Atual</p>
                                <p className="font-bold text-slate-600">{age} anos</p>
                            </div>
                        </div>
                    </div>

                    {/* Alertas Médicos */}
                    <div className="bg-amber-50/50 rounded-[2rem] p-8 border border-amber-200/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <AlertTriangle size={120} />
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                    <AlertTriangle size={20} />
                                </div>
                                <h3 className="font-black text-amber-900 tracking-tight">Alertas Médicos & Alergias</h3>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/30">
                                <p className="text-amber-900/80 font-medium leading-relaxed">
                                    {patient.allergies || patient.historyOfAllergies || "Nenhum alerta crítico registrado para este paciente até o momento."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna Lateral de Resumo/Ações */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 border border-[#8A9A5B]/5 shadow-sm">
                        <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Anotações Gerais</h4>
                        <div className="space-y-4">
                            {!dashboardData?.nextAppointment && (
                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl border-dashed text-center space-y-3">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider leading-tight">Nenhum agendamento futuro encontrado</p>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#8A9A5B]/20 text-[#8A9A5B] rounded-xl text-[11px] font-black hover:bg-[#8A9A5B] hover:text-white transition-all mx-auto shadow-sm">
                                        <PlusCircle size={14} />
                                        Agendar Agora
                                    </button>
                                </div>
                            )}
                            <div className="flex items-start gap-3 p-4 bg-[#F5F5DC]/30 rounded-2xl border border-[#8A9A5B]/5">
                                <FileText size={16} className="text-[#8A9A5B] mt-0.5" />
                                <p className="text-[11px] text-slate-500 font-medium italic">
                                    Paciente importado via planilha histórica. Verifique os dados cadastrais completos no módulo de Dados.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
