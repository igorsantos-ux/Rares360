import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../../services/api';
import { PatientSheet } from '../../components/Patients/PatientSheet';
import { PatientFilterSheet } from '../../components/Patients/PatientFilterSheet';
import { ImportPatientsModal } from '../../components/Patients/ImportPatientsModal';
import {
    Users,
    Search,
    UserPlus,
    MoreHorizontal,
    Filter,
    Calendar,
    Phone,
    TrendingUp,
    Loader2,
    Gem,
    Trophy,
    Award,
    Medal,
    ChevronRight,
    Cake,
    Mail,
    Download
} from 'lucide-react';

const getClassificationConfig = (classification: string) => {
    switch (classification) {
        case 'DIAMANTE':
            return { icon: <Gem size={12} />, label: 'Diamante', color: 'bg-cyan-50 text-cyan-600 border-cyan-200 shadow-sm shadow-cyan-100' };
        case 'OURO':
            return { icon: <Trophy size={12} />, label: 'Ouro', color: 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-100' };
        case 'PRATA':
            return { icon: <Award size={12} />, label: 'Prata', color: 'bg-slate-50 text-slate-500 border-slate-200 shadow-sm shadow-slate-100' };
        case 'BRONZE':
            return { icon: <Medal size={12} />, label: 'Bronze', color: 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm shadow-orange-100' };
        default:
            return { icon: null, label: classification || 'Bronze', color: 'bg-slate-50 text-slate-400' };
    }
}

const PatientsPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Calculate active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        const filterKeys = ['status', 'aniversario', 'ltvMin', 'ltvMax', 'lastVisit', 'origem'];
        filterKeys.forEach(key => {
            const val = searchParams.get(key);
            if (val && val !== 'todos') count++;
        });
        return count;
    }, [searchParams]);

    const { data, isLoading } = useQuery({
        queryKey: ['patients', Object.fromEntries(searchParams.entries())],
        queryFn: async () => {
            const params = Object.fromEntries(searchParams.entries());
            const response = await coreApi.getPatients(params);
            return response.data;
        }
    });

    const [searchTerm, setSearchTerm] = useState('');

    const patients = data?.data || [];
    const summary = data?.summary || { totalPatients: 0, monthlyBirthdays: 0, averageClinicTicket: 0 };

    // Filtragem local baseada na busca
    const displayPatients = patients.filter((p: any) =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf?.includes(searchTerm) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewPEP = (patient: any) => {
        navigate(`/patients/${patient.id}`);
    };

    const handleNewPatient = () => {
        setSelectedPatient(null);
        setIsSheetOpen(true);
    };

    const handleExportCSV = () => {
        if (!displayPatients.length) return;

        const headers = ["Nome", "Celular", "E-mail", "Classificacao", "LTV", "Ultima Visita"];
        const rows = displayPatients.map((p: any) => [
            p.fullName,
            p.phone || '',
            p.email || '',
            p.classification,
            p.totalSpent,
            p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : ''
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row: any[]) => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `pacientes_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando base analítica...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Pacientes</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão inteligente e análise de LTV da base de clientes.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#8A9A5B]/20 text-[#697D58] rounded-2xl font-bold text-sm shadow-sm hover:bg-[#8A9A5B]/5 transition-all w-fit"
                    >
                        <TrendingUp size={20} className="rotate-90" />
                        Importar Planilha
                    </button>
                    <button
                        onClick={handleNewPatient}
                        className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all w-fit"
                    >
                        <UserPlus size={20} />
                        Cadastrar Paciente
                    </button>
                </div>
            </div>

            {/* Analytical Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total de Pacientes"
                    value={summary.totalPatients}
                    icon={<Users size={20} />}
                    trend="Base de dados ativa"
                />
                <StatCard
                    title="Aniversariantes do Mês"
                    value={summary.monthlyBirthdays}
                    icon={<Cake size={20} />}
                    trend="Oportunidade de contato"
                    color="text-pink-500"
                    bgColor="bg-pink-50"
                />
                <StatCard
                    title="Ticket Médio Unidade"
                    value={`R$ ${summary.averageClinicTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<TrendingUp size={20} />}
                    trend="Receita por atendimento"
                    color="text-blue-500"
                    bgColor="bg-blue-50"
                />
            </div>

            {/* List Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF ou e-mail..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm shadow-sm shadow-[#8A9A5B]/5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsFilterSheetOpen(true)}
                            className={`flex items-center gap-2 px-5 py-3 bg-white border rounded-2xl font-bold text-xs transition-all relative ${activeFiltersCount > 0
                                ? 'border-[#8A9A5B] text-[#697D58] bg-[#8A9A5B]/5'
                                : 'border-[#8A9A5B]/10 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Filter size={16} />
                            Filtros Avançados
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#8A9A5B] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black animate-in zoom-in duration-300">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            <Download size={16} />
                            Exportar CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[500px]">
                    <div className="p-8 pb-0">
                        {/* Always show headers to show the new structure */}
                        <div className="grid grid-cols-6 gap-8 px-8 py-5 bg-slate-50/50 rounded-2xl border border-slate-100 mb-4 items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente & Classificação</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rentabilidade</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Visitas / Ticket</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">LTV</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</span>
                        </div>
                    </div>

                    {displayPatients.length === 0 ? (
                        <div className="py-12 px-8 flex flex-col items-center justify-center gap-8 animate-in fade-in zoom-in duration-700">
                            <div className="w-24 h-24 bg-[#F5F5DC] rounded-[2.5rem] flex items-center justify-center text-[#8A9A5B] shadow-inner shadow-[#8A9A5B]/10">
                                <Users size={48} strokeWidth={1} />
                            </div>
                            <div className="text-center space-y-2 max-w-lg">
                                <h3 className="text-2xl font-black text-[#697D58]">Bem-vindo ao Patient Concierge</h3>
                                <p className="text-slate-500 font-medium text-sm">Sua clínica ainda não possui pacientes cadastrados. Cadastre seu primeiro paciente para ativar a análise de **Rentabilidade em Tempo Real** e o **Prontuário Inteligente (PEP)**.</p>
                            </div>
                            <button
                                onClick={handleNewPatient}
                                className="group flex items-center gap-3 px-8 py-4 bg-[#8A9A5B] text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-[#8A9A5B]/20 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
                                COMEÇAR AGORA
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-[#8A9A5B]/5">
                                {displayPatients.map((patient: any) => {
                                    const config = getClassificationConfig(patient.classification);
                                    return (
                                        <tr key={patient.id}
                                            onClick={() => handleViewPEP(patient)}
                                            className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 bg-white border border-[#8A9A5B]/20 text-[#697D58] rounded-2xl flex items-center justify-center font-black text-xs shadow-sm overflow-hidden">
                                                            {patient.photoUrl ? (
                                                                <img src={patient.photoUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                patient.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className={`absolute -bottom-2 -right-2 flex items-center justify-center p-1 rounded-lg border bg-white shadow-sm`}>
                                                            {config.icon || <Users size={10} />}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-700 text-sm">{patient.fullName}</p>
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Phone size={12} className="text-[#8A9A5B]" />
                                                        <span className="text-xs font-bold">{patient.phone || 'Sem telefone'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Mail size={12} />
                                                        <span className="text-[10px] font-medium">{patient.email || 'sem@email.com'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${patient.profitabilityMargin > 70 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                        {patient.profitabilityMargin?.toFixed(1) || 0}%
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Margem</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                                                        <Calendar size={12} className="text-[#8A9A5B]" />
                                                        {patient.visitCount} {patient.visitCount === 1 ? 'Visita' : 'Visitas'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold">
                                                        Ticket: R$ {patient.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-[#697D58]">
                                                        R$ {patient.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Investimento Real</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2.5 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-[#8A9A5B] border border-transparent hover:border-[#8A9A5B]/10">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                    <button className="p-2.5 bg-white rounded-xl shadow-sm border border-[#8A9A5B]/10 text-[#8A9A5B] hover:bg-[#8A9A5B] hover:text-white transition-all">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {displayPatients.length > 0 && (
                    <div className="p-8 bg-slate-50/30 flex items-center justify-between border-t border-[#8A9A5B]/5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monitorando {displayPatients.length} pacientes na base analítica</p>
                        <div className="flex gap-2">
                            <button className="px-5 py-2.5 bg-white border border-[#8A9A5B]/10 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed">Anterior</button>
                            <button className="px-5 py-2.5 bg-white border border-[#8A9A5B]/10 rounded-xl text-xs font-bold text-[#697D58] hover:bg-[#8A9A5B]/5 transition-all shadow-sm">Próximo</button>
                        </div>
                    </div>
                )}
            </div>

            {isFilterSheetOpen && (
                <PatientFilterSheet
                    open={isFilterSheetOpen}
                    onClose={() => setIsFilterSheetOpen(false)}
                />
            )}

            <PatientSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSave={() => queryClient.invalidateQueries({ queryKey: ['patients'] })}
                patient={selectedPatient}
            />

            <ImportPatientsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patients'] })}
            />
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, color = "text-[#8A9A5B]", bgColor = "bg-[#8A9A5B]/10" }: any) => (
    <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
        <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h5 className="text-2xl font-black text-[#1A202C]">{value}</h5>
            <p className="text-[10px] text-[#697D58] font-black uppercase tracking-tight">{trend}</p>
        </div>
    </div>
);

export default PatientsPage;
