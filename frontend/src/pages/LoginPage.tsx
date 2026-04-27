import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Lock,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const reason = sessionStorage.getItem('logoutReason');
        if (reason === 'inactivity') {
            setError('Sessão encerrada por inatividade. Faça login novamente.');
            sessionStorage.removeItem('logoutReason');
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await authApi.login({ email, password });
            const { token, user } = response.data;

            login(token, user);

            if (user.role?.toUpperCase() === 'ADMIN_GLOBAL') {
                navigate('/saas-dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0EAD6] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8A9A5B]/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#DEB587]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="w-full max-w-lg z-10"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10 w-full">
                    <Link to="/" className="flex items-center gap-3 mb-4 group transition-all w-full justify-center">
                        <img src="/logo-alamino-dark.png" alt="Logo Rares360" className="w-full max-w-[24rem] h-auto object-contain group-hover:scale-105 transition-transform" />
                    </Link>
                </div>

                {/* Glassmorphism Card */}
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8A9A5B] to-transparent opacity-30"></div>

                    <h2 className="text-2xl font-black text-[#697D58] mb-2">Bem-vinda de volta</h2>
                    <p className="text-slate-500 font-medium mb-10">Entre com suas credenciais para gerenciar sua clínica.</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold animate-pulse">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#697D58] uppercase tracking-widest ml-4">E-mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8A9A5B] transition-colors group-focus-within:text-[#697D58]" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@rares360.com"
                                    className="w-full bg-white/60 border border-white/80 rounded-2xl py-5 pl-16 pr-6 focus:ring-4 focus:ring-[#8A9A5B]/10 focus:border-[#8A9A5B] outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-4 mr-2">
                                <label className="text-xs font-black text-[#697D58] uppercase tracking-widest">Senha</label>
                                <a href="#" className="text-[10px] font-black text-[#8A9A5B] uppercase tracking-widest hover:text-[#697D58]">Esqueceu a senha?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8A9A5B] transition-colors group-focus-within:text-[#697D58]" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/60 border border-white/80 rounded-2xl py-5 pl-16 pr-6 focus:ring-4 focus:ring-[#8A9A5B]/10 focus:border-[#8A9A5B] outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 shadow-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-[#697D58] text-white rounded-2xl font-black shadow-xl shadow-[#697D58]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Entrar na Plataforma <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>

                </div>

                <p className="mt-10 text-center text-slate-500 font-medium">
                    Ainda não é cliente? <Link to="/about" className="text-[#697D58] font-black border-b-2 border-[#8A9A5B]/20 hover:border-[#697D58] transition-all">Saiba mais sobre a Rares360</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
