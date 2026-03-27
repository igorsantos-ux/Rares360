import { motion, AnimatePresence } from 'framer-motion';
    ChevronLeft, 
    ChevronRight,
    Send,
    MessageSquare,
    Clock,
    CheckCircle2,
    Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { leadsApi } from '../services/api';

export const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        subject: 'Diagnóstico Estratégico',
        message: '',
        diagnostic: {
            clinicType: '',
            operationTime: '',
            professionalsCount: '',
            mainChallenge: '',
            monthlyRevenue: '',
            hasDRE: '',
            hasDFC: '',
            organizedCosts: '',
            knowsMargin: '',
            knowsRevenueGoal: '',
            pricingFactors: [] as string[],
            knowsHighMarginProcedures: '',
            identifiedNegativeMargin: '',
            knowsMonthlyLeads: '',
            monitorsConversion: '',
            structuredFollowUp: '',
            reliableInventory: '',
            knowsSupplyCosts: '',
            patientReturnControl: ''
        }
    });

    const totalSteps = 6;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < totalSteps - 1) {
            setStep(step + 1);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await leadsApi.createLead(formData);
            toast.success(response.data.message || 'Diagnóstico enviado com sucesso! Entraremos em contato em breve.');
            setStep(totalSteps); // Show success state
        } catch (error: any) {
            console.error('Error sending lead:', error);
            toast.error(error.response?.data?.error || 'Erro ao enviar diagnóstico. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateDiagnostic = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            diagnostic: {
                ...prev.diagnostic,
                [key]: value
            }
        }));
    };

    const togglePricingFactor = (factor: string) => {
        const current = formData.diagnostic.pricingFactors;
        if (current.includes(factor)) {
            updateDiagnostic('pricingFactors', current.filter(f => f !== factor));
        } else {
            updateDiagnostic('pricingFactors', [...current, factor]);
        }
    };

    const nextStep = () => {
        if (step === 0 && (!formData.name || !formData.email || !formData.whatsapp)) {
            toast.error('Por favor, preencha os dados de contato.');
            return;
        }
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setStep(step - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (step === totalSteps) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center p-8">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-8"
                >
                    <div className="w-24 h-24 bg-[#8A9A5B]/10 rounded-full flex items-center justify-center mx-auto text-[#8A9A5B]">
                        <CheckCircle2 size={60} />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-black text-[#697D58]">Diagnóstico Enviado!</h1>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Obrigado por compartilhar essas informações. Nossa equipe irá analisar seu perfil e entrará em contato em breve para apresentar soluções personalizadas.
                        </p>
                    </div>
                    <Link 
                        to="/" 
                        className="inline-block px-10 py-4 bg-[#697D58] text-white rounded-2xl font-black shadow-xl shadow-[#697D58]/20 hover:scale-105 transition-all"
                    >
                        VOLTAR AO INÍCIO
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen overflow-x-hidden">
            {/* Navbar Simple */}
            <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-center items-center backdrop-blur-md bg-white/30 border-b border-slate-100">
                <div className="w-full max-w-container flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-[#697D58] font-bold hover:scale-105 transition-all">
                        <ChevronLeft size={20} /> Voltar
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#697D58] tracking-tight">Rares360</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Passo {step + 1} de {totalSteps}
                    </div>
                </div>
            </nav>

            <section className="pt-32 pb-24 px-8">
                <div className="max-w-container mx-auto">
                    {/* Progress Bar */}
                    <div className="max-w-3xl mx-auto mb-16 px-4">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-[#8A9A5B]"
                                initial={{ width: 0 }}
                                animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                        {/* Title Section */}
                        <div className="lg:col-span-2 space-y-8">
                            <motion.div 
                                key={step}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <span className="text-xs font-black uppercase tracking-[0.5em] text-[#8A9A5B] mb-2 block">Diagnóstico Gratuito</span>
                                <h1 className="text-4xl md:text-5xl font-black text-[#697D58] leading-[1.1]">
                                    {step === 0 && <>Conte-nos quem <br /><span className="text-[#8A9A5B]">você é.</span></>}
                                    {step === 1 && <>Sobre o seu <br /><span className="text-[#8A9A5B]">negócio.</span></>}
                                    {step === 2 && <>Desafios e de <br /><span className="text-[#8A9A5B]">Finanças.</span></>}
                                    {step === 3 && <>Gestão de <br /><span className="text-[#8A9A5B]">Lucratividade.</span></>}
                                    {step === 4 && <>Métricas de <br /><span className="text-[#8A9A5B]">Crescimento.</span></>}
                                    {step === 5 && <>Operação e <br /><span className="text-[#8A9A5B]">Próximos Passos.</span></>}
                                </h1>
                                <p className="text-slate-500 font-medium max-w-md">
                                    {step === 0 && "Inicie sua jornada para a excelência financeira preenchendo os dados básicos da sua clínica."}
                                    {step === 1 && "Entender o tempo de mercado e o tamanho da sua equipe é fundamental para o diagnóstico correto."}
                                    {step === 2 && "Identificar seus principais obstáculos hoje nos ajuda a traçar o melhor plano de ação."}
                                    {step === 3 && "A clareza sobre margens e metas diferencia negócios saudáveis de negócios que apenas sobrevivem."}
                                    {step === 4 && "Controle de leads e conversão são os motores do crescimento da sua clínica."}
                                    {step === 5 && "O controle de estoque e retenção de pacientes garantem a previsibilidade a longo prazo."}
                                </p>
                            </motion.div>

                            <div className="hidden lg:block space-y-6 pt-8 border-t border-slate-100">
                                <div className="flex items-center gap-4 text-slate-400">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#8A9A5B]">
                                        <Clock size={20} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest">Leva apenas 3 minutos</p>
                                </div>
                                <div className="flex items-center gap-4 text-slate-400">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#8A9A5B]">
                                        <MessageSquare size={20} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest">Análise personalizada</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Card */}
                        <div className="lg:col-span-3 bg-white p-6 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col justify-between">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8"
                                >
                                    {/* STEP 0: CONTATO */}
                                    {step === 0 && (
                                        <div className="space-y-6">
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
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                                <input 
                                                    type="text"
                                                    required
                                                    value={formData.whatsapp}
                                                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm transition-all"
                                                    placeholder="(11) 94949-7419"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 1: PERFIL */}
                                    {step === 1 && (
                                        <div className="space-y-8">
                                            <Question 
                                                label="1. Qual o tipo de clínica?"
                                                options={["Estética", "Dermatologia", "Nutrologia", "Ginecologia", "Multidiciplinar", "Outro"]}
                                                value={formData.diagnostic.clinicType}
                                                onChange={(v: string) => updateDiagnostic('clinicType', v)}
                                            />
                                            <Question 
                                                label="2. Há quanto tempo a clínica está em operação?"
                                                options={["Ainda vou iniciar", "0-12 meses", "1-3 anos", "3-5 anos", "+5 anos"]}
                                                value={formData.diagnostic.operationTime}
                                                onChange={(v: string) => updateDiagnostic('operationTime', v)}
                                            />
                                            <Question 
                                                label="3. Quantos profissionais atendem atualmente?"
                                                options={["Apenas 1", "2-3", "4-6", "+6"]}
                                                value={formData.diagnostic.professionalsCount}
                                                onChange={(v: string) => updateDiagnostic('professionalsCount', v)}
                                            />
                                        </div>
                                    )}

                                    {/* STEP 2: FINANCAS 1 */}
                                    {step === 2 && (
                                        <div className="space-y-8">
                                            <Question 
                                                label="4. Qual o principal desafio hoje?"
                                                options={["Falta de previsibilidade financeira", "Dificuldade em precificar", "Baixa conversão de pacientes", "Falta de organização financeira", "Crescimento desestruturado", "Falta de tempo para gestão", "Não sei exatamente onde está o problema"]}
                                                value={formData.diagnostic.mainChallenge}
                                                onChange={(v: string) => updateDiagnostic('mainChallenge', v)}
                                            />
                                            <Question 
                                                label="5. Qual o faturamento médio mensal atual?"
                                                options={["Até 30 mil", "30-80 mil", "80-150 mil", "150-300 mil", "+300 mil"]}
                                                value={formData.diagnostic.monthlyRevenue}
                                                onChange={(v: string) => updateDiagnostic('monthlyRevenue', v)}
                                            />
                                            <Question 
                                                label="6. Você possui DRE estruturado?"
                                                options={["Sim e utilizo para tomada de decisão", "Tenho, mas não utilizo estrategicamente", "Não tenho"]}
                                                value={formData.diagnostic.hasDRE}
                                                onChange={(v: string) => updateDiagnostic('hasDRE', v)}
                                            />
                                            <Question 
                                                label="7. Seu fluxo de caixa (DFC) gera previsibilidade financeira?"
                                                options={["Sim, consigo prever receitas e despesas", "Parcialmente", "Não possuo controle claro"]}
                                                value={formData.diagnostic.hasDFC}
                                                onChange={(v: string) => updateDiagnostic('hasDFC', v)}
                                            />
                                        </div>
                                    )}

                                    {/* STEP 3: FINANCAS 2 */}
                                    {step === 3 && (
                                        <div className="space-y-8">
                                            <Question 
                                                label="8. Seu contas a pagar está organizado por centro de custo?"
                                                options={["Sim", "Parcialmente", "Não"]}
                                                value={formData.diagnostic.organizedCosts}
                                                onChange={(v: string) => updateDiagnostic('organizedCosts', v)}
                                            />
                                            <Question 
                                                label="9. Você sabe qual é a margem de lucro da clínica?"
                                                options={["Sim, com segurança", "Tenho uma estimativa", "Não sei"]}
                                                value={formData.diagnostic.knowsMargin}
                                                onChange={(v: string) => updateDiagnostic('knowsMargin', v)}
                                            />
                                            <Question 
                                                label="10. Hoje você consegue identificar quanto precisa faturar por mês para atingir sua meta?"
                                                options={["Sim", "Tenho uma estimativa", "Não"]}
                                                value={formData.diagnostic.knowsRevenueGoal}
                                                onChange={(v: string) => updateDiagnostic('knowsRevenueGoal', v)}
                                            />
                                            <div className="space-y-4">
                                                <label className="text-xs font-black text-[#697D58] uppercase tracking-widest block">11. Sua precificação considera: (múltipla escolha)</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {["Custos dos procedimentos", "Impostos e taxas de cartão", "Comissão comercial", "Margem de contribuição", "Posicionamento de mercado", "Valor percebido pelo paciente", "Não tenho uma metodologia definida"].map(opt => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => togglePricingFactor(opt)}
                                                            className={`text-left p-4 rounded-2xl border-2 transition-all ${formData.diagnostic.pricingFactors.includes(opt) ? 'bg-[#8A9A5B]/5 border-[#8A9A5B] text-[#697D58]' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${formData.diagnostic.pricingFactors.includes(opt) ? 'bg-[#8A9A5B] border-[#8A9A5B] text-white' : 'border-slate-300'}`}>
                                                                    {formData.diagnostic.pricingFactors.includes(opt) && <Check size={14} strokeWidth={4} />}
                                                                </div>
                                                                <span className="text-sm font-bold">{opt}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: CRESCIMENTO */}
                                    {step === 4 && (
                                        <div className="space-y-8">
                                            <Question 
                                                label="12. Você sabe quais procedimentos possuem maior margem de lucro?"
                                                options={["Sim", "Não"]}
                                                value={formData.diagnostic.knowsHighMarginProcedures}
                                                onChange={(v: string) => updateDiagnostic('knowsHighMarginProcedures', v)}
                                            />
                                            <Question 
                                                label="13. Já identificou procedimentos com margem negativa?"
                                                options={["Sim", "Não"]}
                                                value={formData.diagnostic.identifiedNegativeMargin}
                                                onChange={(v: string) => updateDiagnostic('identifiedNegativeMargin', v)}
                                            />
                                            <Question 
                                                label="14. Você sabe quantos leads entram por mês na clínica?"
                                                options={["Sim", "Não"]}
                                                value={formData.diagnostic.knowsMonthlyLeads}
                                                onChange={(v: string) => updateDiagnostic('knowsMonthlyLeads', v)}
                                            />
                                            <Question 
                                                label="15. Sua taxa de conversão é monitorada?"
                                                options={["Sim", "Não"]}
                                                value={formData.diagnostic.monitorsConversion}
                                                onChange={(v: string) => updateDiagnostic('monitorsConversion', v)}
                                            />
                                        </div>
                                    )}

                                    {/* STEP 5: OPERAÇÃO final */}
                                    {step === 5 && (
                                        <div className="space-y-8">
                                            <Question 
                                                label="16. Existe acompanhamento estruturado de pacientes que não fecharam?"
                                                options={["Sim", "Não"]}
                                                value={formData.diagnostic.structuredFollowUp}
                                                onChange={(v: string) => updateDiagnostic('structuredFollowUp', v)}
                                            />
                                            <Question 
                                                label="17. O estoque é controlado de forma confiável?"
                                                options={["Sim", "Não"]}
                                                value={formData.diagnostic.reliableInventory}
                                                onChange={(v: string) => updateDiagnostic('reliableInventory', v)}
                                            />
                                            <Question 
                                                label="18. Você sabe o custo real dos insumos por procedimento?"
                                                options={["Sim", "Não"]}
                                                value={formData.diagnostic.knowsSupplyCosts}
                                                onChange={(v: string) => updateDiagnostic('knowsSupplyCosts', v)}
                                            />
                                            <Question 
                                                label="19. Existe controle de retorno dos pacientes para continuidade dos tratamentos?"
                                                options={["Sim", "Não"]}
                                                value={formData.diagnostic.patientReturnControl}
                                                onChange={(v: string) => updateDiagnostic('patientReturnControl', v)}
                                            />
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Adicionais (Opcional)</label>
                                                <textarea 
                                                    rows={3}
                                                    value={formData.message}
                                                    onChange={e => setFormData({...formData, message: e.target.value})}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm transition-all resize-none"
                                                    placeholder="Alguma informação extra que deseja compartilhar?"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 pt-10">
                                {step > 0 && (
                                    <button 
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 py-5 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft size={16} /> Voltar
                                    </button>
                                )}
                                {step < totalSteps - 1 ? (
                                    <button 
                                        type="button"
                                        onClick={nextStep}
                                        className="flex-[2] py-5 bg-[#697D58] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#697D58]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        Próximo Passo <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handleSubmit}
                                        className="flex-[2] py-5 bg-[#8A9A5B] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Enviando..." : "FINALIZAR DIAGNÓSTICO"} <Send size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
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
                        O diagnóstico inicial para transformar sua gestão definitivamente.
                    </p>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">© 2026 Rares360. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

const Question = ({ label, options, value, onChange }: any) => (
    <div className="space-y-4">
        <label className="text-xs font-black text-[#697D58] uppercase tracking-widest block">{label}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt: string) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm ${value === opt ? 'bg-[#8A9A5B]/10 border-[#8A9A5B] text-[#697D58]' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

export default Contact;
