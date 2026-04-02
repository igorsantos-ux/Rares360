import { useState, useRef } from 'react';
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
    Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AppointmentModal from '../components/Agenda/AppointmentModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Agenda = () => {
    const queryClient = useQueryClient();
    const calendarRef = useRef<FullCalendar>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [view, setView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');

    // Estado de Filtros
    const [filters, setFilters] = useState({
        professionalId: '',
        roomId: '',
        equipmentId: ''
    });

    // Buscar Agendamentos
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', filters],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/appointments`, {
                params: filters,
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            return res.data.map((app: any) => ({
                id: app.id,
                title: app.patient.fullName,
                start: app.startTime,
                end: app.endTime,
                extendedProps: { ...app },
                backgroundColor: getStatusColor(app.status).bg,
                borderColor: getStatusColor(app.status).border,
                textColor: getStatusColor(app.status).text,
            }));
        }
    });

    // Buscar Recursos para Filtros
    const { data: resources } = useQuery({
        queryKey: ['agenda-resources'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/appointments/resources`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            return res.data;
        }
    });

    // Mutação para Atualizar Agendamento (Drag & Drop)
    const updateMutation = useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            return axios.put(`${API_URL}/appointments/${id}`, data, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
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

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-500">
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
                            <StatusLegend color="#F5F5DC" label="Aguardando" />
                            <StatusLegend color="#8FA189" label="Confirmado" />
                            <StatusLegend color="#556B2F" label="Check-in" />
                            <StatusLegend color="#A0522D" label="Falta (No-show)" />
                            <StatusLegend color="#E5E7EB" label="Executado" />
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
                            events={appointments || []}
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

            {isModalOpen && (
                <AppointmentModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDate={selectedDate}
                    appointment={selectedAppointment}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
                />
            )}

            <style>{`
                .custom-calendar .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-today-bg-color: #f8fafc;
                    font-family: inherit;
                }
                .custom-calendar .fc-timegrid-slot {
                    height: 4rem !important;
                    border-bottom: 1px dashed #f1f5f9 !important;
                }
                .custom-calendar .fc-event {
                    border-radius: 12px;
                    padding: 4px 8px;
                    font-weight: 700;
                    font-size: 11px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                    transition: all 0.2s;
                    border-width: 0 0 0 4px !important;
                }
                .custom-calendar .fc-event:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                }
                .custom-calendar .fc-v-event .fc-event-main {
                    color: inherit;
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
        </div>
    );
};

const renderEventContent = (eventInfo: any) => {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-start">
                <span className="truncate">{eventInfo.event.title}</span>
                {eventInfo.event.extendedProps.isOverbook && (
                    <span className="bg-amber-400 text-white text-[8px] px-1 rounded-md">Encaixe</span>
                )}
            </div>
            <span className="text-[9px] opacity-70 mt-auto">
                {eventInfo.timeText} • {eventInfo.event.extendedProps.professional?.name?.split(' ')[0]}
            </span>
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
        case 'AGUARDANDO': return { bg: '#F5F5DC', border: '#E5E5CC', text: '#4A4A4A' };
        case 'CONFIRMADO': return { bg: '#8FA189', border: '#7A8C75', text: '#FFFFFF' };
        case 'CHECK_IN': return { bg: '#556B2F', border: '#445525', text: '#FFFFFF' };
        case 'FALTA': return { bg: '#A0522D', border: '#8B4513', text: '#FFFFFF' };
        case 'EXECUTADO': return { bg: '#E5E7EB', border: '#D1D5DB', text: '#9CA3AF' };
        default: return { bg: '#FFFFFF', border: '#E2E8F0', text: '#64748B' };
    }
};

export default Agenda;
