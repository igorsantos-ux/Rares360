import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '../../services/api';
import { Loader2, ArrowLeft } from 'lucide-react';
import PatientHeader from '../../components/Patients/PEP/PatientHeader';
import PatientSidebar from '../../components/Patients/PEP/PatientSidebar';
import EvolutionModule from '../../components/Patients/PEP/Modules/EvolutionModule';
import { 
    MainDataModule, 
    PrescriptionModule, 
    InventoryModule, 
    HistoryModule, 
    FinancialModule, 
    DocumentsModule 
} from '../../components/Patients/PEP/Modules/Placeholders';

const PatientPEP = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeModule, setActiveModule] = useState('evolutions');

    const { data: patient, isLoading, error } = useQuery({
        queryKey: ['patient', id],
        queryFn: async () => {
            const response = await coreApi.getPatientById(id!);
            return response.data;
        },
        enabled: !!id
    });

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#F5F5DC]/30">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-[#697D58] font-bold uppercase tracking-widest text-xs">Acessando Prontuário...</p>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-bold">Erro ao carregar paciente.</p>
                <button onClick={() => navigate('/patients')} className="text-[#8A9A5B] underline">Voltar para lista</button>
            </div>
        );
    }

    const renderModule = () => {
        switch (activeModule) {
            case 'data': return <MainDataModule patient={patient} />;
            case 'evolutions': return <EvolutionModule patient={patient} />;
            case 'prescriptions': return <PrescriptionModule patient={patient} />;
            case 'inventory': return <InventoryModule patient={patient} />;
            case 'history': return <HistoryModule patient={patient} />;
            case 'financial': return <FinancialModule patient={patient} />;
            case 'documents': return <DocumentsModule patient={patient} />;
            default: return <EvolutionModule patient={patient} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5DC]/20 animate-in fade-in duration-500">
            {/* Header de Identificação */}
            <div className="bg-white border-b border-[#8A9A5B]/10 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button 
                            onClick={() => navigate('/patients')}
                            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">PACIENTE CONCIERGE</span>
                    </div>
                    <PatientHeader patient={patient} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1600px] mx-auto flex gap-8 p-6">
                {/* Lateral Navigation (PEP Sidebar) */}
                <aside className="w-80 shrink-0">
                    <PatientSidebar activeModule={activeModule} onModuleChange={setActiveModule} />
                </aside>

                {/* Module Viewport */}
                <main className="flex-1 min-w-0 bg-white rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-xl overflow-hidden min-h-[70vh]">
                    {renderModule()}
                </main>
            </div>
        </div>
    );
};

export default PatientPEP;
