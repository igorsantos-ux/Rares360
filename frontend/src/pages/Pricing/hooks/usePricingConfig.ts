import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '../../../services/api';
import { useMemo } from 'react';
import { debounce } from 'lodash';

export function usePricingConfig() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: () => pricingApi.getConfig().then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (newConfig: any) => pricingApi.updateConfig(newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
    },
  });

  // Debounce para não sobrecarregar o servidor enquanto o usuário move sliders
  const updateConfig = useMemo(
    () => debounce((newConfig: any) => mutation.mutate(newConfig), 800),
    [mutation]
  );

  return { 
    config, 
    isLoading, 
    updateConfig,
    isUpdating: mutation.isPending 
  };
}
