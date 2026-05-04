/**
 * NotificationBell — Sino de notificações in-app para leads
 * Busca leads novos como "notificações" e exibe badge com contador
 */
import { useState, useEffect, useRef } from 'react';
import { Bell, X, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBellProps {
    leads: any[];
    onClickNotification: (lead: any) => void;
}

const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `há ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
};

export default function NotificationBell({ leads, onClickNotification }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
    const ref = useRef<HTMLDivElement>(null);

    // Notificações = leads novos (criados nas últimas 72h) que o admin ainda não viu
    const recentLeads = leads
        .filter(l => {
            const age = Date.now() - new Date(l.createdAt).getTime();
            return age < 72 * 60 * 60 * 1000; // 72h
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unseenCount = recentLeads.filter(l => !seenIds.has(l.id)).length;

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        // Marcar todos como vistos ao abrir
        if (!isOpen) {
            setSeenIds(new Set(recentLeads.map(l => l.id)));
        }
    };

    const handleClick = (lead: any) => {
        setIsOpen(false);
        onClickNotification(lead);
    };

    return (
        <div className="relative" ref={ref}>
            {/* Botão Sino */}
            <button onClick={handleOpen} className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-all group">
                <Bell size={20} className="text-slate-500 group-hover:text-[#697D58] transition-colors" />
                {unseenCount > 0 && (
                    <motion.span initial={{ scale:0 }} animate={{ scale:1 }} className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                        {unseenCount > 9 ? '9+' : unseenCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity:0, y:10, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:10, scale:0.95 }} transition={{ duration:0.15 }} className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-black text-[#697D58] uppercase tracking-widest">Notificações</h3>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={14} /></button>
                        </div>

                        <div className="max-h-[360px] overflow-y-auto">
                            {recentLeads.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs font-medium">Nenhuma notificação recente</div>
                            ) : (
                                recentLeads.map(lead => (
                                    <button key={lead.id} onClick={() => handleClick(lead)} className="w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left flex items-start gap-3 border-b border-slate-50 last:border-0">
                                        <div className="w-8 h-8 rounded-full bg-[#8A9A5B]/10 flex items-center justify-center text-[#697D58] font-black text-[10px] flex-shrink-0 mt-0.5">
                                            {lead.name?.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">Novo lead: {lead.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium truncate">{lead.clinica || lead.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${lead.score >= 70 ? 'bg-green-100 text-green-700' : lead.score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    <Star size={8} className="inline mr-0.5" />{lead.score}
                                                </span>
                                                <span className="text-[9px] text-slate-300 flex items-center gap-0.5"><Clock size={8} />{timeAgo(lead.createdAt)}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
