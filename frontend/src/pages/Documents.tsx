import { useState } from 'react';
import {
    FileText,
    Search,
    Upload,
    Folder,
    Download,
    MoreVertical,
    Clock,
    Users,
    Filter,
    FileCheck,
    Lock
} from 'lucide-react';

const DocumentsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Por enquanto, documentos reais ainda não têm endpoint de listagem global
    // Limpando os mocks e deixando a lista vazia preparada para integração futura
    const displayDocs = [].filter((d: any) => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const categories = [
        { label: "Contratos", count: 0, icon: <FileCheck size={20} />, active: true },
        { label: "Legal", count: 0, icon: <Lock size={20} /> },
        { label: "Pacientes", count: 0, icon: <Users size={20} /> },
        { label: "Financeiros", count: 0, icon: <Folder size={20} /> },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Documentos</h2>
                    <p className="text-slate-500 font-medium mt-1">Repositório central de arquivos e documentos da clínica.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Upload size={20} />
                        Fazer Upload
                    </button>
                </div>
            </div>

            {/* Document Categories */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {categories.map((cat, idx) => (
                    <CategoryCard key={idx} {...cat} />
                ))}
            </div>

            {/* Documents List */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar documentos..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                        <Filter size={16} /> Filtro
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {displayDocs.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-2">
                                <FileText size={32} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                                Nenhum documento encontrado
                            </p>
                            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest -mt-2">
                                Use o botão de upload para começar
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Arquivo</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamanho</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#8A9A5B]/5">
                                {displayDocs.map((doc: any) => (
                                    <tr key={doc.id} className="hover:bg-[#8A9A5B]/10 transition-colors group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#DEB587] border border-[#8A9A5B]/5 shadow-sm group-hover:scale-110 transition-transform">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-700 text-sm">{doc.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{doc.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{doc.category}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <Clock size={14} />
                                                {new Date(doc.date).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-400">{doc.size}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 hover:bg-white rounded-lg transition-all text-[#8A9A5B]">
                                                    <Download size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-400">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const CategoryCard = ({ label, count, icon, active }: any) => (
    <div className={`p-8 rounded-[2rem] border transition-all cursor-pointer group ${active ? 'bg-[#697D58] border-transparent shadow-xl shadow-[#697D58]/20 text-white' : 'bg-white border-[#8A9A5B]/10 hover:border-[#8A9A5B]/30 text-slate-600'
        }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${active ? 'bg-white/10 text-white' : 'bg-[#8A9A5B]/10 text-[#8A9A5B]'
            }`}>
            {icon}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${active ? 'text-white/60' : 'text-slate-400'}`}>Arquivos</p>
        <h4 className="text-2xl font-black">{count}</h4>
        <p className={`text-xs font-bold mt-1 ${active ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
    </div>
);

export default DocumentsPage;
