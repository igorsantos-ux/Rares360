import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useInvestment, useInvestments } from '../../hooks/useInvestments';
import InvestmentForm from './components/InvestmentForm';

export default function InvestmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: investment, isLoading } = useInvestment(id!);
  const { updateInvestment } = useInvestments();

  const handleSubmit = async (data: any) => {
    try {
      await updateInvestment({ id: id!, data });
      toast.success('Investimento atualizado!');
      navigate(`/investments/${id}`);
    } catch (error: any) {
      toast.error('Erro ao atualizar investimento.');
    }
  };

  if (isLoading) return <div className="animate-pulse h-96 bg-white/50 rounded-3xl" />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/investments/${id}`)}
          className="p-2 hover:bg-white/50 rounded-xl transition-colors text-[#6B7E45]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#4A5D23]">Editar Investimento</h1>
          <p className="text-[#6B7E45]">Ajuste os parâmetros para recalcular o ROI.</p>
        </div>
      </div>

      <InvestmentForm onSubmit={handleSubmit} initialData={investment} />
    </div>
  );
}
