import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pepApi, coreApi } from '../../services/api';
import { 
  X, 
  FileCheck, 
  Play, 
  Loader2, 
  WalletCards,
  CheckCircle2,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
}

export function ProposalModal({ isOpen, onClose, patientId, patientName }: Props) {
  const queryClient = useQueryClient();
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const { data: proposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ['patient-proposals', patientId],
    queryFn: () => pepApi.getProposals(patientId).then(res => res.data),
    enabled: !!patientId && isOpen
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => coreApi.getDoctors().then(res => res.data),
    enabled: isOpen
  });

  const handleUpdateStatus = async (id: string, status: string, additionalData: any = {}) => {
    try {
      await pepApi.updateProposalStatus(id, status, additionalData);
      toast.success(`Status atualizado para ${status}`);
      queryClient.invalidateQueries({ queryKey: ['patient-proposals', patientId] });
      setSelectedProposal(null);
      setIsExecuting(false);
    } catch (error) {
      toast.error('Erro ao atualizar status do orçamento');
    }
  };

  const handleExecute = async () => {
    if (!selectedDoctorId) {
      toast.error('Selecione o profissional responsável');
      return;
    }
    
    setIsExecuting(true);
    try {
      // O backend agora lida com os triggers de estoque e follow-up
      await pepApi.updateProposalStatus(selectedProposal.id, 'EXECUTADO', { 
        professionalId: selectedDoctorId 
      });
      toast.success('Orçamento marcado como EXECUTADO. Estoque e Follow-up disparados!');
      queryClient.invalidateQueries({ queryKey: ['patient-proposals', patientId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] }); // Para atualizar flags na agenda
      setSelectedProposal(null);
      setIsExecuting(false);
    } catch (error) {
      toast.error('Erro ao executar orçamento');
      setIsExecuting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 bg-[#8A9A5B] text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <WalletCards size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Orçamentos & Contratos</h2>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{patientName || 'Paciente'}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#FDFBF7]">
              {isLoadingProposals ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-[#8A9A5B]" size={40} />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando propostas...</p>
                </div>
              ) : proposals?.length === 0 ? (
                <div className="text-center py-16 space-y-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <WalletCards size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-700">Nenhum orçamento encontrado</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">Este paciente ainda não possui propostas financeiras cadastradas.</p>
                  </div>
                  <button className="px-8 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-[#8A9A5B]/20">
                    Criar Novo Orçamento
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals?.map((proposal: any) => (
                    <div 
                        key={proposal.id}
                        className={`bg-white border rounded-3xl p-6 transition-all ${
                            selectedProposal?.id === proposal.id ? 'border-[#8A9A5B] ring-2 ring-[#8A9A5B]/10' : 'border-slate-100'
                        }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              proposal.status === 'EXECUTADO' ? 'bg-emerald-50 text-emerald-500' :
                              proposal.status === 'CONTRATO' ? 'bg-blue-50 text-blue-500' :
                              proposal.status === 'APROVADO' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {proposal.status === 'EXECUTADO' ? <CheckCircle2 size={20} /> : <FileCheck size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-slate-700">#{(proposal.id || '').split('-')[0].toUpperCase()}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                    proposal.status === 'EXECUTADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    proposal.status === 'CONTRATO' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    proposal.status === 'APROVADO' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}>
                                    {proposal.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                {new Date(proposal.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-[#697D58]">
                            R$ {proposal.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Procedimentos / Itens</p>
                        <div className="space-y-1">
                            {Array.isArray(proposal.items) && proposal.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-600">{item.name}</span>
                                    <span className="text-slate-400">x{item.quantity} - R$ {(item.price || 0).toLocaleString('pt-BR')}</span>
                                </div>
                            ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {proposal.status === 'PENDENTE' && (
                            <>
                                <button 
                                    onClick={() => handleUpdateStatus(proposal.id, 'APROVADO')}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all"
                                >
                                    Aprovar Orçamento
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(proposal.id, 'CONTRATO')}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all flex items-center gap-2"
                                >
                                    <FileCheck size={14} />
                                    Converter em Contrato
                                </button>
                            </>
                        )}
                        
                        {(proposal.status === 'APROVADO' || proposal.status === 'CONTRATO') && (
                            <button 
                                onClick={() => setSelectedProposal(proposal)}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
                            >
                                <Play size={14} />
                                Marcar como Executado
                            </button>
                        )}

                        {proposal.status === 'EXECUTADO' && (
                            <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-emerald-600">
                                <CheckCircle2 size={14} />
                                <span>Executado em {new Date(proposal.executedAt).toLocaleDateString()}</span>
                                {proposal.professional?.name && (
                                    <span className="text-slate-400 font-medium">| Dr(a). {proposal.professional.name}</span>
                                )}
                            </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal de Execução (Confirmação) */}
            <AnimatePresence>
                {selectedProposal && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-x-8 bottom-8 top-[150px] bg-white rounded-3xl shadow-2xl border border-[#8A9A5B]/20 p-8 flex flex-col z-10"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Confirmar Execução</h3>
                                <p className="text-sm text-slate-500">Ao marcar como executado, o sistema realizará a baixa de estoque automática e criará a tarefa de follow-up.</p>
                            </div>
                            <button onClick={() => setSelectedProposal(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Profissional Responsável</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select 
                                            value={selectedDoctorId}
                                            onChange={(e) => setSelectedDoctorId(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-bold text-sm"
                                        >
                                            <option value="">Selecione o profissional</option>
                                            {doctors?.map((doc: any) => (
                                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Data de Execução</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="date" 
                                            readOnly 
                                            value={new Date().toISOString().split('T')[0]}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-700">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-xs font-medium leading-relaxed">
                                    Certifique-se de que todos os itens do orçamento foram utilizados. A baixa de estoque será realizada para os itens que possuem correspondência no cadastro de inventário.
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 mt-6 flex gap-3">
                             <button 
                                onClick={() => setSelectedProposal(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleExecute}
                                disabled={isExecuting}
                                className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                {isExecuting ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                                Confirmar e Finalizar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-white">
                <button onClick={onClose} className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600">
                    Fechar Painel Financeiro
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
