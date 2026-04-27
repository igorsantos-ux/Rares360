import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error: any) => {
                // Não tentar novamente em erros de autenticação
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    return false;
                }
                return failureCount < 2;
            },
        },
    },
});
