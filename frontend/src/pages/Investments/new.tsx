import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useInvestments } from '../../hooks/useInvestments';
import InvestmentForm from './components/InvestmentForm';

export default function InvestmentNew() {
  const navigate = useNavigate();
  const { createInvestment } = useInvestments();

  const handleSubmit = async (data: any) => {
    try {
      await createInvestment(data);
      toast.success('Investimento cadastrado com sucesso!');
      navigate('/investments');
    } catch (error: any) {
      console.error('Error creating investment:', error);
      toast.error(error.response?.data?.error || 'Erro ao cadastrar investimento.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/investments')}
          className="p-2 hover:bg-white/50 rounded-xl transition-colors text-[#6B7E45]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#4A5D23]">Novo Investimento</h1>
          <p className="text-[#6B7E45]">Configure seu novo ativo e projete seu retorno financeiro.</p>
        </div>
      </div>

      <InvestmentForm onSubmit={handleSubmit} />
    </div>
  );
}
