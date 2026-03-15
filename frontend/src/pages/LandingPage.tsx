import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import React from 'react';
import {
    ChevronDown,
    TrendingUp,
    ShieldCheck,
    BarChart3,
    ArrowRight,
    MousePointer2,
    Layout,
    Activity,
    ChevronLeft,
    ChevronRight,
    Database,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
    {
        icon: <BarChart3 className="text-emerald-500" />,
        title: "Dashboard de Performance",
        desc: "Visualize lucros, despesas e lucratividade em tempo real com gráficos intuitivos.",
        color: "bg-emerald-50"
    },
    {
        icon: <Layout className="text-blue-500" />,
        title: "Gestão Multi-Clínica",
        desc: "Controle todas as suas unidades em uma única interface centralizada e segura.",
        color: "bg-blue-50"
    },
    {
        icon: <Zap className="text-amber-500" />,
        title: "Faturamento Automatizado",
        desc: "Geração de faturas SaaS, PDFs e XMLs de forma automática e sem erros.",
        color: "bg-amber-50"
    },
    {
        icon: <Database className="text-purple-500" />,
        title: "Auditoria Completa",
        desc: "Rastreabilidade total de cada centavo. Saiba exatamente de onde vem e para onde vai.",
        color: "bg-purple-50"
    },
    {
        icon: <Activity className="text-rose-500" />,
        title: "Insights Estratégicos",
        desc: "Relatórios avançados que ajudam na tomada de decisão baseada em dados reais.",
        color: "bg-rose-50"
    }
];

const FeatureCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % features.length);
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
    };

    return (
        <div className="relative w-full max-w-7xl mx-auto px-4 py-24 overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8">
                <div>
                    <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8A9A5B] mb-4 block"
                    >
                        Ecossistema Completo
                    </motion.span>
                    <h2 className="text-5xl md:text-7xl font-black text-[#697D58] tracking-tighter leading-none">
                        Ferramentas de <br />
                        <span className="text-[#8A9A5B]">Elite</span>.
                    </h2>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={prev}
                        className="p-5 rounded-full bg-white border border-slate-100 text-[#697D58] shadow-xl hover:bg-[#697D58] hover:text-white transition-all group active:scale-90"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        className="p-5 rounded-full bg-white border border-slate-100 text-[#697D58] shadow-xl hover:bg-[#697D58] hover:text-white transition-all group active:scale-90"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            <motion.div
                className="flex gap-8 cursor-grab active:cursor-grabbing pb-12"
                animate={{ x: isMobile ? `calc(-${currentIndex * 100}% - ${currentIndex * 32}px)` : `calc(-${currentIndex * 33.33}% - ${currentIndex * 26.6}px)` }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                drag="x"
                dragConstraints={{ left: -1000, right: 0 }}
            >
                {features.map((f, i) => (
                    <motion.div
                        key={i}
                        className="min-w-[320px] md:min-w-[420px] bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col gap-8 group hover:border-[#8A9A5B]/30 transition-all relative overflow-hidden"
                        whileHover={{ y: -12 }}
                    >
                        <div className={`w-20 h-20 ${f.color} rounded-3xl flex items-center justify-center relative z-10`}>
                            {React.cloneElement(f.icon as React.ReactElement<any>, { size: 40 })}
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-3xl font-black text-[#697D58] mb-4">{f.title}</h4>
                            <p className="text-slate-500 font-medium leading-relaxed text-lg">{f.desc}</p>
                        </div>
                        <div className="mt-auto pt-6 flex items-center gap-2 text-[#8A9A5B] font-black uppercase text-xs tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 relative z-10">
                            Descobrir mais <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </div>

                        {/* Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

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
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-center items-center backdrop-blur-sm bg-black/10 border-b border-white/5">
                <div className="w-full max-w-container flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {/* Applying a brightness filter to make the dark logo visible on dark background */}
                        <img src="/logo-alamino-dark.png" alt="Logo Rares360" className="h-28 w-auto object-contain brightness-0 invert opacity-90" />
                    </div>
                    <div className="flex items-center gap-8">
                        <Link to="/about" className="text-[#FDFCF0] font-bold hover:opacity-70 transition-opacity">Quem Somos</Link>
                        <Link
                            to="/login"
                            className="px-6 py-2.5 bg-[#697D58] text-[#FDFCF0] rounded-[4px] font-bold text-sm shadow-xl shadow-black/20 hover:scale-105 transition-all border border-white/10"
                        >
                            Acessar Plataforma
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Premium Aesthetic */}
            <section className="h-screen flex flex-col items-center justify-center relative px-6 text-center overflow-hidden bg-[#2D3325]">
                {/* Background Image with Deep Olive Overlay */}
                <div 
                    className="absolute inset-0 bg-cover bg-center scale-105"
                    style={{ backgroundImage: "url('/hero-luxury-bg.png')" }}
                />
                <div className="absolute inset-0 bg-[#2D3325]/85 backdrop-blur-[2px]" />

                <motion.div
                    style={{ opacity, scale: smoothScale, y: heroY }}
                    className="max-w-container mx-auto relative z-10"
                >
                    <h1 className="text-h1 text-[#FDFCF0] mb-8 leading-[1.05]">
                        O Futuro da sua <br />
                        <span className="text-[#FDFCF0]/90">Gestão Financeira</span>.
                    </h1>
                    <p className="text-body-lg text-[#FDFCF0]/80 max-w-2xl mx-auto leading-relaxed font-light">
                        Transformamos números em estratégia. Excelência em consultoria financeira para clínicas e negócios de alto padrão.
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mt-12 flex flex-col items-center gap-4"
                    >
                        <ChevronDown size={32} className="text-[#A39161] animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A39161]">Role para descobrir</span>
                    </motion.div>
                </motion.div>
            </section>

            {/* Section 2 - Reveal Cards */}
            <section className="min-h-screen py-section px-8 bg-[#697D58] text-white overflow-hidden">
                <div className="max-w-container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-h2 leading-tight mb-8">
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

            {/* Feature Carousel Section */}
            <section className="bg-white overflow-hidden">
                <FeatureCarousel />
            </section>

            {/* A Experiência Rares360 */}
            <section className="min-h-screen py-section px-8 bg-white relative text-center">
                <div className="max-w-container mx-auto">
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
                        className="text-h3 text-[#697D58] mb-20"
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
            <section className="py-section bg-[#F8FAFC] flex flex-col items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <h4 className="text-h2 text-[#697D58] mb-12">
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
                <div className="max-w-container mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#697D58]/10 rounded-lg flex items-center justify-center text-[#697D58]">
                            <TrendingUp size={16} />
                        </div>
                        <span className="font-black text-[#697D58]">Rares360</span>
                    </div>
                    <div>© 2026 Rares360. Todos os direitos reservados.</div>
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
