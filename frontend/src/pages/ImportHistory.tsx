import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importApi } from '../services/api';
import { 
    History, 
    FileText, 
    Trash2, 
    Loader2, 
    AlertTriangle,
    CheckCircle2,
    FileSpreadsheet,
    Package,
    Users,
    TrendingUp,
    Calculator
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import AlertDialog from '../components/ui/AlertDialog';

const ImportHistory = () => {
    const queryClient = useQueryClient();
    const [rollbackId, setRollbackId] = useState<string | null>(null);

    const { data: batches, isLoading } = useQuery({
        queryKey: ['import-batches'],
        queryFn: async () => {
            const response = await importApi.getBatches();
            return response.data;
        }
    });

    const rollbackMutation = useMutation({
        mutationFn: (id: string) => importApi.rollbackBatch(id),
        onSuccess: () => {
            toast.success('Importação desfeita com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['import-batches'] });
            setRollbackId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Erro ao desfazer importação');
        }
    });

    const getModuleConfig = (module: string) => {
        switch (module) {
            case 'PACIENTES':
                return { label: 'Pacientes', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <Users size={14} /> };
            case 'FATURAMENTO':
                return { label: 'Faturamento', color: 'bg-green-50 text-green-600 border-green-200', icon: <TrendingUp size={14} /> };
            case 'ESTOQUE':
                return { label: 'Estoque', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: <Package size={14} /> };
            case 'PROCEDIMENTOS':
                return { label: 'Procedimentos', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: <Calculator size={14} /> };
            default:
                return { label: module, color: 'bg-slate-50 text-slate-600 border-slate-200', icon: <FileText size={14} /> };
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando logs de auditoria...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div>
                <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Importações</h2>
                <p className="text-slate-500 font-medium mt-1">AuditLog: Histórico de dados injetados via planilhas externas.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#8A9A5B]/5">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Arquivo</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data / Hora</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Registros</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8A9A5B]/5">
                            {(!batches || batches.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                                <History size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold text-sm">Nenhuma importação registrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                batches?.map((batch: any) => {
                                    const config = getModuleConfig(batch.module);
                                    return (
                                        <tr key={batch.id} className="hover:bg-[#8A9A5B]/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white border border-[#8A9A5B]/10 text-[#8A9A5B] rounded-xl flex items-center justify-center shadow-sm">
                                                        <FileSpreadsheet size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-700 text-sm tracking-tight">{batch.fileName}</p>
                                                        <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {batch.id.slice(-8).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                                                    {config.icon}
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-bold text-slate-600">
                                                        {format(new Date(batch.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-black">
                                                        {format(new Date(batch.createdAt), "HH:mm")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 font-black text-xs">
                                                    <CheckCircle2 size={12} className="text-green-500" />
                                                    {batch.recordCount}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button 
                                                    onClick={() => setRollbackId(batch.id)}
                                                    className="p-2.5 bg-white border border-red-100 text-red-400 rounded-xl shadow-sm hover:bg-red-50 hover:text-red-500 transition-all group/btn"
                                                    title="Desfazer Importação (Rollback)"
                                                >
                                                    <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AlertDialog 
                isOpen={!!rollbackId} 
                onClose={() => setRollbackId(null)}
                onConfirm={() => rollbackId && rollbackMutation.mutate(rollbackId)}
                title="Atenção: Rollback Crítico"
                description={
                    <>
                        Você está prestes a excluir definitivamente os registros importados neste lote. 
                        <br /><br />
                        <strong className="text-red-600 font-black">Esta ação não pode ser desfeita e removerá todos os dados vinculados a estes registros.</strong>
                    </>
                }
                variant="danger"
                confirmText={rollbackMutation.isPending ? "Processando..." : "Confirmar Exclusão"}
                icon={AlertTriangle}
                isPending={rollbackMutation.isPending}
            />
        </div>
    );
};

export default ImportHistory;
