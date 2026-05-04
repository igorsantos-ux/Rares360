import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, Shield, Clock, BarChart3, Zap } from 'lucide-react';
import LeadCaptureForm from '../components/LeadCaptureForm';

const DemoPage = () => {
    return (
        <div className="min-h-screen bg-[#1C2B1A] overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-5 backdrop-blur-md bg-[#1C2B1A]/80 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-white/70 font-bold hover:text-white transition-colors">
                        <ChevronLeft size={20} /> Voltar ao site
                    </Link>
                    <img src="/logo-alamino-dark.png" alt="Rares360" className="h-16 w-auto object-contain brightness-0 invert-[1] opacity-80" />
                </div>
            </nav>

            <section className="pt-32 pb-24 px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left — Copy */}
                    <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.6 }} className="space-y-8 lg:sticky lg:top-32">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-[#BA7517] uppercase tracking-[0.4em]">Demonstração Gratuita</span>
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1]">
                                Descubra como a Rares360 pode <span className="text-[#BA7517]">transformar sua clínica</span>
                            </h1>
                            <p className="text-lg text-white/50 font-light leading-relaxed max-w-lg">
                                Preencha o formulário e nossa equipe entrará em contato para uma demonstração personalizada da plataforma.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: <Clock size={18} />, title: 'Resposta em 24h', desc: 'Contato rápido' },
                                { icon: <Shield size={18} />, title: 'Dados seguros', desc: 'LGPD compliant' },
                                { icon: <BarChart3 size={18} />, title: 'Demo gratuita', desc: 'Sem compromisso' },
                                { icon: <Zap size={18} />, title: 'Setup em 48h', desc: 'Implementação ágil' },
                            ].map((item, i) => (
                                <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.3 + i*0.1 }} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="text-[#3B6D11] mb-2">{item.icon}</div>
                                    <p className="text-white font-bold text-sm">{item.title}</p>
                                    <p className="text-white/40 text-xs">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right — Form */}
                    <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-black/20">
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-white mb-1">Solicite sua demonstração</h2>
                            <p className="text-white/40 text-sm">Leva menos de 2 minutos</p>
                        </div>
                        <LeadCaptureForm />
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">© 2026 RARES360. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default DemoPage;
