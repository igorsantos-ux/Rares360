import { motion } from 'framer-motion';
import { 
    ChevronLeft, 
    Mail, 
    Phone, 
    MapPin, 
    Send,
    Linkedin,
    Instagram,
    MessageSquare,
    Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulando envio (Posteriormente integrar com backend ou serviço de email)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        setFormData({ name: '', email: '', whatsapp: '', subject: '', message: '' });
        setIsSubmitting(false);
    };

    return (
        <div className="bg-white min-h-screen overflow-x-hidden">
            {/* Navbar Simple */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-center items-center backdrop-blur-md bg-white/30">
                <div className="w-full max-w-container flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-[#697D58] font-bold hover:scale-105 transition-all">
                        <ChevronLeft size={20} /> Voltar
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#697D58] tracking-tight">Rares360</span>
                    </div>
                    <div className="w-20"></div> {/* Spacer */}
                </div>
            </nav>

            <section className="pt-32 pb-24 px-8">
                <div className="max-w-container mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-20"
                    >
                        <span className="text-xs font-black uppercase tracking-[0.5em] text-[#8A9A5B] mb-6 block">Fale Conosco</span>
                        <h1 className="text-h1 text-[#697D58] mb-6">
                            Sua jornada para a <br />
                            <span className="text-[#8A9A5B]">excelência</span> começa aqui.
                        </h1>
                        <p className="text-body-lg text-slate-500 max-w-2xl mx-auto">
                            Estamos prontos para transformar a realidade financeira do seu negócio. Preencha o formulário ou utilize nossos canais diretos.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                        {/* Info Cards */}
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2 space-y-8"
                        >
                            <ContactCard 
                                icon={<Mail size={24} />}
                                title="E-mail Direto"
                                value="contato@rares360.com.br"
                                href="mailto:contato@rares360.com.br"
                            />
                            <ContactCard 
                                icon={<Phone size={24} />}
                                title="WhatsApp Business"
                                value="+55 11 99999-9999"
                                href="https://wa.me/5511999999999"
                            />
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6">
                                <h4 className="text-lg font-black text-[#697D58] uppercase tracking-widest">Nossas Redes</h4>
                                <div className="flex gap-4">
                                    <SocialLink icon={<Linkedin size={20} />} href="#" />
                                    <SocialLink icon={<Instagram size={20} />} href="#" />
                                </div>
                            </div>
                            
                            <div className="p-8 rounded-[2.5rem] bg-[#697D58] text-white flex items-center gap-6 shadow-xl shadow-[#697D58]/20">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-[#DEB587]">
                                    <Clock size={32} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Atendimento</p>
                                    <p className="font-bold">Segunda à Sexta</p>
                                    <p className="text-sm opacity-80">09:00 às 18:00</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Form */}
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-3 bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl relative overflow-hidden"
                        >
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                        <input 
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm transition-all"
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                        <input 
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm transition-all"
                                            placeholder="joao@empresa.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                        <input 
                                            type="text"
                                            required
                                            value={formData.whatsapp}
                                            onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm transition-all"
                                            placeholder="(11) 99999-9999"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assunto</label>
                                        <select 
                                            required
                                            value={formData.subject}
                                            onChange={e => setFormData({...formData, subject: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm transition-all text-slate-500"
                                        >
                                            <option value="">Selecione um assunto</option>
                                            <option value="Consultoria">Consultoria Financeira</option>
                                            <option value="SaaS">Plataforma Rares360</option>
                                            <option value="Parceria">Parcerias</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Mensagem</label>
                                    <textarea 
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={e => setFormData({...formData, message: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm transition-all resize-none"
                                        placeholder="Conte-nos como podemos ajudar..."
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-[#697D58] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isSubmitting ? (
                                        <>Aguarde...</>
                                    ) : (
                                        <>ENVIAR MENSAGEM <Send size={20} /></>
                                    )}
                                </button>
                            </form>

                            {/* Decorative Background Icon */}
                            <div className="absolute -bottom-20 -right-20 opacity-[0.03] rotate-12 pointer-events-none">
                                <MessageSquare size={300} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 bg-[#F8FAFC] border-t border-[#8A9A5B]/10">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-[#697D58] rounded-xl flex items-center justify-center text-white">
                            <Send size={24} />
                        </div>
                        <span className="text-2xl font-black text-[#697D58]">Rares360</span>
                    </div>
                    <p className="text-slate-400 font-medium mb-8 max-w-lg mx-auto">
                        A união perfeita entre inteligência de dados e gestão estratégica para o seu sucesso.
                    </p>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">© 2026 Rares360. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

const ContactCard = ({ icon, title, value, href }: any) => (
    <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-6 p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-xl hover:shadow-slate-200/50 hover:border-[#8A9A5B]/20 transition-all group"
    >
        <div className="w-16 h-16 bg-slate-50 text-[#8A9A5B] rounded-2xl flex items-center justify-center group-hover:bg-[#8A9A5B] group-hover:text-white transition-all">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-lg font-black text-slate-700">{value}</p>
        </div>
    </a>
);

const SocialLink = ({ icon, href }: any) => (
    <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#697D58] hover:bg-[#697D58] hover:text-white transition-all shadow-sm"
    >
        {icon}
    </a>
);

export default Contact;
