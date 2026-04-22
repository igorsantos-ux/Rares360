import { useState, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { 
    Plus, 
    Filter, 
    Calendar as CalendarIcon,
    Users,
    MapPin,
    Cpu,
    Loader2,
    Info,
    TrendingUp,
    Stethoscope,
    WalletCards,
    X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../services/api';
import { toast } from 'react-hot-toast';
import AppointmentModal from '../components/Agenda/AppointmentModal';
import { PatientSheet } from '../components/Patients/PatientSheet';
import { ProposalModal } from '../components/Patients/ProposalModal';

const Agenda = () => {
    const queryClient = useQueryClient();
    const calendarRef = useRef<FullCalendar>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPatientSheetOpen, setIsPatientSheetOpen] = useState(false);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<any>(null);
    const [selectedPatientForProposal, setSelectedPatientForProposal] = useState<any>(null);
    const [view, setView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');

    // Estado de Filtros
    const [filters, setFilters] = useState({
        professionalId: '',
        roomId: '',
        equipmentId: ''
    });

    // Buscar Agendamentos
    const { data: allAppointments, isLoading } = useQuery({
        queryKey: ['appointments', filters],
        queryFn: async () => {
            const res = await appointmentsApi.getAppointments(filters);
            return res.data;
        }
    });

    // Separar Ativos de Cancelados
    const activeAppointments = useMemo(() => {
        if (!allAppointments) return [];
        return allAppointments
            .filter((app: any) => app.status !== 'CANCELADO_PROFISSIONAL' && app.status !== 'DESMARCADO_PACIENTE')
            .map((app: any) => ({
                id: app.id,
                title: app.patient.fullName,
                start: app.startTime,
                end: app.endTime,
                extendedProps: { ...app, patientName: app.patient.fullName },
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: getStatusColor(app.status).text,
            }));
    }, [allAppointments]);

    const cancelledAppointments = useMemo(() => {
        if (!allAppointments) return [];
        return allAppointments.filter((app: any) => 
            app.status === 'CANCELADO_PROFISSIONAL' || app.status === 'DESMARCADO_PACIENTE'
        );
    }, [allAppointments]);

    // Buscar Recursos para Filtros
    const { data: resources } = useQuery({
        queryKey: ['agenda-resources'],
        queryFn: async () => {
            const res = await appointmentsApi.getResources();
            return res.data;
        }
    });

    // Mutação para Atualizar Agendamento (Drag & Drop)
    const updateMutation = useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            return appointmentsApi.updateAppointment(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success('Agendamento atualizado!');
        },
        onError: (error: any) => {
            if (error.response?.status === 409) {
                toast.error(error.response.data.message || 'Conflito de horário!');
            } else {
                toast.error('Erro ao atualizar agendamento.');
            }
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }
    });

    const handleDateSelect = (selectInfo: any) => {
        setSelectedDate(selectInfo.start);
        setSelectedAppointment(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        setSelectedAppointment(clickInfo.event.extendedProps);
        setIsModalOpen(true);
    };

    const handleEventDrop = (dropInfo: any) => {
        updateMutation.mutate({
            id: dropInfo.event.id,
            startTime: dropInfo.event.start,
            endTime: dropInfo.event.end
        });
    };

    const handleEventResize = (resizeInfo: any) => {
        updateMutation.mutate({
            id: resizeInfo.event.id,
            startTime: resizeInfo.event.start,
            endTime: resizeInfo.event.end
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(value);
    };

    const renderEventContent = (eventInfo: any) => {
        const { event } = eventInfo;
        const props = event.extendedProps;
        const stats = props.patientStats || { totalInvested: 0, avgTicket: 0, provisionalRevenue: 0, isRecurring: false, lastVisit: null };
        const palette = getStatusColor(props.status);

        return (
            <div 
                className="flex flex-col h-full w-full rounded-lg overflow-hidden border shadow-sm transition-all hover:shadow-md"
                style={{ backgroundColor: palette.bodyBg, borderColor: palette.headerBg + '40' }}
            >
                <div 
                    className="px-2 py-1 flex items-center justify-between"
                    style={{ backgroundColor: palette.headerBg }}
                >
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">
                        {eventInfo.timeText}
                    </span>
                    {props.isOverbook && (
                        <span className="bg-white/20 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                            Encaixe
                        </span>
                    )}
                </div>

                <div className="p-2 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Info size={11} className="text-slate-400" />
                        <span className="text-[12px] font-extrabold text-slate-800 truncate leading-tight">
                            {props.patient?.fullName}
                        </span>
                    </div>

                    <span className="text-[11px] font-medium text-slate-500 truncate mb-1">
                        {props.procedure?.name || 'Consulta / Outro'}
                    </span>

                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 font-bold">
                            <div 
                                className="w-1.5 h-1.5 rounded-full" 
                                style={{ backgroundColor: stats.isRecurring ? '#10b981' : '#3b82f6' }}
                            />
                            <span className="text-[9px] font-bold text-slate-400 border border-slate-100 rounded-md px-1 py-0.5 uppercase tracking-wider">
                                {stats.isRecurring ? 'Recorrente' : 'Novo'}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button 
                                title="Prontuário (PEP)"
                                onClick={(e) => { e.stopPropagation(); window.location.href = `/patients/${props.patientId}`; }}
                                className="p-1 hover:bg-white rounded-md text-[#8A9A5B] transition-colors border border-transparent hover:border-[#8A9A5B]/10"
                            >
                                <Stethoscope size={12} />
                            </button>
                            <button 
                                title="Orçamento"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSelectedPatientForProposal({ id: props.patientId, name: props.patientName });
                                    setIsProposalModalOpen(true);
                                }}
                                className="p-1 hover:bg-white rounded-md text-amber-500 transition-colors border border-transparent hover:border-amber-500/10"
                            >
                                <WalletCards size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="mb-2 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Última Visita</span>
                        <span className="text-[10px] font-bold text-slate-600 block">
                            {stats.lastVisit ? new Date(stats.lastVisit).toLocaleDateString('pt-BR') : 'Primeira Vez'}
                        </span>
                    </div>

                    <div className="mt-auto pt-2 border-t border-slate-200/50 grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Investiu</span>
                            <span className="text-[11px] font-black text-slate-900 leading-none">{formatCurrency(stats.totalInvested)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Ticket Md</span>
                            <span className="text-[11px] font-black text-slate-900 leading-none">{formatCurrency(stats.avgTicket)}</span>
                        </div>
                        <div className="flex flex-col col-span-2 pt-2">
                            <div className="flex items-center gap-1 mb-0.5">
                                <TrendingUp size={9} className="text-emerald-500" />
                                <span className="text-[8px] text-emerald-600 uppercase font-bold tracking-tighter">Previsibilidade</span>
                            </div>
                            <span className="text-[11px] font-black text-emerald-700 leading-none">
                                {formatCurrency(stats.provisionalRevenue)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-[calc(100vh-80px)] h-full flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <CalendarIcon className="text-[#8A9A5B]" size={32} />
                        Agenda Inteligente
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Gerencie consultas, salas e equipamentos em tempo real.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button 
                            onClick={() => { setView('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'timeGridDay' ? 'bg-white text-[#697D58] shadow-sm' : 'text-slate-400'}`}
                        >
                            Dia
                        </button>
                        <button 
                            onClick={() => { setView('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'timeGridWeek' ? 'bg-white text-[#697D58] shadow-sm' : 'text-slate-400'}`}
                        >
                            Semana
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => { setSelectedPatientForEdit(null); setIsPatientSheetOpen(true); }}
                        className="bg-white border-2 border-[#697D58]/20 text-[#697D58] hover:bg-[#697D58]/5 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Users size={20} />
                        Novo Paciente
                    </button>

                    <button 
                        onClick={() => { setSelectedAppointment(null); setSelectedDate(new Date()); setIsModalOpen(true); }}
                        className="bg-[#697D58] hover:bg-[#556B2F] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-[#697D58]/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Novo Agendamento
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* Sidebar Filtros */}
                <aside className="w-80 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-8">
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Filter size={14} />
                            Filtros de Recurso
                        </h3>

                        <div className="space-y-4">
                            <FilterGroup 
                                label="Profissional" 
                                icon={<Users size={16} />}
                                value={filters.professionalId}
                                onChange={(val: string) => setFilters(f => ({ ...f, professionalId: val }))}
                                options={resources?.professionals || []}
                            />
                            <FilterGroup 
                                label="Sala" 
                                icon={<MapPin size={16} />}
                                value={filters.roomId}
                                onChange={(val: string) => setFilters(f => ({ ...f, roomId: val }))}
                                options={resources?.rooms || []}
                            />
                            <FilterGroup 
                                label="Equipamento" 
                                icon={<Cpu size={16} />}
                                value={filters.equipmentId}
                                onChange={(val: string) => setFilters(f => ({ ...f, equipmentId: val }))}
                                options={resources?.equipments || []}
                            />
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-50">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legenda de Status</h4>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                <StatusLegend color="#D97706" label="Aguardando" />
                                <StatusLegend color="#F59E0B" label="Ag. Pagamento" />
                                <StatusLegend color="#697D58" label="Confirmado" />
                                <StatusLegend color="#A8A29E" label="Não Confirmado" />
                                <StatusLegend color="#8B5CF6" label="Chamando" />
                                <StatusLegend color="#3B82F6" label="Em Atendimento" />
                                <StatusLegend color="#10B981" label="Atendido" />
                                <StatusLegend color="#F43F5E" label="Canc. Profissional" />
                                <StatusLegend color="#64748B" label="Desm. Paciente" />
                                <StatusLegend color="#991B1B" label="Não Compareceu" />
                                <StatusLegend color="#06B6D4" label="Remarcado" />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Agenda Principal */}
                <main className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-6 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-[#697D58]" size={40} />
                            <p className="text-xs font-black text-[#697D58] uppercase tracking-widest">Sincronizando Agenda...</p>
                        </div>
                    )}
                    
                    <div className="h-full custom-calendar">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView={view}
                            headerToolbar={false}
                            locale={ptBrLocale}
                            events={activeAppointments}
                            selectable={true}
                            editable={true}
                            nowIndicator={true}
                            slotMinTime="07:00:00"
                            slotMaxTime="21:00:00"
                            allDaySlot={false}
                            height="100%"
                            select={handleDateSelect}
                            eventClick={handleEventClick}
                            eventDrop={handleEventDrop}
                            eventResize={handleEventResize}
                            eventContent={renderEventContent}
                        />
                    </div>
                </main>
            </div>

            {/* Barra de Cancelados / Desmarcados */}
            {cancelledAppointments.length > 0 && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <X size={14} className="text-red-400" />
                            Agendamentos Cancelados / Desmarcados
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 italic">{cancelledAppointments.length} ocorrências encontradas</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {cancelledAppointments.map((app: any) => (
                            <div 
                                key={app.id}
                                onClick={() => { setSelectedAppointment(app); setIsModalOpen(true); }}
                                className="min-w-[280px] p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-red-100 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[9px] font-black bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-400 uppercase">
                                        {new Date(app.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${app.status === 'CANCELADO_PROFISSIONAL' ? 'bg-red-50 text-red-500' : 'bg-slate-200 text-slate-600'}`}>
                                        {app.status === 'CANCELADO_PROFISSIONAL' ? 'Pelo Profissional' : 'Pelo Paciente'}
                                    </span>
                                </div>
                                <p className="text-sm font-black text-slate-700 group-hover:text-[#697D58] transition-colors truncate">
                                    {app.patient?.fullName}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate italic">
                                    Motivo: {app.notes || 'Não informado'}
                                </p>
                                <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                                        {app.procedure?.name || 'Consulta / Outro'}
                                    </span>
                                    <button className="text-[9px] font-black text-[#697D58] uppercase hover:underline">
                                        Reagendar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .custom-calendar .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-button-bg-color: #697D58;
                    --fc-button-border-color: #697D58;
                    --fc-button-hover-bg-color: #556B2F;
                    --fc-button-hover-border-color: #556B2F;
                    --fc-button-active-bg-color: #4a5c2d;
                    --fc-button-active-border-color: #4a5c2d;
                    --fc-today-bg-color: rgba(105, 125, 88, 0.05);
                    font-family: 'Inter', sans-serif;
                }
                .fc-theme-standard td, .fc-theme-standard th {
                    border-color: #f1f5f9;
                }
                .fc .fc-timegrid-slot {
                    height: 10rem !important;
                    border-bottom: 1px dashed #f1f5f9 !important;
                }
                .custom-calendar .fc-event {
                    background: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                    margin: 2px !important;
                }
                .custom-calendar .fc-event-main {
                    padding: 0 !important;
                    height: 100%;
                }
                .custom-calendar .fc-timegrid-cols .fc-event {
                    min-height: 160px;
                }
                .custom-calendar .fc-timegrid-axis-cushion, 
                .custom-calendar .fc-timegrid-slot-label-cushion {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #94a3b8;
                }
                .custom-calendar .fc-col-header-cell-cushion {
                    padding: 12px;
                    font-size: 12px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
            `}</style>

            {isModalOpen && (
                <AppointmentModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDate={selectedDate}
                    appointment={selectedAppointment}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
                />
            )}

            {isPatientSheetOpen && (
                <PatientSheet 
                    isOpen={isPatientSheetOpen}
                    onClose={() => setIsPatientSheetOpen(false)}
                    onSave={() => queryClient.invalidateQueries({ queryKey: ['patients-list'] })}
                    patient={selectedPatientForEdit}
                />
            )}

            {isProposalModalOpen && selectedPatientForProposal && (
                <ProposalModal 
                    isOpen={isProposalModalOpen}
                    onClose={() => setIsProposalModalOpen(false)}
                    patientId={selectedPatientForProposal.id}
                    patientName={selectedPatientForProposal.name}
                />
            )}
        </div>
    );
};

const FilterGroup = ({ label, icon, value, onChange, options }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
            {icon}
            {label}
        </label>
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all outline-none"
        >
            <option value="">Todos</option>
            {options.map((opt: any) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
        </select>
    </div>
);

const StatusLegend = ({ color, label }: any) => (
    <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
    </div>
);

const getStatusColor = (status: string) => {
    switch (status) {
        case 'AGUARDANDO': 
            return { headerBg: '#D97706', bodyBg: '#FEFCE8', text: '#92400E' };
        case 'AGUARDANDO_PAGAMENTO': 
            return { headerBg: '#F59E0B', bodyBg: '#FFFBEB', text: '#92400E' };
        case 'ATENDIDO': 
            return { headerBg: '#10B981', bodyBg: '#ECFDF5', text: '#065F46' };
        case 'CANCELADO_PROFISSIONAL': 
            return { headerBg: '#F43F5E', bodyBg: '#FFF1F2', text: '#9F1239' };
        case 'CHAMANDO': 
            return { headerBg: '#8B5CF6', bodyBg: '#F5F3FF', text: '#5B21B6' };
        case 'DESMARCADO_PACIENTE': 
            return { headerBg: '#64748B', bodyBg: '#F8FAFC', text: '#1E293B' };
        case 'EM_ATENDIMENTO': 
            return { headerBg: '#3B82F6', bodyBg: '#EFF6FF', text: '#1E40AF' };
        case 'CONFIRMADO': 
            return { headerBg: '#697D58', bodyBg: '#F7F8F6', text: '#3F4E33' };
        case 'NAO_CONFIRMADO': 
            return { headerBg: '#A8A29E', bodyBg: '#FAFAF9', text: '#44403C' };
        case 'FALTA': 
            return { headerBg: '#991B1B', bodyBg: '#FEF2F2', text: '#7F1D1D' };
        case 'REMARCADO': 
            return { headerBg: '#06B6D4', bodyBg: '#ECFEFF', text: '#155E75' };
        default: 
            return { headerBg: '#697D58', bodyBg: '#FFFFFF', text: '#1e293b' };
    }
};

export default Agenda;
