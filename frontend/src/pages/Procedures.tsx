import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, 
    Search, 
    Filter, 
    MoreHorizontal, 
    TrendingUp, 
    Package,
    Loader2,
} from 'lucide-react';
import { proceduresApi } from '../services/api';
import { toast, Toaster } from 'react-hot-toast';
import ProcedureModal from '../components/ProcedureModal';

const Procedures = () => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: procedures, isLoading } = useQuery({
        queryKey: ['procedures'],
        queryFn: () => proceduresApi.list({}).then(res => res.data),
    });

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este procedimento?')) return;
        try {
            await proceduresApi.delete(id);
            toast.success('Procedimento excluído com sucesso');
            queryClient.invalidateQueries({ queryKey: ['procedures'] });
        } catch (error) {
            toast.error('Erro ao excluir procedimento');
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

    const categories = Array.from(new Set(procedures?.map((p: any) => p.category) || []));

    const filteredProcedures = procedures?.filter((p: any) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'all' || p.category === category;
        return matchesSearch && matchesCategory;
    });

    if (isLoading) {
        return (
            <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="animate-spin text-[#8A9A5B]" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando catálogo...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Serviços e Preços</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de procedimentos e análise de margem de lucro.</p>
                </div>
                <button 
                    onClick={() => { setSelectedProcedureId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all w-fit"
                >
                    <Plus size={20} />
                    Novo Procedimento
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-[#8A9A5B]/10 rounded-2xl flex items-center justify-center text-[#8A9A5B] group-hover:scale-110 transition-transform">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Serviços</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">{filteredProcedures?.length || 0}</h5>
                    </div>
                </div>
                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margem Saudável</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">
                            {filteredProcedures?.filter((p: any) => p.marginPercentage >= 40).length || 0} itens
                        </h5>
                    </div>
                </div>
                <div className="bg-white p-7 rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                        <Filter size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margem Crítica</p>
                        <h5 className="text-2xl font-black text-[#1A202C]">
                             {filteredProcedures?.filter((p: any) => p.marginPercentage < 20).length || 0} itens
                        </h5>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar procedimento..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                        <button 
                            onClick={() => setCategory('all')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${category === 'all' ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Todos
                        </button>
                        {(categories as string[]).map((cat) => (
                            <button 
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-white text-[#8A9A5B] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Procedimento</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Custo Total</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Preço Base</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Margem</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8A9A5B]/5">
                            {filteredProcedures?.map((p: any) => (
                                <tr key={p.id} className="hover:bg-[#8A9A5B]/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white border border-[#8A9A5B]/10 text-[#8A9A5B] rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                                                {p.name.charAt(0)}
                                            </div>
                                            <p className="font-black text-slate-700 text-sm leading-tight">{p.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                            {p.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center text-xs font-bold text-slate-600">
                                        {formatCurrency(p.totalCost || 0)}
                                    </td>
                                    <td className="px-8 py-6 text-center text-sm font-black text-slate-800">
                                        {formatCurrency(p.basePrice || 0)}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                                p.marginPercentage >= 40 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                                : p.marginPercentage < 20
                                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                : 'bg-amber-50 text-amber-600 border-amber-200'
                                            }`}>
                                                {Math.round(p.marginPercentage || 0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEdit(p.id)}
                                                className="p-2.5 bg-white rounded-xl shadow-sm border border-[#8A9A5B]/10 text-[#8A9A5B] hover:bg-[#8A9A5B] hover:text-white transition-all"
                                            >
                                                <TrendingUp size={18} />
                                            </button>
                                            <div className="relative group/menu">
                                                <button className="p-2.5 text-slate-400 hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#8A9A5B]/10">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all">
                                                    <button 
                                                        onClick={() => handleEdit(p.id)}
                                                        className="w-full text-left px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        Detalhes e Preço
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p.id)}
                                                        className="w-full text-left px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!filteredProcedures || filteredProcedures.length === 0) && (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Package className="text-slate-200" size={48} strokeWidth={1} />
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest text-center">Nenhum serviço encontrado</p>
                        </div>
                    )}
                </div>
            </div>

            <ProcedureModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                procedureId={selectedProcedureId}
            />
        </div>
    );
};

export default Procedures;
