import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import {
    ChevronDown,
    TrendingUp,
    ShieldCheck,
    BarChart3,
    ArrowRight,
    MousePointer2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
    const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);

    // Smooth spring for the scale-down effect like Apple
    const smoothScale = useSpring(scale, { damping: 15, stiffness: 100 });

    return (
        <div className="bg-[#F8FAFC] overflow-x-hidden" ref={targetRef}>
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-between items-center backdrop-blur-md bg-white/30 border-b border-[#8A9A5B]/10">
                <div className="flex items-center gap-2">
                    <img src="/logo-alamino-dark.png" alt="Logo Roberta Alamino" className="h-20 w-auto object-contain" />
                </div>
                <div className="flex items-center gap-8">
                    <Link to="/about" className="text-[#697D58] font-bold hover:opacity-70 transition-opacity">Quem Somos</Link>
                    <Link
                        to="/login"
                        className="px-6 py-2.5 bg-[#697D58] text-white rounded-full font-bold text-sm shadow-xl shadow-[#697D58]/20 hover:scale-105 transition-all"
                    >
                        Acessar Plataforma
                    </Link>
                </div>
            </nav>

            {/* Hero Section - Apple Style Scale Down */}
            <section className="h-screen flex flex-col items-center justify-center relative px-6 text-center">
                <motion.div
                    style={{ opacity, scale: smoothScale, y: heroY }}
                    className="max-w-5xl mx-auto"
                >
                    <h1 className="text-7xl md:text-9xl font-black text-[#697D58] leading-tight mb-8 tracking-tighter">
                        O Futuro da sua <br />
                        <span className="text-[#8A9A5B]">Gestão Financeira</span>.
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        Transformamos números em estratégia. Excelência em consultoria financeira para clínicas e negócios de alto padrão.
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mt-12 flex flex-col items-center gap-4"
                    >
                        <ChevronDown size={32} className="text-[#8A9A5B] animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#8A9A5B]">Role para descobrir</span>
                    </motion.div>
                </motion.div>

                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-screen opacity-10 pointer-events-none -z-10">
                    <img
                        src="/financial_luxury_abstract_1772753693181.png"
                        alt="Background Decor"
                        className="w-full h-full object-cover blur-2xl"
                    />
                </div>
            </section>

            {/* Section 2 - Reveal Cards */}
            <section className="min-h-screen py-32 px-8 bg-[#697D58] text-white overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-black leading-tight mb-8 tracking-tight">
                            Dados que <br />
                            contam histórias.
                        </h2>
                        <p className="text-xl text-[#F0EAD6]/80 font-medium leading-relaxed mb-12">
                            Não entregamos apenas relatórios. Entregamos clareza.
                            Cada centavo do seu negócio é mapeado, analisado e otimizado por quem entende de performance.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FeatureCard
                                icon={<ShieldCheck size={24} />}
                                title="Segurança Total"
                                desc="Auditoria rigorosa de todas as movimentações."
                            />
                            <FeatureCard
                                icon={<BarChart3 size={24} />}
                                title="Visão 360º"
                                desc="Dashboards em tempo real com KPIs críticos."
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, type: "spring" }}
                        className="relative"
                    >
                        <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-4 border border-white/20 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
                            <div className="text-center group cursor-default">
                                <div className="text-8xl font-black text-[#DEB587] mb-2 group-hover:scale-110 transition-transform">+R$ 2.4M</div>
                                <div className="text-xl font-bold text-white/60 tracking-widest uppercase">Otimizado este ano</div>
                            </div>
                        </div>
                        {/* Parallax accents */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#DEB587]/30 rounded-full blur-[80px]"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-[80px]"></div>
                    </motion.div>
                </div>
            </section>

            {/* Section 3 - The "Roberta Alamino" Way */}
            <section className="min-h-screen py-32 px-8 bg-white relative">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-xs font-black uppercase tracking-[0.5em] text-[#8A9A5B] mb-6 block"
                    >
                        Consultoria Premium
                    </motion.span>
                    <motion.h3
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-6xl font-black text-[#697D58] mb-20 tracking-tight"
                    >
                        Excelência em cada detalhe, <br />
                        do lucro ao investimento.
                    </motion.h3>

                    <div className="space-y-32">
                        <AnimatedStep
                            num="01"
                            title="Diagnóstico Profundo"
                            text="Analisamos o histórico financeiro da sua clínica para identificar gargalos invisíveis e oportunidades de economia imediata."
                        />
                        <AnimatedStep
                            num="02"
                            title="Estruturação Estratégica"
                            text="Implementamos processos de DRE, DFC e Gestão de Fluxo de Caixa que funcionam sozinhos, libertando seu tempo para o que importa."
                        />
                        <AnimatedStep
                            num="03"
                            title="Crescimento Sustentável"
                            text="Acompanhamento mensal com metas claras de lucratividade e expansão. O controle total do seu patrimônio."
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-40 bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <h4 className="text-6xl md:text-8xl font-black text-[#697D58] mb-12 tracking-tighter">
                        Assuma o controle.
                    </h4>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-4 px-12 py-6 bg-[#697D58] text-white text-2xl font-black rounded-full shadow-2xl shadow-[#697D58]/30 hover:scale-105 active:scale-95 transition-all group"
                    >
                        Entrar na Plataforma <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                    <p className="mt-8 text-slate-400 font-bold flex items-center justify-center gap-2">
                        <MousePointer2 size={18} /> Acesso exclusivo para clientes gerenciados
                    </p>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 border-t border-[#8A9A5B]/10 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#697D58]/10 rounded-lg flex items-center justify-center text-[#697D58]">
                            <TrendingUp size={16} />
                        </div>
                        <span className="font-black text-[#697D58]">Roberta Alamino</span>
                    </div>
                    <div>© 2026 Heath Finance. Todos os direitos reservados.</div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-[#697D58] transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-[#697D58] transition-colors">Termos</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: any) => (
    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#DEB587] mb-6 mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h5 className="text-2xl font-black mb-3">{title}</h5>
        <p className="text-white/60 font-medium leading-relaxed">{desc}</p>
    </div>
);

const AnimatedStep = ({ num, title, text }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
        >
            <div className="text-8xl font-black text-[#8A9A5B]/10 mb-[-40px] select-none tracking-tighter">{num}</div>
            <h4 className="text-3xl font-black text-[#697D58] mb-6 relative z-10">{title}</h4>
            <p className="max-w-lg mx-auto text-slate-500 font-medium leading-relaxed">
                {text}
            </p>
        </motion.div>
    );
};

export default LandingPage;
