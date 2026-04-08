import {
    LayoutDashboard,
    Users,
    Package,
    TrendingUp,
    Target,
    BarChart3,
    ArrowDownCircle,
    ArrowUpCircle,
    FolderOpen,
    LogOut,
    Calculator,
    Activity,
    FileText,
    Lock as LockIcon,
    CheckSquare,
    Calendar,
    ChevronDown,
    Stethoscope,
    ArrowLeft
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user, activeClinicId, clearContext } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Busca metas reais para o indicador global
    const { data: goalsResponse } = useQuery({
        queryKey: ['goals-report'],
        queryFn: () => reportingApi.getGoals(),
        staleTime: 1000 * 60 * 5 // 5 minutos de cache
    });

    const goals = Array.isArray(goalsResponse?.data) ? goalsResponse.data : [];
    const globalProgress = goals.length > 0
        ? Math.round(goals.reduce((acc: number, g: any) => acc + (Math.min(((g.current || g.achieved || 0) / g.target) * 100, 100)), 0) / goals.length)
        : 0;

    const navItems = [
        { label: "Principal", items: [
            { icon: <LayoutDashboard size={20} />, label: "Painel Financeiro", path: "/dashboard" },
            { icon: <CheckSquare size={20} />, label: "Tarefas", path: "/tasks", id: "tarefas-dia" },
            { icon: <Calendar size={20} />, label: "Agenda", path: "/agenda", id: "agenda-inteligente" },
            { icon: <LockIcon size={20} />, label: "Caixa", path: "/fechamento-caixa", id: "fechamento-caixa" },
            { icon: <FileText size={20} />, label: "DRE", path: "/dre" },
            { icon: <Activity size={20} />, label: "DFC", path: "/dfc" },
        ]},
        { label: "Financeiro", items: [
            { icon: <BarChart3 size={20} />, label: "Faturamento", path: "/billing" },
            { icon: <ArrowUpCircle size={20} />, label: "Contas a Receber (Pendências)", path: "/pendenciais" },
            { icon: <ArrowDownCircle size={20} />, label: "Contas a Pagar", path: "/payables" },
            { icon: <TrendingUp size={20} />, label: "Fluxo de Caixa", path: "/cash-flow" },
        ]},
        { label: "Gestão", items: [
            { icon: <Calculator size={20} />, label: "Precificação", path: "/pricing" },
            { icon: <Users size={20} />, label: "Pacientes", path: "/patients" },
            { icon: <Stethoscope size={20} />, label: "Médicos", path: "/medicos" },
            { icon: <FileText size={20} />, label: "Minha Clínica", path: "/my-clinic" },
            { icon: <Package size={20} />, label: "Estoque", path: "/inventory", id: "estoque-insumos" },
            { icon: <Target size={20} />, label: "Metas", path: "/goals" },
            { icon: <FolderOpen size={20} />, label: "Documentos", path: "/documents", id: "documentos-compliance" },
        ]}
    ];

    const [openSection, setOpenSection] = useState<string | null>(null);

    // Efeito para abrir a seção correta inicialmente
    useEffect(() => {
        const currentPath = location.pathname;
        const activeGroup = navItems.find(group => 
            group.items.some(item => item.path === currentPath)
        );
        if (activeGroup) {
            setOpenSection(activeGroup.label);
        }
    }, [location.pathname]);

    const toggleSection = (label: string) => {
        setOpenSection(prev => prev === label ? null : label);
    };

    return (
        <aside className="w-72 bg-[#F0EAD6] text-slate-800 flex flex-col h-screen border-r border-[#8A9A5B]/20 shadow-sm overflow-hidden">
            <div className="p-8 flex justify-center border-b border-[#8A9A5B]/10">
                <img src="/logo-alamino-dark.png" alt="Logo Rares360" className="h-32 w-auto object-contain" />
            </div>

            {/* Botão de Retorno ao Painel Global (Apenas para Admin Global em contexto) */}
            {user?.role === 'ADMIN_GLOBAL' && activeClinicId && (
                <div className="px-4 pt-6">
                    <button
                        onClick={clearContext}
                        className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#697D58] text-white rounded-2xl shadow-lg shadow-[#697D58]/20 hover:bg-[#8A9A5B] transition-all duration-300 group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-black text-xs uppercase tracking-widest">Painel Global</span>
                    </button>
                </div>
            )}

            <nav className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar space-y-4">
                {Array.isArray(navItems) ? navItems.map((group) => {
                    const isOpen = openSection === group.label;
                    return (
                        <div key={group.label} className="space-y-1">
                            <button 
                                onClick={() => toggleSection(group.label)}
                                className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-black text-[#8A9A5B] uppercase tracking-[0.2em] group transition-all duration-200 hover:bg-[#8A9A5B]/5 rounded-lg"
                            >
                                <span className="opacity-60 group-hover:opacity-100 transition-opacity">{group.label}</span>
                                <ChevronDown 
                                    size={14} 
                                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} opacity-40 group-hover:opacity-100`} 
                                />
                            </button>
                            
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-1 py-1">
                                            {group.items.map((item) => (
                                                <SidebarLink key={item.path} item={item} active={location.pathname === item.path} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                }) : null}
            </nav>

            <div className="p-6 mt-auto bg-white/30 backdrop-blur-sm border-t border-[#8A9A5B]/10">
                <div className="bg-white/60 p-4 rounded-2xl border border-[#8A9A5B]/10 shadow-sm mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta Mensal</p>
                        <p className="text-[10px] font-black text-[#8A9A5B]">{globalProgress}%</p>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#8A9A5B] rounded-full transition-all duration-1000"
                            style={{ width: `${globalProgress}%` }}
                        ></div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group font-bold text-sm"
                >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                    Sair da Conta
                </button>
            </div>
        </aside>
    );
};

const SidebarLink = ({ item, active }: { item: any; active: boolean }) => (
    <Link
        id={item.id}
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
            ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20'
            : 'text-slate-600 hover:bg-[#8A9A5B]/10 hover:text-[#697D58]'
            }`}
    >
        {active && (
            <motion.div 
                layoutId="active-nav-indicator"
                className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#697D58]"
                initial={false}
            />
        )}
        <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-[#8A9A5B]'} transition-colors`}>
            {item.icon}
        </span>
        <span className={`font-black text-sm tracking-tight ${active ? 'translate-x-1' : ''} transition-transform`}>
            {item.label}
        </span>
    </Link>
);

export default Sidebar;
