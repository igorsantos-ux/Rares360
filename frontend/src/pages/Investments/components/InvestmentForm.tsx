import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Calculator, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSimulate } from '../../../hooks/useSimulate';

interface InvestmentFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting?: boolean;
}

export default function InvestmentForm({ onSubmit, initialData, isSubmitting }: InvestmentFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: initialData?.nome || '',
    categoria: initialData?.categoria || 'EQUIPAMENTO_LASER',
    valorTotal: initialData?.valorTotal || 0,
    entrada: initialData?.entrada || 0,
    parcelas: initialData?.parcelas || 1,
    jurosMes: initialData?.jurosMes || 0,
    dataAquisicao: initialData?.dataAquisicao ? new Date(initialData.dataAquisicao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    vidaUtilAnos: initialData?.vidaUtilAnos || 5,
    valorResidualPct: initialData?.valorResidualPct || 0.1,
    ticketMedio: initialData?.ticketMedio || 0,
    sessoesMetaMes: initialData?.sessoesMetaMes || 0,
    custoInsumoSessao: initialData?.custoInsumoSessao || 0,
    custoFixoMensal: initialData?.custoFixoMensal || 0,
    taxasRepasse: initialData?.taxasRepasse || 0.4,
    notas: initialData?.notas || '',
  });

  const { result: simulation } = useSimulate(formData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Content */}
      <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-[#8A9A5B]/10 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-[#8A9A5B]/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: step >= i ? '100%' : '0%' }}
                className="h-full bg-[#8A9A5B]"
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-[#4A5D23] mb-1">Informações Básicas</h2>
                <p className="text-sm text-[#6B7E45]">O que estamos adquirindo e por quanto?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Nome do Ativo</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Ex: Laser Lavieen 2024"
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Categoria</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  >
                    <option value="EQUIPAMENTO_LASER">Equipamento Laser</option>
                    <option value="EQUIPAMENTO_TECNOLOGIA">Equipamento Tecnologia</option>
                    <option value="EQUIPAMENTO_ESTETICO">Equipamento Estético</option>
                    <option value="REFORMA">Reforma / Infraestrutura</option>
                    <option value="MARKETING">Marketing / Branding</option>
                    <option value="TREINAMENTO">Treinamento / Educação</option>
                    <option value="CAPITAL_GIRO">Capital de Giro</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Valor Total</label>
                  <input
                    type="number"
                    name="valorTotal"
                    value={formData.valorTotal}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Data de Aquisição</label>
                  <input
                    type="date"
                    name="dataAquisicao"
                    value={formData.dataAquisicao}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 bg-[#8A9A5B] text-white rounded-xl font-bold hover:bg-[#76844D] transition-all"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-[#4A5D23] mb-1">Condições e Depreciação</h2>
                <p className="text-sm text-[#6B7E45]">Como será o pagamento e qual a vida útil?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Entrada (R$)</label>
                  <input
                    type="number"
                    name="entrada"
                    value={formData.entrada}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Parcelas</label>
                  <input
                    type="number"
                    name="parcelas"
                    value={formData.parcelas}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Vida Útil (Anos)</label>
                  <input
                    type="number"
                    name="vidaUtilAnos"
                    value={formData.vidaUtilAnos}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Valor Residual (%)</label>
                  <input
                    type="number"
                    name="valorResidualPct"
                    step="0.01"
                    value={formData.valorResidualPct}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-8 py-3 text-[#6B7E45] font-bold hover:text-[#4A5D23] transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 bg-[#8A9A5B] text-white rounded-xl font-bold hover:bg-[#76844D] transition-all"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-[#4A5D23] mb-1">Previsão de Receita e Custos</h2>
                <p className="text-sm text-[#6B7E45]">Quanto esse investimento vai gerar por mês?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Ticket Médio (R$)</label>
                  <input
                    type="number"
                    name="ticketMedio"
                    value={formData.ticketMedio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Meta Sessões / Mês</label>
                  <input
                    type="number"
                    name="sessoesMetaMes"
                    value={formData.sessoesMetaMes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Taxa Repasse (%)</label>
                  <input
                    type="number"
                    name="taxasRepasse"
                    step="0.01"
                    value={formData.taxasRepasse}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#4A5D23] uppercase tracking-wider">Custo Variável / Sessão</label>
                  <input
                    type="number"
                    name="custoInsumoSessao"
                    value={formData.custoInsumoSessao}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#F0EAD6]/30 border border-[#8A9A5B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/50 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-8 py-3 text-[#6B7E45] font-bold hover:text-[#4A5D23] transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={() => onSubmit(formData)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-[#4A5D23] text-white rounded-xl font-bold hover:bg-[#3A491A] transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar - Real-time Simulation */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-[#8A9A5B]/10 shadow-sm sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-[#8A9A5B]" />
            <h3 className="text-lg font-bold text-[#4A5D23]">Simulação em Tempo Real</h3>
          </div>

          {simulation ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Lucro Estimado / Mês</p>
                <h4 className="text-2xl font-black text-emerald-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(simulation.lucroMensal)}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#8A9A5B]/10 rounded-xl">
                  <p className="text-[10px] font-bold text-[#6B7E45] uppercase mb-1">ROI Anual</p>
                  <p className="text-lg font-bold text-[#4A5D23]">{simulation.roiAnual}%</p>
                </div>
                <div className="p-3 bg-white border border-[#8A9A5B]/10 rounded-xl">
                  <p className="text-[10px] font-bold text-[#6B7E45] uppercase mb-1">Payback</p>
                  <p className="text-lg font-bold text-[#4A5D23]">{simulation.paybackMeses || 'N/A'} meses</p>
                </div>
              </div>

              <div className="p-4 bg-[#F0EAD6]/30 rounded-2xl border border-[#8A9A5B]/10">
                <p className="text-[10px] font-bold text-[#6B7E45] uppercase tracking-wider mb-2">Break-even Point</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7E45]">Mín. Faturamento:</span>
                    <span className="font-bold text-[#4A5D23]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(simulation.peValorFaturamento)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7E45]">Mín. Sessões:</span>
                    <span className="font-bold text-[#4A5D23]">{simulation.peSessoes} sessões</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-medium leading-tight">
                <HelpCircle className="w-4 h-4 shrink-0" />
                Os valores são estimativas baseadas na configuração atual e podem variar.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 border-2 border-[#8A9A5B]/20 border-t-[#8A9A5B] rounded-full animate-spin mb-4" />
              <p className="text-sm text-[#6B7E45]">Calculando métricas...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
