import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface Investment {
  id: string;
  nome: string;
  categoria: string;
  valorTotal: number;
  entrada: number;
  parcelas: number;
  jurosMes: number;
  dataAquisicao: string;
  vidaUtilAnos: number;
  valorResidualPct: number;
  ticketMedio: number;
  sessoesMetaMes: number;
  custoInsumoSessao: number;
  custoFixoMensal: number;
  taxasRepasse: number;
  notas?: string;
  resultado?: any;
}

export function useInvestments() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['investments'],
    queryFn: async () => {
      const res = await api.get('/investments');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newInv: any) => {
      const res = await api.post('/investments', newInv);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/investments/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/investments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
  });

  return {
    investments: data?.investments || [],
    summary: data?.summary || {},
    isLoading,
    error,
    createInvestment: createMutation.mutateAsync,
    updateInvestment: updateMutation.mutateAsync,
    deleteInvestment: deleteMutation.mutateAsync,
  };
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: async () => {
      const res = await api.get(`/investments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
