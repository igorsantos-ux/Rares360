import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Lock,
    ArrowRight,
    Github,
    Chrome
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Mock login delay
        setTimeout(() => {
            setIsLoading(false);
            navigate('/dashboard');
        }, 1500);
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
                <div className="flex flex-col items-center mb-10">
                    <Link to="/" className="flex items-center gap-3 mb-4 group transition-all">
                        <img src="/logo-alamino-dark.png" alt="Logo Roberta Alamino" className="w-80 h-auto object-contain group-hover:scale-105 transition-transform" />
                    </Link>
                </div>

                {/* Glassmorphism Card */}
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8A9A5B] to-transparent opacity-30"></div>

                    <h2 className="text-2xl font-black text-[#697D58] mb-2">Bem-vinda de volta</h2>
                    <p className="text-slate-500 font-medium mb-10">Entre com suas credenciais para gerenciar sua clínica.</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#697D58] uppercase tracking-widest ml-4">E-mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8A9A5B] transition-colors group-focus-within:text-[#697D58]" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@alamino.com"
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

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#8A9A5B]/20"></div></div>
                        <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-[#8A9A5B]"><span className="bg-transparent px-4 backdrop-blur-md italic">Acesso Restrito</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-3 py-4 bg-white/40 border border-white rounded-2xl font-bold text-sm text-[#697D58] hover:bg-white/60 transition-all shadow-sm">
                            <Chrome size={18} /> Google
                        </button>
                        <button className="flex items-center justify-center gap-3 py-4 bg-white/40 border border-white rounded-2xl font-bold text-sm text-[#697D58] hover:bg-white/60 transition-all shadow-sm">
                            <Github size={18} /> GitHub
                        </button>
                    </div>
                </div>

                <p className="mt-10 text-center text-slate-500 font-medium">
                    Ainda não é cliente? <Link to="/about" className="text-[#697D58] font-black border-b-2 border-[#8A9A5B]/20 hover:border-[#697D58] transition-all">Saiba mais sobre a Roberta</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
