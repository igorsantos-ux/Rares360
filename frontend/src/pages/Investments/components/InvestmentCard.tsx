import { motion } from 'framer-motion';
import { ChevronRight, Target, Activity, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InvestmentCardProps {
  investment: any;
}

export default function InvestmentCard({ investment }: InvestmentCardProps) {
  const { resultado } = investment;
  
  const statusColors = {
    LUCRATIVO: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
    ATENCAO: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' },
    PREJUIZO: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500' },
  };

  const status = statusColors[resultado.status as keyof typeof statusColors] || statusColors.ATENCAO;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl border border-[#8A9A5B]/10 overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${status.bg} ${status.text} border ${status.border} flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                {resultado.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#4A5D23] truncate max-w-[180px]">{investment.nome}</h3>
            <p className="text-xs text-[#6B7E45] font-medium">{investment.categoria.replace('_', ' ')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#4A5D23]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investment.valorTotal)}
            </p>
            <p className="text-[10px] text-[#6B7E45] font-medium">Investimento Inicial</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#8A9A5B]/5 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[#6B7E45] mb-1">
              <Target className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">Lucro/Mês</span>
            </div>
            <p className={`text-sm font-bold ${resultado.lucroMensal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado.lucroMensal)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[#6B7E45] mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">Payback</span>
            </div>
            <p className="text-sm font-bold text-[#4A5D23]">
              {resultado.paybackMeses ? `${resultado.paybackMeses} meses` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#6B7E45]">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">
              {new Date(investment.dataAquisicao).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <Link
            to={`/investments/${investment.id}`}
            className="flex items-center gap-1 text-sm font-bold text-[#8A9A5B] hover:text-[#76844D] transition-colors"
          >
            Ver Detalhes
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      {/* Barra de Progresso do ROI */}
      <div className="h-1.5 bg-[#8A9A5B]/5 w-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(resultado.roiAnual, 100)}%` }}
          className={`h-full ${resultado.roiAnual > 20 ? 'bg-emerald-500' : 'bg-amber-500'}`}
        />
      </div>
    </motion.div>
  );
}
