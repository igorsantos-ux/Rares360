import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, 
    Search, 
    Filter, 
    MoreHorizontal, 
    Edit, 
    Trash2, 
    TrendingUp, 
    ArrowDownRight,
    ArrowUpRight,
    Package,
    ShieldAlert,
    Download
} from 'lucide-react';
import { proceduresApi } from '../services/api';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '../components/ui/table';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import ProcedureModal from '../components/ProcedureModal';
import AlertDialog from '../components/ui/AlertDialog';

const Procedures = () => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['procedures', page, search, category],
        queryFn: () => proceduresApi.list({ page, search, category }),
    });

    const handleDelete = async () => {
        if (!idToDelete) return;
        try {
            setIsDeleting(true);
            await proceduresApi.delete(idToDelete);
            toast.success('Procedimento excluído com sucesso');
            queryClient.invalidateQueries({ queryKey: ['procedures'] });
            setIdToDelete(null);
        } catch (error) {
            toast.error('Erro ao excluir procedimento');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (id: string) => {
        setSelectedProcedureId(id);
        setIsModalOpen(true);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Catálogo de Procedimentos</h1>
                    <p className="text-gray-500 mt-1 uppercase text-xs font-semibold tracking-wider flex items-center gap-2">
                        <Package size={14} className="text-olive-600" />
                        Gestão de Serviços e Precificação Inteligente
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => toast.error('Módulo de importação em desenvolvimento')}
                        className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50 transition-all text-sm font-medium text-gray-600"
                    >
                        <Download size={18} />
                        Importar Planilha
                    </button>
                    <button 
                        onClick={() => { setSelectedProcedureId(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-olive-600 text-white px-6 py-2.5 rounded-xl hover:bg-olive-700 transition-all shadow-lg shadow-olive-600/20 text-sm font-medium"
                    >
                        <Plus size={18} />
                        Novo Procedimento
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-olive-600 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome do procedimento..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-100 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600/20 focus:bg-white transition-all text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                        <Filter size={16} className="text-gray-500" />
                        <select 
                            className="bg-transparent text-sm focus:outline-none text-gray-600 font-medium"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="">Todas Categorias</option>
                            <option value="Injetáveis">Injetáveis</option>
                            <option value="Facial">Facial</option>
                            <option value="Corporal">Corporal</option>
                            <option value="Consulta">Consulta</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 px-6 text-gray-600 font-bold uppercase text-[10px] tracking-widest">Procedimento</TableHead>
                            <TableHead className="py-4 px-6 text-gray-600 font-bold uppercase text-[10px] tracking-widest">Grupo</TableHead>
                            <TableHead className="py-4 px-6 text-gray-600 font-bold uppercase text-[10px] tracking-widest">Custo Variável</TableHead>
                            <TableHead className="py-4 px-6 text-gray-600 font-bold uppercase text-[10px] tracking-widest">Preço Praticado</TableHead>
                            <TableHead className="py-4 px-6 text-gray-600 font-bold uppercase text-[10px] tracking-widest text-right">Margem %</TableHead>
                            <TableHead className="py-4 px-6 text-gray-600 font-bold uppercase text-[10px] tracking-widest text-center w-20">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    <TableCell colSpan={6} className="py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></TableCell>
                                </TableRow>
                            ))
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="bg-gray-50 p-4 rounded-full">
                                            <Package size={40} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-medium">Nenhum procedimento encontrado</p>
                                        <button 
                                            onClick={() => setIsModalOpen(true)}
                                            className="text-olive-600 text-sm font-bold hover:underline"
                                        >
                                            Cadastrar primeiro procedimento
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((procedure: any) => (
                                <TableRow key={procedure.id} className="hover:bg-olive-50/20 transition-colors group">
                                    <TableCell className="py-5 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 group-hover:text-olive-700 transition-colors">{procedure.name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter">ID: {procedure.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 px-6 text-gray-600">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {procedure.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-5 px-6 font-medium text-gray-600">
                                        {formatCurrency(procedure.variableCost)}
                                    </TableCell>
                                    <TableCell className="py-5 px-6">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{formatCurrency(procedure.basePrice)}</span>
                                            <TrendingUp size={14} className="text-olive-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 px-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`font-black text-lg ${
                                                String(procedure.margin).startsWith('-') || procedure.margin < 20
                                                ? 'text-rose-500' 
                                                : procedure.margin > 40 
                                                ? 'text-olive-600' 
                                                : 'text-gray-900'
                                            }`}>
                                                {Number(procedure.margin).toFixed(1)}%
                                            </span>
                                            {procedure.margin < 20 && (
                                                <span className="text-[10px] text-rose-500 font-bold uppercase flex items-center gap-1 mt-0.5 animate-pulse">
                                                    <ShieldAlert size={10} />
                                                    Margem Crítica
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 px-6 text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="p-2 hover:bg-olive-100/50 rounded-xl transition-colors outline-none">
                                                <MoreHorizontal size={18} className="text-gray-400 group-hover:text-olive-600" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-gray-100 shadow-xl">
                                                <DropdownMenuItem 
                                                    onClick={() => handleEdit(procedure.id)}
                                                    className="flex items-center gap-2 p-2.5 rounded-xl focus:bg-olive-50 cursor-pointer text-sm font-medium"
                                                >
                                                    <Edit size={16} />
                                                    Editar Detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => setIdToDelete(procedure.id)}
                                                    className="flex items-center gap-2 p-2.5 rounded-xl focus:bg-rose-50 text-rose-600 focus:text-rose-700 cursor-pointer text-sm font-medium"
                                                >
                                                    <Trash2 size={16} />
                                                    Excluir Registro
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                
                {/* Pagination Placeholder */}
                {data && data.pages > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Página {page} de {data.pages}</span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Anterior
                            </button>
                            <button 
                                disabled={page === data.pages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            {isModalOpen && (
                <ProcedureModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    procedureId={selectedProcedureId}
                />
            )}

            <AlertDialog 
                isOpen={!!idToDelete}
                onClose={() => setIdToDelete(null)}
                onConfirm={handleDelete}
                title="Excluir Procedimento"
                description="Tem certeza que deseja excluir este procedimento? Esta ação removerá o registro do catálogo e não poderá ser desfeita."
                confirmText="Excluir Procedimento"
                cancelText="Cancelar"
                variant="danger"
                isPending={isDeleting}
            />
        </div>
    );
};

export default Procedures;
