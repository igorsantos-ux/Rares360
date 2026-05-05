import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, BarChart3 } from 'lucide-react';

interface SummaryKPIsProps {
  summary: {
    totalInvestido: number;
    lucroMensalTotal: number;
    paybackMedioMeses: number;
    lucrativo: number;
    atencao: number;
    prejuizo: number;
  };
}

export default function InvestmentSummaryKPIs({ summary }: SummaryKPIsProps) {
  const cards = [
    {
      title: 'Total Investido',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalInvestido || 0),
      icon: DollarSign,
      color: 'bg-blue-500',
      description: 'Capital total alocado em ativos'
    },
    {
      title: 'Lucro Mensal (ROI)',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.lucroMensalTotal || 0),
      icon: TrendingUp,
      color: 'bg-[#8A9A5B]',
      description: 'Geração de caixa líquida combinada'
    },
    {
      title: 'Payback Médio',
      value: `${summary.paybackMedioMeses || 0} meses`,
      icon: Clock,
      color: 'bg-amber-500',
      description: 'Tempo médio de retorno do capital'
    },
    {
      title: 'Performance',
      value: `${summary.lucrativo || 0} / ${ (summary.lucrativo || 0) + (summary.atencao || 0) + (summary.prejuizo || 0) }`,
      icon: BarChart3,
      color: 'bg-indigo-500',
      description: 'Ativos operando com lucro real'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-2xl border border-[#8A9A5B]/10 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-${card.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6B7E45]">{card.title}</p>
              <h4 className="text-xl font-bold text-[#4A5D23]">{card.value}</h4>
            </div>
          </div>
          <p className="mt-4 text-xs text-[#6B7E45]/70 font-medium">{card.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
