import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import {
    ChevronDown,
    TrendingUp,
    BarChart3,
    ArrowRight,
    Users,
    Package,
    Scale,
    Target,
    ArrowUpRight,
    HeartPulse,
    CheckCircle2,
    Instagram,
    Linkedin,
    Mail,
    Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Nova seção de Metodologia (Grid de 6 Cards)
const MethodologyGrid = () => {
    const pillars = [
        {
            icon: <TrendingUp size={28} />,
            title: "Faturamento Estratégico",
            desc: "Entenda quem gera resultado, com que frequência e o momento exato em que o paciente deve retornar."
        },
        {
            icon: <Users size={28} />,
            title: "Gestão Inteligente de Pacientes",
            desc: "Identifique ativos e inativos, compreenda o LTV (Lifetime Value) e gere recorrência real na sua base."
        },
        {
            icon: <Package size={28} />,
            title: "Estoque Real",
            desc: "Baixa automática vinculada à execução técnica e controle rigoroso de validade para reduzir perdas invisíveis."
        },
        {
            icon: <Scale size={28} />,
            title: "Precificação com Margem",
            desc: "Pare de seguir o mercado sem critério; precifique com base na sua estrutura de custos e margem real."
        },
        {
            icon: <ArrowUpRight size={28} />,
            title: "Direcionamento de Despesas",
            desc: "Gestão financeira não é sobre cortar custos aleatoriamente, é sobre saber onde investir com clareza."
        },
        {
            icon: <Target size={28} />,
            title: "Metas com Direção",
            desc: "Transforme objetivos em planos de ação. Saiba exatamente o que fazer hoje para bater a meta de amanhã."
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-20 px-4 max-w-7xl mx-auto">
            {pillars.map((p, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 hover:border-[#8A9A5B]/30 hover:scale-[1.02] transition-all group"
                >
                    <div className="w-14 h-14 bg-[#697D58]/5 text-[#697D58] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#697D58] group-hover:text-white transition-colors">
                        {p.icon}
                    </div>
                    <h4 className="text-2xl font-bold text-[#697D58] mb-4 tracking-tight">{p.title}</h4>
                    <p className="text-slate-500 font-light leading-relaxed text-lg">{p.desc}</p>
                </motion.div>
            ))}
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
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-center items-center backdrop-blur-md bg-black/30 border-b border-white/10">
                <div className="w-full max-w-container flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {/* High contrast white logo filter */}
                        <img 
                            src="/logo-alamino-dark.png" 
                            alt="Logo RARES" 
                            className="h-28 w-auto object-contain brightness-0 invert-[1] contrast-[200%]" 
                        />
                    </div>
                    <div className="flex items-center gap-8">
                        <Link to="/about" className="text-white font-bold hover:text-[#FDFCF0]/70 transition-colors text-lg">Quem Somos</Link>
                        <Link to="/contact" className="text-white font-bold hover:text-[#FDFCF0]/70 transition-colors text-lg">Contato</Link>
                        <Link
                            to="/login"
                            className="px-6 py-2.5 bg-[#697D58] text-white rounded-[4px] font-bold text-sm shadow-xl shadow-black/40 hover:scale-105 transition-all border border-white/20"
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
                    className="max-w-7xl mx-auto relative z-10"
                >
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-black uppercase tracking-[0.6em] text-[#DEB587] mb-8 block"
                    >
                        Gestão Médica de Alta Performance
                    </motion.span>
                    <h1 className="text-6xl md:text-[7.5rem] text-[#FDFCF0] mb-8 leading-[0.95] font-bold tracking-tight text-balance">
                        Construindo uma gestão onde <br />
                        <span className="text-[#DEB587]">tudo faz sentido</span>.
                    </h1>
                    <p className="text-xl md:text-2xl text-[#FDFCF0]/70 max-w-3xl mx-auto leading-relaxed font-light text-balance mb-12">
                        A Rares atua na estruturação, organização e direcionamento de clínicas médicas que desejam crescer com clareza, previsibilidade e resultado.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <Link
                            to="/contact"
                            className="px-10 py-5 bg-[#DEB587] text-[#2D3325] rounded-[4px] font-bold text-lg hover:scale-105 transition-all shadow-2xl shadow-black/40"
                        >
                            Falar com um Especialista
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="mt-20 flex flex-col items-center gap-4"
                    >
                        <ChevronDown size={28} className="text-[#FDFCF0]/30 animate-bounce" />
                    </motion.div>
                </motion.div>
            </section>

            {/* Seção 1: O Que Fazemos (3 Colunas) */}
            <section className="py-24 md:py-32 bg-white px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 md:gap-24 items-start">
                        <div className="space-y-6">
                            <div className="w-12 h-12 bg-[#697D58]/10 rounded-xl flex items-center justify-center text-[#697D58]">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-3xl font-bold text-[#697D58]">O financeiro <br />direciona</h3>
                            <p className="text-slate-500 font-light text-lg">Não é apenas sobre controlar faturamento; é sobre usar números para orientar cada decisão estratégica do negócio.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="w-12 h-12 bg-[#DEB587]/10 rounded-xl flex items-center justify-center text-[#DEB587]">
                                <Target size={24} />
                            </div>
                            <h3 className="text-3xl font-bold text-[#697D58]">O comercial <br />executa com estratégia</h3>
                            <p className="text-slate-500 font-light text-lg">Identificamos os ativos reais da sua base para gerar recorrência orgânica e estruturada.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="w-12 h-12 bg-[#697D58]/10 rounded-xl flex items-center justify-center text-[#697D58]">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="text-3xl font-bold text-[#697D58]">A operação <br />sustenta o crescimento</h3>
                            <p className="text-slate-500 font-light text-lg">Processos integrados que garantem que o crescimento não se torne um gargalo operacional.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção 2: Choque de Realidade (Pain Point) */}
            <section className="py-24 md:py-32 bg-[#F8FAFC] px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center mb-24">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-[#697D58]/50 mb-6 block"
                    >
                        O Problema Oculto
                    </motion.span>
                    <h2 className="text-5xl md:text-7xl font-bold text-[#697D58] tracking-tight mb-8">Por que a maioria das <br />clínicas trava?</h2>
                    <p className="text-xl md:text-2xl text-slate-500 max-w-4xl mx-auto font-light leading-relaxed">
                        Muitas possuem DRE, metas e fluxo de caixa. Mas não crescem com consistência porque os <strong>dados não estão conectados</strong> e não geram direcionamento claro.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="text-6xl font-black text-[#DEB587]/20 mb-6">01</div>
                        <p className="text-slate-600 font-medium text-lg leading-relaxed">
                            O financeiro analisa dados passados, mas <strong>não direciona</strong> o que deve ser feito no futuro.
                        </p>
                    </div>
                    <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="text-6xl font-black text-[#DEB587]/20 mb-6">02</div>
                        <p className="text-slate-600 font-medium text-lg leading-relaxed">
                            O comercial atua de forma reativa, sem uma base de <strong>inteligência de pacientes</strong>.
                        </p>
                    </div>
                    <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="text-6xl font-black text-[#DEB587]/20 mb-6">03</div>
                        <p className="text-slate-600 font-medium text-lg leading-relaxed">
                            A operação absorve demandas, mas não acompanha o <strong>ritmo do crescimento</strong> planejado.
                        </p>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <p className="text-3xl font-bold text-[#697D58] italic opacity-80">"O resultado é um crescimento baseado no 'feeling'. O problema não é esforço, é gestão."</p>
                </div>
            </section>

            {/* Seção 3: Metodologia Rares */}
            <section className="py-24 md:py-32 bg-white px-8">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-bold text-[#697D58] mb-6">Metodologia Rares</h2>
                    <p className="text-lg md:text-xl text-slate-500 font-light max-w-2xl mx-auto">Conectamos todas as áreas do negócio através de pilares integrados.</p>
                </div>
                <MethodologyGrid />
            </section>

            {/* Seção 4: CRM e Follow-up */}
            <section className="py-24 md:py-32 bg-[#2D3325] theme-dark px-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-[#DEB587] rounded-2xl flex items-center justify-center text-[#2D3325] mb-8">
                            <HeartPulse size={32} />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold text-[#FDFCF0] mb-8 leading-none">Acompanhamento <br />Ativo de Pacientes</h2>
                        <p className="text-xl md:text-2xl text-[#FDFCF0]/60 font-light leading-relaxed mb-12">
                            A clínica passa a ter controle real do pós-atendimento. Procedimentos executados geram tarefas automáticas de retorno. Mais relacionamento, mais faturamento.
                        </p>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-[#FDFCF0]/80">
                                <CheckCircle2 className="text-[#DEB587]" />
                                <span className="text-lg font-medium">Tarefas organizadas por dia</span>
                            </div>
                            <div className="flex items-center gap-4 text-[#FDFCF0]/80">
                                <CheckCircle2 className="text-[#DEB587]" />
                                <span className="text-lg font-medium">Follow-up automatizado via CRM</span>
                            </div>
                            <div className="flex items-center gap-4 text-[#FDFCF0]/80">
                                <CheckCircle2 className="text-[#DEB587]" />
                                <span className="text-lg font-medium">Aumento real na taxa de recorrência</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#DEB587]/20 blur-[120px] rounded-full group-hover:bg-[#DEB587]/30 transition-all"></div>
                        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 relative z-10">
                            <div className="flex items-center justify-between mb-12">
                                <div className="text-white">
                                    <div className="text-sm font-bold uppercase tracking-widest text-[#DEB587] mb-2">Check-in de Hoje</div>
                                    <div className="text-4xl font-bold">12 Retornos</div>
                                </div>
                                <div className="w-16 h-16 rounded-full border-4 border-[#DEB587] flex items-center justify-center text-[#DEB587] font-bold">
                                    85%
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                                            <div>
                                                <div className="text-white font-bold text-sm">Paciente Exemplo {i}</div>
                                                <div className="text-white/40 text-xs">Retorno Botox - 15 dias</div>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-[#DEB587] text-[#2D3325] rounded-lg text-xs font-bold">Agendar</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
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

            {/* Final CTA - Premium Reveal */}
            <section className="py-32 md:py-48 bg-[#2D3325] relative overflow-hidden px-8">
                {/* Visual accents */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DEB587]/30 to-transparent"></div>
                
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h4 className="text-5xl md:text-8xl font-bold text-[#FDFCF0] mb-8 tracking-tighter leading-none">
                            O problema não é esforço. <br /> 
                            <span className="text-[#DEB587]">É gestão.</span>
                        </h4>
                        <p className="text-xl md:text-2xl text-[#FDFCF0]/60 max-w-3xl mx-auto font-light leading-relaxed mb-16 text-balance">
                            Agende uma conversa estratégica e entenda como a metodologia Rares pode transformar a operação da sua clínica com clareza e previsibilidade.
                        </p>
                        
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-4 px-16 py-8 bg-[#DEB587] text-[#2D3325] text-2xl font-bold rounded-full shadow-2xl shadow-black/40 hover:scale-105 hover:shadow-[#DEB587]/20 active:scale-95 transition-all group"
                        >
                            Falar com um Especialista <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                {/* Background decorative element */}
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#DEB587]/5 rounded-full blur-[120px] -mb-64 -mr-32"></div>
            </section>

            {/* New Premium Footer */}
            <footer className="bg-[#1A1F16] text-[#FDFCF0]/80 pt-24 pb-12 px-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-24 mb-24">
                    {/* Column 1: Branding */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-2">
                            <img 
                                src="/logo-alamino-dark.png" 
                                alt="Logo RARES" 
                                className="h-20 w-auto object-contain brightness-0 invert-[1] opacity-90" 
                            />
                        </div>
                        <p className="text-lg font-light leading-relaxed max-w-xs">
                            O futuro da gestão financeira para clínicas de alto padrão que buscam excelência operacional.
                        </p>
                    </div>

                    {/* Column 2: Navigation */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h5 className="text-[#DEB587] text-xs font-black uppercase tracking-[0.3em]">Consultoria</h5>
                            <ul className="space-y-4">
                                <li><a href="#" className="hover:text-white transition-colors font-light">Metodologia</a></li>
                                <li><a href="#" className="hover:text-white transition-colors font-light">Diagnóstico</a></li>
                                <li><a href="#" className="hover:text-white transition-colors font-light">Cases</a></li>
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h5 className="text-[#DEB587] text-xs font-black uppercase tracking-[0.3em]">Plataforma</h5>
                            <ul className="space-y-4">
                                <li><Link to="/login" className="hover:text-white transition-colors font-light">Login</Link></li>
                                <li><Link to="/contact" className="hover:text-white transition-colors font-light">Suporte</Link></li>
                                <li><a href="#" className="hover:text-white transition-colors font-light">Segurança</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Column 3: Contact & Social */}
                    <div className="space-y-8">
                        <h5 className="text-[#DEB587] text-xs font-black uppercase tracking-[0.3em]">Conecte-se</h5>
                        <div className="space-y-4">
                            <a href="mailto:contato@rares.com.br" className="flex items-center gap-3 hover:text-white transition-colors group">
                                <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <span className="font-light">contato@rares.com.br</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 hover:text-white transition-colors group">
                                <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                                    <Phone size={18} />
                                </div>
                                <span className="font-light">+55 (11) 99999-9999</span>
                            </a>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-[#DEB587] hover:text-[#2D3325] transition-all">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-[#DEB587] hover:text-[#2D3325] transition-all">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-medium tracking-[0.1em] text-[#FDFCF0]/30 uppercase">
                    <div>© 2026 RARES. Todos os direitos reservados.</div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

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
