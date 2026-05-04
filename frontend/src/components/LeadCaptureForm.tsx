import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, MessageSquare, Sparkles, Phone, Building2, Mail, User } from 'lucide-react';

interface LeadFormData {
    nome: string; clinica: string; whatsapp: string; email: string;
    especialidade: string; volumeMensal: string; desafio: string;
    origem: string; consentimento: boolean; website: string;
}

const formatPhone = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

const validateStep1 = (d: LeadFormData): string|null => {
    if (!d.nome || d.nome.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
    if (!d.clinica || d.clinica.length < 2) return 'Nome da clínica é obrigatório';
    if (d.whatsapp.replace(/\D/g, '').length < 10) return 'WhatsApp inválido';
    if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'E-mail inválido';
    return null;
};
const validateStep2 = (d: LeadFormData): string|null => {
    if (!d.especialidade) return 'Selecione a especialidade';
    if (!d.volumeMensal) return 'Selecione o volume mensal';
    if (!d.desafio) return 'Selecione o principal desafio';
    if (!d.origem) return 'Selecione como nos conheceu';
    if (!d.consentimento) return 'Aceite o consentimento para continuar';
    return null;
};

const ESPECIALIDADES = ['Estética','Dermatologia','Odontologia','Nutrição','Ortopedia','Cardiologia','Ginecologia','Psiquiatria','Outra'];
const VOLUMES = ['Até 50','51-150','151-300','301-500','Acima de 500'];
const DESAFIOS = ['Gestão financeira desorganizada','Falta de controle de estoque','Dificuldade em cobrar médicos','Sem visibilidade do lucro real','Quero crescer mas não sei como','Outro'];
const ORIGENS = ['Instagram','Google','Indicação','LinkedIn','Outro'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const SelectField = ({ label, value, options, onChange, icon }: { label: string; value: string; options: string[]; onChange: (v: string) => void; icon?: React.ReactNode; }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-[#BA7517] uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">{icon} {label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/50 focus:border-[#3B6D11] transition-all appearance-none cursor-pointer [&>option]:bg-[#1C2B1A] [&>option]:text-white">
            <option value="">Selecione...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default function LeadCaptureForm() {
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string|null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState<LeadFormData>({ nome:'', clinica:'', whatsapp:'', email:'', especialidade:'', volumeMensal:'', desafio:'', origem:'', consentimento:false, website:'' });

    const updateField = (field: keyof LeadFormData, value: any) => { setError(null); setFormData(prev => ({ ...prev, [field]: value })); };
    const handleNext = () => { const err = validateStep1(formData); if (err) { setError(err); return; } setError(null); setStep(2); };
    const handleBack = () => { setError(null); setStep(1); };

    const handleSubmit = async () => {
        const err = validateStep2(formData);
        if (err) { setError(err); return; }
        setError(null); setIsSubmitting(true);
        try {
            let baseUrl = API_URL.replace(/\/+$/, '');
            if (!baseUrl.endsWith('/api')) baseUrl = `${baseUrl}/api`;
            const response = await fetch(`${baseUrl}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            if (!response.ok && response.status !== 200 && response.status !== 201) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Erro ao enviar'); }
            setIsSuccess(true);
        } catch (err: any) { setError(err.message || 'Erro ao enviar. Tente novamente.'); } finally { setIsSubmitting(false); }
    };

    // Tela de Sucesso
    if (isSuccess) {
        return (
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.5 }} className="text-center py-12 px-6">
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.2, type:'spring', stiffness:200, damping:15 }} className="w-20 h-20 bg-[#3B6D11]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-[#3B6D11]" />
                </motion.div>
                <motion.h3 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="text-2xl font-black text-white mb-3">Recebemos seu contato!</motion.h3>
                <motion.p initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }} className="text-white/60 font-medium mb-8 max-w-sm mx-auto">Nossa equipe entrará em contato em até 24h para agendar sua demonstração gratuita.</motion.p>
                <motion.a initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }} href="https://wa.me/5511949497419?text=Olá! Acabei de me cadastrar no site da Rares360 e gostaria de falar com um consultor." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#25D366]/30 hover:scale-105 transition-all">
                    <Phone size={18} /> Falar agora no WhatsApp
                </motion.a>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-[#BA7517] uppercase tracking-[0.2em]">Passo {step} de 2</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{step === 1 ? 'Dados de contato' : 'Dados da clínica'}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-[#3B6D11] to-[#BA7517] rounded-full" initial={{ width:'50%' }} animate={{ width: step === 1 ? '50%' : '100%' }} transition={{ duration:0.4 }} />
                </div>
            </div>

            {/* Honeypot */}
            <div style={{ position:'absolute', left:'-9999px', opacity:0, height:0, overflow:'hidden' }} aria-hidden="true">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={e => updateField('website', e.target.value)} />
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div key="step1" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }} transition={{ duration:0.3 }} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#BA7517] uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5"><User size={12} /> Nome completo</label>
                            <input type="text" value={formData.nome} onChange={e => updateField('nome', e.target.value)} placeholder="Ex: João Silva" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/50 focus:border-[#3B6D11] transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#BA7517] uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5"><Building2 size={12} /> Nome da clínica</label>
                            <input type="text" value={formData.clinica} onChange={e => updateField('clinica', e.target.value)} placeholder="Ex: Clínica Estética Vida" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/50 focus:border-[#3B6D11] transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#BA7517] uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5"><Phone size={12} /> WhatsApp / Telefone</label>
                            <input type="tel" value={formData.whatsapp} onChange={e => updateField('whatsapp', formatPhone(e.target.value))} placeholder="(11) 99999-9999" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/50 focus:border-[#3B6D11] transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#BA7517] uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5"><Mail size={12} /> E-mail</label>
                            <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="joao@clinica.com.br" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/50 focus:border-[#3B6D11] transition-all" />
                        </div>
                        <button onClick={handleNext} className="w-full py-4 bg-gradient-to-r from-[#3B6D11] to-[#4a8a1a] text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3B6D11]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                            Próximo <ArrowRight size={16} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="step2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.3 }} className="space-y-5">
                        <SelectField label="Especialidade da clínica" value={formData.especialidade} options={ESPECIALIDADES} onChange={v => updateField('especialidade', v)} icon={<Sparkles size={12} />} />
                        <SelectField label="Atendimentos por mês" value={formData.volumeMensal} options={VOLUMES} onChange={v => updateField('volumeMensal', v)} />
                        <SelectField label="Principal desafio" value={formData.desafio} options={DESAFIOS} onChange={v => updateField('desafio', v)} />
                        <SelectField label="Como nos conheceu?" value={formData.origem} options={ORIGENS} onChange={v => updateField('origem', v)} icon={<MessageSquare size={12} />} />
                        <label className="flex items-start gap-3 cursor-pointer group mt-2">
                            <div onClick={() => updateField('consentimento', !formData.consentimento)} className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all flex-shrink-0 ${formData.consentimento ? 'bg-[#3B6D11] border-[#3B6D11]' : 'border-white/20 group-hover:border-white/40'}`}>
                                {formData.consentimento && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                            <span onClick={() => updateField('consentimento', !formData.consentimento)} className="text-xs text-white/50 font-medium leading-relaxed">Concordo em receber contato da Rares360 para informações sobre seus serviços de consultoria.</span>
                        </label>
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleBack} className="flex-1 py-4 border-2 border-white/10 text-white/50 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Voltar</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] py-4 bg-gradient-to-r from-[#BA7517] to-[#d4941f] text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#BA7517]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <>Quero uma demonstração gratuita <ArrowRight size={16} /></>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">{error}</motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
