import { motion } from 'framer-motion';
import { Target, TrendingUp, Info } from 'lucide-react';

interface BreakevenPanelProps {
  resultado: any;
  sessoesMeta: number;
}

export default function BreakevenPanel({ resultado, sessoesMeta }: BreakevenPanelProps) {
  const sessaoPct = Math.min((sessoesMeta / resultado.peSessoes) * 100, 100);
  
  return (
    <div className="bg-white p-8 rounded-3xl border border-[#8A9A5B]/10 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#8A9A5B]/10 rounded-lg">
            <Target className="w-6 h-6 text-[#8A9A5B]" />
          </div>
          <h3 className="text-xl font-bold text-[#4A5D23]">Ponto de Equilíbrio</h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#6B7E45] uppercase tracking-wider">Break-even</span>
          <p className="text-lg font-black text-[#4A5D23]">{resultado.peSessoes} sessões</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#6B7E45] font-medium">Cobertura de Custos (Sessões)</span>
            <span className="font-bold text-[#4A5D23]">{sessoesMeta} / {resultado.peSessoes}</span>
          </div>
          <div className="h-4 bg-[#F0EAD6]/30 rounded-full overflow-hidden border border-[#8A9A5B]/10 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sessaoPct}%` }}
              className={`h-full rounded-full ${sessaoPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'} shadow-sm`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#F0EAD6]/20 rounded-2xl border border-[#8A9A5B]/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#8A9A5B]" />
              <span className="text-xs font-bold text-[#6B7E45] uppercase">Faturamento Mínimo</span>
            </div>
            <p className="text-xl font-bold text-[#4A5D23]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado.peValorFaturamento)}
            </p>
            <p className="text-[10px] text-[#6B7E45] mt-1 italic">Necessário para cobrir todos os custos e depreciação.</p>
          </div>

          <div className="p-4 bg-[#8A9A5B]/5 rounded-2xl border border-[#8A9A5B]/10 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#8A9A5B] shrink-0" />
            <p className="text-xs text-[#6B7E45] leading-relaxed">
              O ponto de equilíbrio considera custos fixos, variáveis, impostos, comissões e a reserva para depreciação do ativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
