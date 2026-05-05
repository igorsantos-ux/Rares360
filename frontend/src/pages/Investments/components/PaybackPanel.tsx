import React from 'react';
import { motion } from 'framer-motion';
import { Clock, History, ArrowUpRight, MinusCircle } from 'lucide-react';

interface PaybackPanelProps {
  investment: any;
}

export default function PaybackPanel({ investment }: PaybackPanelProps) {
  const { resultado } = investment;
  
  const stats = [
    { label: 'Parcela Mensal', value: resultado.parcelaMensal, icon: History, type: 'cost' },
    { label: 'Depreciação', value: resultado.depreciacaoMensal, icon: MinusCircle, type: 'cost' },
    { label: 'Lucro Líquido', value: resultado.lucroMensal, icon: ArrowUpRight, type: 'profit' },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-[#8A9A5B]/10 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#8A9A5B]/10 rounded-lg">
            <Clock className="w-6 h-6 text-[#8A9A5B]" />
          </div>
          <h3 className="text-xl font-bold text-[#4A5D23]">Payback & Fluxo</h3>
        </div>
        <div className="px-4 py-2 bg-[#8A9A5B] text-white rounded-xl text-center">
          <p className="text-[10px] font-bold uppercase opacity-80">Estimativa</p>
          <p className="text-lg font-black">{resultado.paybackMeses ? `${resultado.paybackMeses} meses` : 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#F0EAD6]/20 border border-[#8A9A5B]/5"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${stat.type === 'profit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#4A5D23]">{stat.label}</span>
            </div>
            <p className={`text-lg font-black ${stat.type === 'profit' ? 'text-emerald-700' : 'text-[#4A5D23]'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.value)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-[#4A5D23] rounded-2xl text-white shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold opacity-80 uppercase tracking-widest">ROI Anual Projetado</span>
          <span className="text-2xl font-black">{resultado.roiAnual}%</span>
        </div>
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(resultado.roiAnual, 100)}%` }}
            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}
