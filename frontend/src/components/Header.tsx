import { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    Package,
    TrendingUp,
    Target,
    FileText,
    Wallet,
    BarChart3,
    ArrowDownCircle,
    ArrowUpCircle,
    FolderOpen,
    LogOut,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigationGroups = [
        {
            label: "Principal",
            items: [
                { icon: <LayoutDashboard size={18} />, label: "Dashboard", path: "/dashboard" },
                { icon: <BarChart3 size={18} />, label: "Faturamento", path: "/billing" },
                { icon: <Users size={18} />, label: "Pacientes", path: "/patients" },
            ]
        },
        {
            label: "Financeiro",
            items: [
                { icon: <TrendingUp size={18} />, label: "Fluxo de Caixa", path: "/cash-flow" },
                { icon: <ArrowUpCircle size={18} />, label: "Contas a Receber", path: "/receivables" },
                { icon: <ArrowDownCircle size={18} />, label: "Contas a Pagar", path: "/payables" },
                { icon: <Wallet size={18} />, label: "Recebimentos (Caixa)", path: "/income" },
                { icon: <FileText size={18} />, label: "DRE", path: "/dre" },
                { icon: <FileText size={18} />, label: "DFC", path: "/dfc" },
            ]
        },
        {
            label: "Gestão",
            items: [
                { icon: <Target size={18} />, label: "Metas", path: "/goals" },
                { icon: <Package size={18} />, label: "Estoque", path: "/inventory" },
                { icon: <FolderOpen size={18} />, label: "Documentos", path: "/documents" },
            ]
        }
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#F0EAD6]/80 backdrop-blur-md border-b border-[#8A9A5B]/20 h-20 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                {/* Logo Section */}
                <Link to="/dashboard" className="flex items-center gap-2 group">
                    <img src="/logo-alamino-dark.png" alt="Logo" className="h-14 w-auto object-contain group-hover:scale-105 transition-transform" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-8 h-full">
                    {navigationGroups.map((group) => (
                        <div key={group.label} className="relative h-full flex items-center group/nav">
                            <button className="flex items-center gap-2 text-slate-600 font-bold hover:text-[#697D58] transition-colors py-2">
                                {group.label}
                                <ChevronDown size={14} className="group-hover/nav:rotate-180 transition-transform duration-300" />
                            </button>

                            {/* Dropdown Card */}
                            <div className="absolute top-[80%] left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-300 transform group-hover/nav:translate-y-0 translate-y-2">
                                <div className="bg-white rounded-2xl shadow-2xl border border-[#8A9A5B]/10 p-4 min-w-[240px]">
                                    <div className="space-y-1">
                                        {group.items.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${location.pathname === item.path
                                                    ? 'bg-[#8A9A5B] text-white shadow-md shadow-[#8A9A5B]/20'
                                                    : 'text-slate-500 hover:bg-[#8A9A5B]/10 hover:text-[#697D58]'
                                                    }`}
                                            >
                                                <span className={location.pathname === item.path ? 'text-white' : 'text-slate-400 group-hover:text-[#8A9A5B]'}>
                                                    {item.icon}
                                                </span>
                                                <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Right Actions (Meta & Profile) */}
                <div className="hidden lg:flex items-center gap-6">
                    {/* Compact Meta Progress */}
                    <div className="flex items-center gap-4 bg-white/40 p-2 pr-4 rounded-full border border-[#8A9A5B]/10 group cursor-help transition-all hover:bg-white/60">
                        <div className="w-8 h-8 rounded-full bg-[#8A9A5B]/20 flex items-center justify-center text-[#697D58]">
                            <Target size={16} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Meta</span>
                                <span className="text-[10px] font-black text-[#697D58]">65%</span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                                <div className="h-full bg-[#8A9A5B] w-[65%] rounded-full shadow-sm shadow-[#8A9A5B]/20"></div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 group"
                        title="Sair"
                    >
                        <LogOut size={18} className="group-active:scale-90 transition-transform" />
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden p-2 text-slate-600 hover:bg-[#8A9A5B]/10 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden absolute top-20 left-0 right-0 bg-white border-b border-[#8A9A5B]/20 shadow-xl overflow-y-auto max-h-[calc(100vh-80px)] p-6"
                    >
                        <div className="space-y-8">
                            {navigationGroups.map((group) => (
                                <div key={group.label}>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9A5B] mb-4">{group.label}</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.items.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path
                                                    ? 'bg-[#8A9A5B] text-white shadow-lg shadow-[#8A9A5B]/20'
                                                    : 'text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {item.icon}
                                                <span className="font-bold">{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{user?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-3 bg-red-50 text-red-500 rounded-xl"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
