/**
 * LeadDrawer — Drawer lateral para detalhes do lead no painel admin
 * UX: Drawer lateral ao invés de modal para manter contexto do kanban
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Building2, Star, MessageSquare, Instagram, Search, Users, Linkedin, Clock, Send, CheckCircle2 } from 'lucide-react';

interface LeadDrawerProps {
    lead: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => void;
    onUpdateNotes: (id: string, notes: string) => void;
}

const getScoreColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'ALTO' };
    if (score >= 40) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'MÉDIO' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'BAIXO' };
};

const getOrigemIcon = (origem: string) => {
    switch (origem) {
        case 'Instagram': return <Instagram size={14} />;
        case 'Google': return <Search size={14} />;
        case 'Indicação': return <Users size={14} />;
        case 'LinkedIn': return <Linkedin size={14} />;
        default: return <MessageSquare size={14} />;
    }
};

const timeAgo = (date: string) => {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `há ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `há ${days}d`;
    return `há ${Math.floor(days / 30)} meses`;
};

export default function LeadDrawer({ lead, isOpen, onClose, onUpdateStatus, onUpdateNotes }: LeadDrawerProps) {
    const [notes, setNotes] = useState(lead?.notes || '');
    const [noteSaved, setNoteSaved] = useState(false);

    if (!lead) return null;
    const sc = getScoreColor(lead.score || 0);

    const handleSaveNotes = () => {
        onUpdateNotes(lead.id, notes);
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2000);
    };

    const statusActions = [
        { status: 'EM_CONTATO', label: 'Marcar como Contatado', color: 'bg-amber-500 hover:bg-amber-600' },
        { status: 'DIAGNOSTICO', label: 'Agendar Diagnóstico', color: 'bg-purple-500 hover:bg-purple-600' },
        { status: 'FECHADO', label: 'Fechar Negócio', color: 'bg-green-500 hover:bg-green-600' },
        { status: 'PERDIDO', label: 'Marcar como Perdido', color: 'bg-red-500 hover:bg-red-600' },
    ].filter(a => a.status !== lead.status);

    // Timeline de atividades
    const timeline = [
        { label: 'Lead criado', date: lead.createdAt, icon: <Star size={14} />, active: true },
        { label: 'Primeiro contato', date: lead.contatadoEm, icon: <Phone size={14} />, active: !!lead.contatadoEm },
        { label: 'Diagnóstico realizado', date: lead.status === 'DIAGNOSTICO' || lead.status === 'DEMONSTRACAO' || lead.status === 'FECHADO' ? lead.updatedAt : null, icon: <CheckCircle2 size={14} />, active: ['DIAGNOSTICO','DEMONSTRACAO','FECHADO'].includes(lead.status) },
        { label: 'Negócio fechado', date: lead.fechadoEm, icon: <CheckCircle2 size={14} />, active: lead.status === 'FECHADO' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
                    {/* Drawer */}
                    <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }} transition={{ type:'spring', damping:25, stiffness:300 }} className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#8A9A5B]/10 flex items-center justify-center text-[#697D58] font-black text-sm">{lead.name?.substring(0,2).toUpperCase()}</div>
                                <div>
                                    <h3 className="font-extrabold text-[#1A202C]">{lead.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {timeAgo(lead.createdAt)}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Score Badge */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${sc.bg} ${sc.text} ${sc.border} border font-black text-sm`}>
                                <Star size={14} /> Score: {lead.score}/100 ({sc.label})
                            </div>

                            {/* Dados do Lead */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Building2 size={10} /> Clínica</span>
                                    <span className="font-bold text-slate-700 text-sm">{lead.clinica || lead.diagnostic?.clinicType || '—'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Especialidade</span>
                                    <span className="font-bold text-slate-700 text-sm">{lead.especialidade || '—'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Mail size={10} /> E-mail</span>
                                    <span className="font-bold text-slate-700 text-sm break-all">{lead.email}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Phone size={10} /> WhatsApp</span>
                                    <span className="font-bold text-slate-700 text-sm">{lead.whatsapp}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Volume Mensal</span>
                                    <span className="font-bold text-slate-700 text-sm">{lead.volumeMensal || '—'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Origem</span>
                                    <span className="font-bold text-slate-700 text-sm flex items-center gap-1.5">{getOrigemIcon(lead.origem || '')} {lead.origem || '—'}</span>
                                </div>
                            </div>

                            {/* Desafio */}
                            {lead.desafio && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">Principal Desafio</span>
                                    <p className="font-bold text-slate-700 text-sm">{lead.desafio}</p>
                                </div>
                            )}

                            {/* WhatsApp Button */}
                            <a href={`https://wa.me/${lead.whatsapp?.replace(/\D/g, '')}?text=Olá ${lead.name}, tudo bem? Sou consultor(a) da Rares360.`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#25D366]/20 hover:scale-[1.02] active:scale-95 transition-all">
                                <Phone size={16} /> Falar no WhatsApp
                            </a>

                            {/* Timeline */}
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Timeline</h4>
                                <div className="space-y-3">
                                    {timeline.map((t, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${t.active ? 'bg-[#8A9A5B] text-white' : 'bg-slate-100 text-slate-300'}`}>{t.icon}</div>
                                            <div className="flex-1">
                                                <p className={`text-xs font-bold ${t.active ? 'text-slate-700' : 'text-slate-300'}`}>{t.label}</p>
                                                {t.date && <p className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')} às {new Date(t.date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</h4>
                                <textarea rows={3} value={notes} onChange={e => { setNotes(e.target.value); setNoteSaved(false); }} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/30 resize-none" placeholder="Adicionar observações sobre este lead..." />
                                <button onClick={handleSaveNotes} className="flex items-center gap-2 px-4 py-2 bg-[#8A9A5B] text-white rounded-lg text-xs font-bold hover:scale-105 transition-all">
                                    {noteSaved ? <><CheckCircle2 size={14} /> Salvo!</> : <><Send size={14} /> Salvar</>}
                                </button>
                            </div>

                            {/* Ações de Status */}
                            <div className="space-y-2 pb-8">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {statusActions.map(action => (
                                        <button key={action.status} onClick={() => onUpdateStatus(lead.id, action.status)} className={`px-3 py-2.5 ${action.color} text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95`}>
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
