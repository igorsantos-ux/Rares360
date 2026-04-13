import {
    ClipboardList,
    FileSignature,
    PackageSearch,
    History,
    WalletCards,
    Files,
    UserCheck,
    LayoutDashboard
} from 'lucide-react';

const icons = {
    data: <UserCheck size={18} />,
    evolutions: <ClipboardList size={18} />,
    prescriptions: <FileSignature size={18} />,
    inventory: <PackageSearch size={18} />,
    history: <History size={18} />,
    financial: <WalletCards size={18} />,
    documents: <Files size={18} />
};

const PatientSidebar = ({ activeModule, onModuleChange }: any) => {
    const items = [
        { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={18} /> },
        { id: 'evolutions', label: 'Evolução Clínica', icon: icons.evolutions },
        { id: 'prescriptions', label: 'Receituário Digital', icon: icons.prescriptions },
        { id: 'inventory', label: 'Estoque & Insumos', icon: icons.inventory },
        { id: 'history', label: 'Histórico de Consultas', icon: icons.history },
        { id: 'financial', label: 'Propostas & Orçamentos', icon: icons.financial },
        { id: 'documents', label: 'Documentos & Exames', icon: icons.documents },
        { id: 'data', label: 'Dados Cadastrais', icon: icons.data },
    ];

    return (
        <div className="bg-white/50 backdrop-blur-md rounded-[2rem] border border-[#8A9A5B]/10 p-3 space-y-1 shadow-sm sticky top-[160px]">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onModuleChange(item.id)}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${activeModule === item.id
                        ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20'
                        : 'text-slate-500 hover:bg-[#F5F5DC]/50 hover:text-[#697D58]'
                        }`}
                >
                    <div className={`${activeModule === item.id ? 'text-white' : 'text-[#8A9A5B]/60'}`}>
                        {item.icon}
                    </div>
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default PatientSidebar;
