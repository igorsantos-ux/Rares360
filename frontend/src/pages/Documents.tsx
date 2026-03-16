import { useState } from 'react';
import { 
    FileText, 
    Search, 
    Upload, 
    Folder, 
    Clock, 
    Users, 
    Filter, 
    FileCheck, 
    Lock,
    ShieldCheck,
    Hospital,
    FileSignature,
    CheckCircle2,
    Eye,
    AlertCircle,
    ShieldAlert,
    Info,
    ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceApi, payablesApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentsPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'compliance' | 'repositorio'>('compliance');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);

    // --- Lógica de Compliance ---
    const { data: complianceDocs = [], isLoading: isLoadingCompliance } = useQuery({
        queryKey: ['compliance-docs'],
        queryFn: async () => {
            const res = await complianceApi.getDocuments();
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: activeTab === 'compliance'
    });
    
    const pendingCount = complianceDocs.filter((d: any) => d.status !== 'ENVIADO').length;
    const isCompliant = complianceDocs.length > 0 && pendingCount === 0;

    const updateDocMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => complianceApi.updateDocument(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compliance-docs'] });
            toast.success('Documento atualizado com sucesso!');
        },
        onError: () => {
            toast.error('Erro ao atualizar documento.');
        }
    });

    const handleComplianceUpload = async (docId: string, file: File) => {
        const loadingToast = toast.loading('Enviando arquivo...');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await payablesApi.uploadFile(formData);
            const fileUrl = uploadRes.data.fileUrl;
            await updateDocMutation.mutateAsync({ id: docId, data: { fileUrl, status: 'ENVIADO' } });
            toast.dismiss(loadingToast);
        } catch (error) {
            console.error('Upload error:', error);
            toast.dismiss(loadingToast);
            toast.error('Erro ao realizar upload.');
        }
    };

    // --- Lógica de Repositório Geral (Mocks por enquanto) ---
    const displayDocsRepo = [].filter((d: any) => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const categoriesRepo = [
        { label: "Contratos", count: 0, icon: <FileCheck size={20} />, active: true },
        { label: "Legal", count: 0, icon: <Lock size={20} /> },
        { label: "Pacientes", count: 0, icon: <Users size={20} /> },
        { label: "Financeiros", count: 0, icon: <Folder size={20} /> },
    ];

    const complianceCategories = [
        { id: 'Clínica', label: 'Documentos da Clínica', icon: <Hospital size={20} />, color: '#8A9A5B' },
        { id: 'Médico', label: 'Corpo Clínico (Médicos)', icon: <Users size={20} />, color: '#DEB587' },
        { id: 'Templates', label: 'Modelos & Templates', icon: <FileSignature size={20} />, color: '#697D58' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-[#697D58]">Gestão Documental</h2>
                    <p className="text-slate-500 font-medium mt-1">Repositório central e checklist de conformidade da clínica.</p>
                </div>
                {activeTab === 'compliance' && !isLoadingCompliance && (
                    <div className={`bg-white/50 backdrop-blur-sm border ${isCompliant ? 'border-[#8A9A5B]/20' : 'border-amber-500/20'} px-6 py-3 rounded-2xl flex items-center gap-3 transition-colors`}>
                        {isCompliant ? (
                            <ShieldCheck className="text-[#8A9A5B]" size={24} />
                        ) : (
                            <ShieldAlert className="text-amber-500" size={24} />
                        )}
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Compliance</p>
                            <p className={`text-sm font-bold ${isCompliant ? 'text-slate-700' : 'text-amber-700'}`}>
                                {isCompliant ? 'Conformidade em Dia' : `${pendingCount} Pendências Identificadas`}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Abas Personalizadas */}
            <div className="flex bg-slate-100/50 backdrop-blur-sm p-1.5 rounded-[2rem] w-full md:w-fit border border-[#8A9A5B]/10">
                <button
                    onClick={() => setActiveTab('compliance')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-sm font-black transition-all ${
                        activeTab === 'compliance' 
                        ? 'bg-[#8A9A5B] text-white shadow-xl shadow-[#8A9A5B]/20' 
                        : 'text-slate-500 hover:text-[#697D58]'
                    }`}
                >
                    <ShieldCheck size={18} />
                    Compliance (Obrigatórios)
                </button>
                <button
                    onClick={() => setActiveTab('repositorio')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-sm font-black transition-all ${
                        activeTab === 'repositorio' 
                        ? 'bg-[#8A9A5B] text-white shadow-xl shadow-[#8A9A5B]/20' 
                        : 'text-slate-500 hover:text-[#697D58]'
                    }`}
                >
                    <Folder size={18} />
                    Repositório Geral
                </button>
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'compliance' ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                        {isLoadingCompliance ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-[#8A9A5B]/20 border-t-[#8A9A5B] rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            complianceCategories.map((cat) => {
                                const catDocs = complianceDocs.filter((d: any) => d.category === cat.id);
                                if (catDocs.length === 0) return null;
                                return (
                                    <section key={cat.id} className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-[#8A9A5B]/10 pb-4">
                                            <div className="p-2.5 rounded-xl text-white shadow-sm" style={{ backgroundColor: cat.color }}>
                                                {cat.icon}
                                            </div>
                                            <h3 className="text-xl font-black text-slate-700 tracking-tight">{cat.label}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {catDocs.map((doc: any) => (
                                                <ComplianceCard 
                                                    key={doc.id} 
                                                    doc={doc} 
                                                    onUpload={(file) => handleComplianceUpload(doc.id, file)}
                                                    onMissing={() => { setSelectedDoc(doc); setIsConsultantModalOpen(true); }}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })
                        )}
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        {/* Categorias Repositório */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {categoriesRepo.map((cat, idx) => (
                                <CategoryCard key={idx} {...cat} />
                            ))}
                        </div>

                        {/* Listagem Geral */}
                        <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#8A9A5B]/10 shadow-sm overflow-hidden min-h-[400px]">
                            <div className="p-8 border-b border-[#8A9A5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar documentos no repositório..."
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 transition-all font-medium text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-[#8A9A5B]/10 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all">
                                        <Filter size={16} /> Filtro
                                    </button>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-[#8A9A5B] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        <Upload size={18} />
                                        Novo Arquivo
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                {displayDocsRepo.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-2">
                                            <FileText size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum documento encontrado</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Arquivo</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                            </tr>
                                        </thead>
                                        {/* Tbody remains logic-ready */}
                                    </table>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <ConsultantModal 
                isOpen={isConsultantModalOpen} 
                onClose={() => setIsConsultantModalOpen(false)} 
                docTitle={selectedDoc?.title}
            />
        </div>
    );
};

const ComplianceCard = ({ doc, onUpload, onMissing }: { doc: any, onUpload: (file: File) => void, onMissing: () => void }) => {
    const isSent = doc.status === 'ENVIADO';
    return (
        <motion.div whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-md rounded-3xl border border-[#8A9A5B]/10 shadow-sm p-6 flex flex-col gap-5 hover:border-[#8A9A5B]/40 transition-all group">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h4 className="font-black text-slate-700 leading-tight group-hover:text-[#697D58] transition-colors">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                        {isSent ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                                <CheckCircle2 size={12} /> Enviado
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                <Clock size={12} /> Pendente
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-[#8A9A5B] transition-colors"><FileText size={24} /></div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
                {isSent ? (
                    <div className="flex gap-2">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-[#8A9A5B]/20 rounded-xl text-[#8A9A5B] font-bold text-xs hover:bg-[#8A9A5B]/5 transition-all"><Eye size={16} /> Visualizar</a>
                        <label className="p-3 bg-white border border-[#8A9A5B]/20 rounded-xl text-slate-400 hover:text-[#8A9A5B] hover:border-[#8A9A5B]/40 cursor-pointer transition-all">
                            <Upload size={16} /><input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                        </label>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <label className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#8A9A5B] text-white rounded-xl font-bold text-xs shadow-lg shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
                            <Upload size={18} />Fazer Upload<input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0] as File)} />
                        </label>
                        <button onClick={onMissing} className="w-full py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Não tenho este documento</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const CategoryCard = ({ label, count, icon, active }: any) => (
    <div className={`p-8 rounded-[2rem] border transition-all cursor-pointer group ${active ? 'bg-[#697D58] border-transparent shadow-xl shadow-[#697D58]/20 text-white' : 'bg-white border-[#8A9A5B]/10 hover:border-[#8A9A5B]/30 text-slate-600'}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${active ? 'bg-white/10 text-white' : 'bg-[#8A9A5B]/10 text-[#8A9A5B]'}`}>{icon}</div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${active ? 'text-white/60' : 'text-slate-400'}`}>Arquivos</p>
        <h4 className="text-2xl font-black">{count}</h4>
        <p className={`text-xs font-bold mt-1 ${active ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
    </div>
);

const ConsultantModal = ({ isOpen, onClose, docTitle }: any) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden p-10 text-center">
                        <div className="mb-6 mx-auto w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500"><AlertCircle size={40} /></div>
                        <h3 className="text-2xl font-black text-slate-700 leading-tight">Segurança Jurídica</h3>
                        <p className="mt-4 text-slate-600 font-medium leading-relaxed">A regularização documental do <span className="font-black text-[#8A9A5B]">({docTitle})</span> é essencial para a blindagem jurídica da sua clínica.</p>
                        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                            <p className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2"><Info size={16} className="text-[#8A9A5B]" /> Como podemos ajudar?</p>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">Nossos parceiros especialistas podem cuidar de toda a burocracia para emissão e regularização deste documento para você.</p>
                        </div>
                        <div className="mt-10 flex flex-col gap-3">
                            <a href={`https://wa.me/5511999999999?text=Ol!%20Gostaria%20de%20falar%20com%20um%20especialista%20sobre%20a%20regularizao%20do%20documento:%20${docTitle}`} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-[#8A9A5B] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"><ExternalLink size={18} /> Falar com Especialista</a>
                            <button onClick={onClose} className="w-full py-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-all">Resolver depois</button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DocumentsPage;
