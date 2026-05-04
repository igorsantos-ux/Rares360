/**
 * LeadMetrics — Cards de métricas no topo do pipeline de leads
 * Decisão de UX: métricas sempre visíveis no topo para dar contexto rápido
 */
import { TrendingUp, Users, Target, Star } from 'lucide-react';

interface LeadMetricsProps {
    leads: any[];
}

export default function LeadMetrics({ leads }: LeadMetricsProps) {
    const total = leads.length;

    // Leads desta semana
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = leads.filter(l => new Date(l.createdAt) >= weekAgo).length;

    // Taxa de conversão (fechados / total)
    const fechados = leads.filter(l => l.status === 'FECHADO').length;
    const taxaConversao = total > 0 ? ((fechados / total) * 100).toFixed(1) : '0';

    // Score médio
    const scoreMedio = total > 0 ? Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / total) : 0;

    const metrics = [
        { label: 'Total de Leads', value: total, icon: <Users size={18} />, color: 'from-[#697D58] to-[#3B6D11]', textColor: 'text-white' },
        { label: 'Leads esta Semana', value: thisWeek, icon: <TrendingUp size={18} />, color: 'bg-white', textColor: 'text-[#1A202C]', borderColor: 'border-[#8A9A5B]/10' },
        { label: 'Taxa de Conversão', value: `${taxaConversao}%`, icon: <Target size={18} />, color: 'bg-white', textColor: 'text-[#1A202C]', borderColor: 'border-[#8A9A5B]/10' },
        { label: 'Score Médio', value: scoreMedio, icon: <Star size={18} />, color: 'bg-white', textColor: 'text-[#1A202C]', borderColor: 'border-[#8A9A5B]/10', scoreBadge: true },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {metrics.map((m, i) => (
                <div key={i} className={`p-5 rounded-2xl shadow-sm ${i === 0 ? `bg-gradient-to-br ${m.color} shadow-lg shadow-[#697D58]/20` : `${m.color} border ${m.borderColor}`} transition-all hover:shadow-md`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-white/70' : 'text-slate-400'}`}>{m.label}</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-white/10 text-white' : 'bg-[#8A9A5B]/10 text-[#697D58]'}`}>{m.icon}</div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-2xl font-extrabold ${i === 0 ? 'text-white' : m.textColor}`}>{m.value}</span>
                        {m.scoreBadge && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mb-1 ${
                                scoreMedio >= 70 ? 'bg-green-100 text-green-700' :
                                scoreMedio >= 40 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {scoreMedio >= 70 ? 'ALTO' : scoreMedio >= 40 ? 'MÉDIO' : 'BAIXO'}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
