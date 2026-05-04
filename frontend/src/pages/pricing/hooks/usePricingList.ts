import { useQuery } from '@tanstack/react-query';
import { pricingApi } from '../../../services/api';

export interface PricingFilters {
  tipo?: string;
  status?: string;
  search?: string;
}

export function usePricingList(filters: PricingFilters) {
  return useQuery({
    queryKey: ['pricing', filters],
    queryFn: () => pricingApi.getDiagnosis(filters).then(res => res.data),
    staleTime: 30 * 1000, // 30 segundos de cache
  });
}
