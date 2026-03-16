import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Award,
    BookOpen,
    Target,
    Heart,
    Linkedin,
    Instagram,
    Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
    return (
        <div className="bg-white min-h-screen overflow-x-hidden">
            {/* Navbar Simple */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-center items-center backdrop-blur-md bg-white/30">
                <div className="w-full max-w-container flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-[#697D58] font-bold hover:scale-105 transition-all">
                        <ChevronLeft size={20} /> Voltar
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#697D58] tracking-tight">Roberta Alamino</span>
                    </div>
                    <div className="w-20"></div> {/* Spacer */}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-8">
                <div className="max-w-container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] rounded-design overflow-hidden shadow-2xl border-8 border-[#8A9A5B]/10">
                            <img
                                src="/roberta.jpg"
                                alt="Roberta Alamino"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#DEB587]/20 rounded-full blur-[80px] -z-10"></div>
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#8A9A5B]/20 rounded-full blur-[80px] -z-10"></div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <span className="text-xs font-black uppercase tracking-[0.5em] text-[#8A9A5B] mb-6 block">Especialista em Gestão Financeira</span>
                        <h1 className="text-h1 text-[#697D58] mb-8">
                            Excelência que <br />
                            <span className="text-[#8A9A5B]">gera resultados</span>.
                        </h1>
                        <p className="text-body-lg text-slate-500 mb-10">
                            Com mais de uma década de vivência na operação de clínicas médicas, Roberta Alamino desenvolveu uma sólida experiência na gestão financeira, operacional, administrativa e estratégica desses negócios. Ao longo de sua trajetória, tem se dedicado a estruturar consultórios e transformá-los em negócios mais organizados, sustentáveis e preparados para crescer com consistência. Sua abordagem une análise técnica, visão estratégica e uma compreensão profunda da realidade operacional das clínicas.
                        </p>

                        <div className="flex gap-4">
                            <SocialLink icon={<Linkedin size={20} />} href="https://www.linkedin.com/in/roberta-alamino-230326295/" />
                            <SocialLink icon={<Instagram size={20} />} href="https://www.instagram.com/robertaalaminor?igsh=MWEzMWd2M2RpbjcwdA==" />
                            <SocialLink icon={<Mail size={20} />} href="mailto:robertaarodrigues12@gmail.com" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Career / Pillars */}
            <section className="py-section px-8 bg-[#697D58] text-white">
                <div className="max-w-container mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-h2 mb-6">Trajetória de Impacto</h2>
                        <p className="text-[#F0EAD6]/80 text-body-lg max-w-2xl mx-auto">
                            Uma jornada dedicada a organizar, otimizar e escalar o patrimônio de quem confia em nossa gestão.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <PillarCard
                            icon={<Award size={32} />}
                            title="Experiência Profissional"
                            desc="Mais de uma década de atuação direta na operação e gestão de clínicas médicas, desenvolvendo expertise em gestão financeira, organização administrativa e direcionamento estratégico de negócios."
                        />
                        <PillarCard
                            icon={<Target size={32} />}
                            title="Missão"
                            desc="Levar clareza e controle total para empresários que desejam escalar seus lucros com segurança."
                        />
                        <PillarCard
                            icon={<Heart size={32} />}
                            title="Abordagem"
                            desc="Consultoria personalizada que respeita a identidade e os objetivos únicos de cada cliente."
                        />
                        <PillarCard
                            icon={<BookOpen size={32} />}
                            title="Expertise"
                            desc="Especialista em gestão financeira estratégica para clínicas médicas, utilizando dados e indicadores para orientar decisões operacionais e comerciais com foco em resultado, eficiência e lucratividade."
                        />
                    </div>
                </div>
            </section>

            {/* Personal Quote */}
            <section className="py-40 px-8 bg-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="text-[12rem] font-black text-[#8A9A5B]/10 absolute -top-40 left-1/2 -translate-x-1/2 select-none">"</div>
                    <h3 className="text-2xl md:text-4xl font-black text-[#697D58] leading-tight tracking-tight italic">
                        "Meu objetivo é trazer clareza para a gestão do seu negócio. Que você entenda seus números, tenha controle sobre a operação da sua clínica e consiga tomar decisões com segurança, sabendo exatamente onde está, para onde quer ir e quais caminhos precisam ser seguidos para alcançar esse resultado."
                    </h3>
                    <div className="mt-12 flex flex-col items-center">
                        <div className="w-16 h-1 bg-[#8A9A5B] mb-4"></div>
                        <span className="font-black text-[#697D58] uppercase tracking-widest">Roberta Alamino</span>
                    </div>
                </div>

                {/* Decorative background circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#8A9A5B]/5 rounded-full -z-0"></div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 bg-[#F8FAFC] border-t border-[#8A9A5B]/10">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-[#697D58] rounded-xl flex items-center justify-center text-white">
                            <Target size={24} />
                        </div>
                        <span className="text-2xl font-black text-[#697D58]">Roberta Alamino</span>
                    </div>
                    <p className="text-slate-400 font-medium mb-12 max-w-lg mx-auto">
                        Transformando a gestão financeira com elegância, precisão e resultados extraordinários.
                    </p>
                    <div className="flex justify-center gap-10 text-xs font-black uppercase tracking-widest text-[#8A9A5B]">
                        <Link to="/" className="hover:text-[#697D58] transition-colors">Início</Link>
                        <Link to="/about" className="hover:text-[#697D58] transition-colors">Quem Somos</Link>
                        <Link to="/login" className="hover:text-[#697D58] transition-colors">Plataforma</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const SocialLink = ({ icon, href }: any) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#697D58] hover:bg-[#697D58] hover:text-white transition-all shadow-sm"
    >
        {icon}
    </a>
);

const PillarCard = ({ icon, title, desc }: any) => (
    <motion.div
        whileHover={{ y: -10 }}
        className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center text-center group transition-colors hover:bg-white/10"
    >
        <div className="text-[#DEB587] mb-8 transition-transform group-hover:scale-110 duration-500">
            {icon}
        </div>
        <h4 className="text-2xl font-black mb-4">{title}</h4>
        <p className="text-white/60 font-medium leading-relaxed">{desc}</p>
    </motion.div>
);

export default AboutPage;
