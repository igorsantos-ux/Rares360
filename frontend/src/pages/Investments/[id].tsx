import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Calendar, Tag, Info, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInvestment, useInvestments } from '../../hooks/useInvestments';
import EvolucaoChart from './components/EvolucaoChart';
import BreakevenPanel from './components/BreakevenPanel';
import PaybackPanel from './components/PaybackPanel';

export default function InvestmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: investment, isLoading, error } = useInvestment(id!);
  const { deleteInvestment } = useInvestments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#8A9A5B]/20 border-t-[#8A9A5B] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !investment) {
    return (
      <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-rose-100">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-rose-700">Erro ao carregar investimento</h3>
        <button onClick={() => navigate('/investments')} className="mt-4 text-[#8A9A5B] font-bold">Voltar para lista</button>
      </div>
    );
  }

  const { resultado } = investment;

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este investimento?')) {
      try {
        await deleteInvestment(id!);
        toast.success('Investimento excluído.');
        navigate('/investments');
      } catch (err) {
        toast.error('Erro ao excluir investimento.');
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header com Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/investments')}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors text-[#6B7E45]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#8A9A5B]/10 text-[#8A9A5B] text-[10px] font-bold uppercase rounded-md border border-[#8A9A5B]/20">
                {investment.categoria.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 ${
                resultado.status === 'LUCRATIVO' ? 'bg-emerald-50 text-emerald-700' : 
                resultado.status === 'ATENCAO' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {resultado.status}
              </span>
            </div>
            <h1 className="text-3xl font-black text-[#4A5D23]">{investment.nome}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/investments/${id}/edit`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#8A9A5B]/20 text-[#6B7E45] rounded-xl font-bold hover:bg-[#F0EAD6]/30 transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Cards de Performance */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gráfico de Evolução */}
          <div className="bg-white p-8 rounded-3xl border border-[#8A9A5B]/10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#8A9A5B]/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-[#8A9A5B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#4A5D23]">Projeção de Retorno</h3>
                  <p className="text-xs text-[#6B7E45] font-medium uppercase tracking-wider">Evolução acumulada em 24 meses</p>
                </div>
              </div>
            </div>
            <EvolucaoChart data={resultado.evolucao} />
          </div>

          <BreakevenPanel resultado={resultado} sessoesMeta={investment.sessoesMetaMes} />
          
          {/* Detalhes Técnicos */}
          <div className="bg-[#4A5D23] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Ticket Médio</p>
                  <p className="text-xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investment.ticketMedio)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Custo Insumo</p>
                  <p className="text-xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investment.custoInsumoSessao)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Repasse Prof.</p>
                  <p className="text-xl font-bold">{investment.taxasRepasse * 100}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Vida Útil</p>
                  <p className="text-xl font-bold">{investment.vidaUtilAnos} anos</p>
                </div>
             </div>
             {/* Efeito visual no fundo */}
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Tag className="w-32 h-32 rotate-12" />
             </div>
          </div>
        </div>

        {/* Lado Direito: Payback e Resumo */}
        <div className="space-y-8">
          <PaybackPanel investment={investment} />
          
          <div className="bg-white p-6 rounded-3xl border border-[#8A9A5B]/10 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
               <Calendar className="w-5 h-5 text-[#8A9A5B]" />
               <h4 className="font-bold text-[#4A5D23]">Aquisição</h4>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between text-sm">
                  <span className="text-[#6B7E45]">Data:</span>
                  <span className="font-bold text-[#4A5D23]">{new Date(investment.dataAquisicao).toLocaleDateString('pt-BR')}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-[#6B7E45]">Investimento:</span>
                  <span className="font-bold text-[#4A5D23]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investment.valorTotal)}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-[#6B7E45]">Entrada:</span>
                  <span className="font-bold text-[#4A5D23]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investment.entrada)}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-[#6B7E45]">Parcelamento:</span>
                  <span className="font-bold text-[#4A5D23]">{investment.parcelas}x</span>
               </div>
            </div>
          </div>

          {investment.notas && (
            <div className="bg-[#F0EAD6]/30 p-6 rounded-3xl border border-[#8A9A5B]/10">
               <div className="flex items-center gap-2 mb-3 text-[#4A5D23]">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Notas e Observações</span>
               </div>
               <p className="text-sm text-[#6B7E45] leading-relaxed italic">
                 "{investment.notas}"
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
