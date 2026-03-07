import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialApi } from '../../services/api';
import {
    ArrowDownCircle,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Plus,
    Search,
    MoreVertical,
    DollarSign
} from 'lucide-react';

const PayablesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: summary } = useQuery({
        queryKey: ['financial-summary'],
        queryFn: async () => {
            const response = await financialApi.getSummary();
            return response.data;
        }
    });

    // Mock para visualização se não houver dados reais no seed
    const displayPayables = [
        { id: '1', description: 'Aluguel Sala 101', value: 3500, dueDate: '2026-03-10', status: 'PENDING', category: 'Fixo' },
        { id: '2', description: 'Fornecedor Medicamentos', value: 1250.80, dueDate: '2026-03-05', status: 'OVERDUE', category: 'Variável' },
        { id: '3', description: 'Energia Elétrica', value: 420.15, dueDate: '2026-03-08', status: 'PENDING', category: 'Fixo' },
        { id: '4', description: 'Internet Fibra', value: 199.90, dueDate: '2026-03-01', status: 'PAID', category: 'Fixo' },
    ].filter(p => p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Contas a Pagar</h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de compromissos financeiros e fornecedores.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20} />
                        Nova Conta
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Pendente"
                    value={`R$ ${summary?.pendingPayables?.toLocaleString() || '4.750,80'}`}
                    icon={<DollarSign size={20} />}
                    color="moss"
                />
                <StatCard
                    title="Atrasados"
                    value="R$ 1.250,80"
                    icon={<AlertCircle size={20} />}
                    color="dun"
                    alert
                />
                <StatCard
                    title="Vencendo Hoje"
                    value="R$ 0,00"
                    icon={<Calendar size={20} />}
                    color="moss"
                />
            </div>

            {/* List Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar conta ou fornecedor..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all">
                            Todos
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#8A9A5B]/10 rounded-xl text-xs font-bold text-[#697D58] hover:bg-[#8A9A5B]/5 transition-all">
                            Pendentes
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DEB587]/20 rounded-xl text-xs font-bold text-[#DEB587] hover:bg-[#DEB587]/5 transition-all">
                            Atrasados
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#8A9A5B]/5">
                            {displayPayables.map((item: any) => (
                                <tr key={item.id} className="hover:bg-[#8A9A5B]/5 transition-colors group cursor-pointer">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'OVERDUE' ? 'bg-[#DEB587]/20 text-[#DEB587]' : 'bg-[#8A9A5B]/10 text-[#697D58]'
                                                }`}>
                                                <ArrowDownCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-700 text-sm">{item.description}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-slate-600">
                                            {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-slate-800">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {item.status === 'PAID' ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={12} /> Pago
                                                </span>
                                            ) : item.status === 'OVERDUE' ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#DEB587]/10 text-[#DEB587] rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    <AlertCircle size={12} /> Atrasado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    <Calendar size={12} /> Pendente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-[#8A9A5B]">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, alert }: any) => (
    <div className={`bg-white p-6 rounded-3xl border ${alert ? 'border-[#DEB587]/30 shadow-lg shadow-[#DEB587]/5' : 'border-[#8A9A5B]/10 shadow-sm'} flex items-center gap-5 group`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color === 'moss' ? 'bg-[#8A9A5B]/10 text-[#8A9A5B]' : 'bg-[#DEB587]/10 text-[#DEB587]'
            }`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h5 className={`text-2xl font-black ${alert ? 'text-[#DEB587]' : 'text-[#1A202C]'}`}>{value}</h5>
        </div>
    </div>
);

export default PayablesPage;
