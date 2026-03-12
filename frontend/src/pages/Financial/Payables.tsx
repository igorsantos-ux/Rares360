import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { payablesApi } from '../../services/api';
import { Loader2, ArrowDownCircle } from 'lucide-react';

const PayablesPage = () => {

    const { data: payablesResponse, isLoading } = useQuery({
        queryKey: ['payables'],
        queryFn: async () => {
            const response = await payablesApi.getPayables();
            return response.data;
        }
    });

    const payablesData = useMemo(() => {
        if (!payablesResponse) return [];
        return Array.isArray(payablesResponse.items) 
            ? payablesResponse.items 
            : Array.isArray(payablesResponse) 
                ? payablesResponse 
                : [];
    }, [payablesResponse]);

    const displayPayables = useMemo(() => {
        try {
            const flattened = payablesData.flatMap((account: any) => {
                const installments = Array.isArray(account?.installments) ? account.installments : [];
                return installments.map((inst: any) => ({
                    id: inst?.id || `temp-${Math.random()}`,
                    description: String(account?.description || 'Despesa'),
                    amount: Number(inst?.amount || 0),
                    status: String(inst?.status || 'PENDING')
                }));
            });
            return flattened;
        } catch (error) {
            console.error('Crash no mapeamento:', error);
            return [];
        }
    }, [payablesData]);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div className="p-20 text-center space-y-8">
            <h1 className="text-4xl font-black text-[#697D58]">Contas a Pagar (Modo Seguro)</h1>
            <p className="text-slate-500">Esta é uma versão simplificada para identificar a causa da tela branca.</p>
            
            <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                {displayPayables.length === 0 ? (
                    <p>Nenhuma conta encontrada.</p>
                ) : (
                    displayPayables.map((item: any) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-[#8A9A5B]/20 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <ArrowDownCircle className="text-[#8A9A5B]" size={20} />
                                <span className="font-bold text-slate-700">{item.description}</span>
                            </div>
                            <span className="font-black text-[#8A9A5B]">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PayablesPage;
