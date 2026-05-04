/**
 * useFormaPagamentoCalculo — Hook para simulação ao vivo de taxas de pagamento
 * Calcula taxas, valor líquido e valor da parcela em tempo real
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { formaPagamentoApi } from '../services/api';

interface CalculoResult {
    valorBruto: number;
    parcelas: number;
    taxas: {
        percentual: number;
        fixa: number;
        antecipacao: number;
        parcela: number;
        total: number;
    };
    valorLiquido: number;
    valorParcela: number;
    prazoRecebimento: number;
}

export function useFormaPagamentoCalculo() {
    const [resultado, setResultado] = useState<CalculoResult | null>(null);
    const [loading, setLoading] = useState(false);
    const debounceTimer = useRef<number | null>(null);

    const calcular = useCallback((formaId: string, valor: number, parcelas: number = 1) => {
        if (!formaId || !valor || valor <= 0) {
            setResultado(null);
            return;
        }

        // Debounce 300ms para não sobrecarregar API durante digitação
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await formaPagamentoApi.calcular({ formaId, valor, parcelas });
                setResultado(data);
            } catch (err) {
                console.error('Erro ao calcular taxas:', err);
                setResultado(null);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    const reset = useCallback(() => {
        setResultado(null);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    return { resultado, loading, calcular, reset };
}
