import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import type { DfcReportResponse, DfcAiInsights, DfcSimulatedScenario, DfcSimulationInput } from '../types/Dfc';

export interface DfcFilters {
    period: 'TODAY' | 'WEEK' | 'MONTH' | 'LAST_30' | 'LAST_90' | 'CUSTOM';
    mode: 'REALIZED' | 'PROJECTED' | 'BOTH';
    method: 'DIRECT' | 'INDIRECT';
    startDate?: string;
    endDate?: string;
}

export function useDfcReport(filters: DfcFilters) {
    return useQuery<DfcReportResponse, Error>({
        queryKey: ['dfc-report', filters],
        queryFn: async () => {
            const { data } = await api.post('/dfc/report', filters);
            return data as DfcReportResponse;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

export function useDfcAiInsights() {
    return useMutation<DfcAiInsights, Error, { dfcData: DfcReportResponse }>({
        mutationFn: async (payload) => {
            const { data } = await api.post('/dfc/ai-insights', payload);
            return data as DfcAiInsights;
        }
    });
}

export function useDfcSimulator() {
    return useMutation<{ scenarios: DfcSimulatedScenario[] }, Error, DfcSimulationInput>({
        mutationFn: async (payload) => {
            const { data } = await api.post('/dfc/simulate', payload);
            return data;
        }
    });
}

export function useExportDfcPdf() {
    return useMutation<Blob, Error, DfcFilters>({
        mutationFn: async (filters) => {
            const { data } = await api.post('/dfc/export-pdf', filters, {
                responseType: 'blob'
            });
            return data;
        }
    });
}
