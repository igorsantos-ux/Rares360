import { useState } from 'react';
import {
    Menu,
    X,
    LogOut,
    User as UserIcon,
    Bell
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Mapeamento de títulos de página
    const pageTitles: Record<string, string> = {
        '/dashboard': 'Painel Financeiro',
        '/billing': 'Faturamento Detalhado',
        '/patients': 'Gestão de Pacientes',
        '/cash-flow': 'Fluxo de Caixa',
        '/pendenciais': 'Contas a Receber',
        '/payables': 'Contas a Pagar',
        '/income': 'Recebimentos',
        '/pricing': 'Simulador de Precificação',
        '/inventory': 'Estoque de Insumos',
        '/goals': 'Metas da Clínica',
        '/documents': 'Documentos e Arquivos',
        '/dre': 'DRE (Demonstrativo)',
        '/dfc': 'DFC (Fluxo de Caixa Indireto)',
        '/fechamento-caixa': 'Caixa',
        '/automations': 'Automatizações CRM'
    };

    const currentTitle = pageTitles[location.pathname] || 'Visão Geral';

    return (
        <>
            <header className="h-20 bg-white/40 backdrop-blur-md border-b border-[#8A9A5B]/10 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    {/* Botão Mobile Burger */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 hover:bg-[#8A9A5B]/10 rounded-lg text-slate-600 transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">{currentTitle}</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                            {user?.clinic?.name ? `${user.clinic.name} • Healthcare Management` : 'Rares360 • Healthcare Management'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-8">
                    {/* Notificações (Placeholder) */}
                    <button className="hidden sm:flex p-2.5 bg-white rounded-xl border border-[#8A9A5B]/10 text-slate-400 hover:text-[#8A9A5B] hover:shadow-sm transition-all">
                        <Bell size={20} />
                    </button>

                    {/* Perfil do Usuário */}
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-black text-slate-800">{user?.name}</span>
                            <span className="text-[10px] text-[#8A9A5B] font-bold uppercase tracking-widest">{user?.role?.replace('_', ' ')}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#8A9A5B]/10 border border-[#8A9A5B]/20 flex items-center justify-center text-[#8A9A5B]">
                            <UserIcon size={20} />
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Sair"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Drawer (Simplificado) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 bg-[#F0EAD6] z-[60] lg:hidden shadow-2xl"
                        >
                            <div className="absolute top-6 right-6">
                                <button 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 hover:bg-[#8A9A5B]/10 rounded-full text-slate-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            {/* Reutiliza o Sidebar componente dentro do drawer */}
                            <div onClick={() => setIsMobileMenuOpen(false)}>
                                <Sidebar />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;
