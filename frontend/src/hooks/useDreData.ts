import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
// Definindo internamente para desacoplar da pasta backend, ou referenciando.
import type { DreReportFilter, DreResponse, AiInsightsResponse } from '../types/Dre';

export const useDreData = (filter: DreReportFilter) => {
    return useQuery<DreResponse>({
        queryKey: ['dre-report', filter],
        queryFn: async () => {
            const response = await api.post('/dre/report', filter);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutos de cache
    });
};

export const useDreAiInsights = () => {
    return useMutation<AiInsightsResponse, Error, { dreData: DreResponse }>({
        mutationFn: async (payload) => {
            const response = await api.post('/dre/ai-insights', payload);
            return response.data;
        }
    });
};

export const useExportDrePdf = () => {
    return useMutation<{ message: string }, Error, DreReportFilter>({
        mutationFn: async (payload) => {
            // Endpoint que pode retornar um blob e disparar um download
            const response = await api.post('/dre/export-pdf', payload, { responseType: 'blob' });
            // Helper temporario para gerar link e baixar
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `DRE_Executivo_${new Date().getTime()}.pdf`);
            document.body.appendChild(link);
            link.click();
            return { message: "Exportação iniciada." };
        }
    });
};
