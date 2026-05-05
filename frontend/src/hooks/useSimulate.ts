import { useState, useMemo, useEffect } from 'react';
import { debounce } from 'lodash';
import api from '../services/api';

export interface InvestmentInput {
  valorTotal: number;
  entrada: number;
  parcelas: number;
  jurosMes: number;
  vidaUtilAnos: number;
  valorResidualPct: number;
  ticketMedio: number;
  sessoesMetaMes: number;
  custoInsumoSessao: number;
  custoFixoMensal: number;
  taxasRepasse: number;
}

export function useSimulate(input: InvestmentInput) {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const simulate = useMemo(
    () => debounce(async (data: InvestmentInput) => {
      try {
        setIsLoading(true);
        const res = await api.post('/investments/simulate', data);
        setResult(res.data);
      } catch (error) {
        console.error('Simulation error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    simulate(input);
    return () => simulate.cancel();
  }, [input, simulate]);

  return { result, isLoading };
}
