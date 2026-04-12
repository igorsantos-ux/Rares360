import { useState } from 'react';
import { 
    X, 
    Upload, 
    FileText, 
    CheckCircle2, 
    Loader2, 
    Download,
    ArrowRight,
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../services/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportProceduresModal({ isOpen, onClose, onSuccess }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ imported: number; updated: number; total: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')) {
                setFile(selectedFile);
                setResult(null);
            } else {
                toast.error('Por favor, selecione um arquivo .csv ou .xlsx');
            }
        }
    };

    const handleImport = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            setProgress(10);

            const formData = new FormData();
            formData.append('type', 'pricing'); // Tipo Procedimento/Catálogo - ENVIAR ANTES DO ARQUIVO
            formData.append('file', file);

            // Simulação de progresso enquanto o backend processa
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 1000);

            const response = await api.post('import/finance', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            clearInterval(progressInterval);
            setProgress(100);

            setResult(response.data);
            toast.success('Importação concluída com sucesso!');
            onSuccess();
        } catch (error: any) {
            console.error('Erro na importação:', error);
            const msg = error.response?.data?.message || error.response?.data?.details || error.message;
            toast.error(`Falha na Importação: ${msg}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setIsProcessing(false);
        setProgress(0);
        setResult(null);
    };

    const downloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/templates/MODELO - PROCEDIMENTO.xlsx';
        link.download = 'MODELO - PROCEDIMENTO.xlsx';
        link.click();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                    />

                    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="bg-[#8A9A5B] p-8 text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <FileSpreadsheet size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">Importar Procedimentos</h2>
                                        <p className="text-white/80 text-xs font-medium uppercase tracking-widest">Catálogo Operacional</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {!result ? (
                                    <>
                                        {/* Upload Zone */}
                                        <label 
                                            className={`relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                                                file ? 'border-[#8A9A5B] bg-[#8A9A5B]/5' : 'border-slate-200 hover:border-[#8A9A5B] hover:bg-slate-50'
                                            }`}
                                        >
                                            <input type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileChange} disabled={isProcessing} />
                                            
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                                                file ? 'bg-[#8A9A5B] text-white scale-110' : 'bg-slate-100 text-slate-400 group-hover:scale-110 group-hover:bg-[#8A9A5B]/10 group-hover:text-[#8A9A5B]'
                                            }`}>
                                                {file ? <FileText size={32} /> : <Upload size={32} />}
                                            </div>

                                            {file ? (
                                                <div className="text-center">
                                                    <p className="text-slate-800 font-bold">{file.name}</p>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-slate-800 font-black uppercase tracking-wider text-sm">Selecione sua Planilha</p>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase mt-1">Formatos aceitos: .CSV e .XLSX</p>
                                                </div>
                                            )}
                                        </label>

                                        {/* Download Template */}
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white text-[#8A9A5B] rounded-xl flex items-center justify-center shadow-sm">
                                                    <Download size={18} />
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-black text-slate-700 uppercase tracking-widest">Modelo de Planilha</p>
                                                    <p className="text-slate-400 font-medium">Baixe o formato pronto para importar</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={downloadTemplate}
                                                className="px-5 py-2.5 bg-[#8A9A5B] text-white text-[10px] font-black rounded-xl hover:bg-[#697D58] transition-colors shadow-lg shadow-[#8A9A5B]/20 uppercase"
                                            >
                                                Baixar
                                            </button>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={handleImport}
                                            disabled={!file || isProcessing}
                                            className="w-full h-16 bg-[#8A9A5B] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 mt-4"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 size={24} className="animate-spin" />
                                                    Processando...
                                                </>
                                            ) : (
                                                <>
                                                    Fazer Upload
                                                    <ArrowRight size={20} />
                                                </>
                                            )}
                                        </button>

                                        {isProcessing && (
                                            <div className="space-y-3">
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        className="h-full bg-[#8A9A5B]"
                                                    />
                                                </div>
                                                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    {progress < 100 ? `Importando dados... ${progress}%` : 'Sincronizando banco de dados...'}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center space-y-8 py-4">
                                        <div className="relative">
                                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto relative z-10">
                                                <CheckCircle2 size={56} />
                                            </div>
                                            <motion.div 
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1.5, opacity: 0 }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                className="absolute inset-0 bg-emerald-100 rounded-full z-0"
                                            />
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-800">Sucesso!</h3>
                                            <p className="text-slate-400 font-medium">Os procedimentos foram importados com sucesso.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                                <p className="text-4xl font-black text-[#8A9A5B]">{result.imported}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Novos Itens</p>
                                            </div>
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                                <p className="text-4xl font-black text-amber-500">{result.updated}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Atualizados</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button 
                                                onClick={reset}
                                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                                            >
                                                Outro Arquivo
                                            </button>
                                            <button 
                                                onClick={onClose}
                                                className="flex-1 py-4 bg-[#8A9A5B] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#8A9A5B]/20 hover:scale-[1.05] transition-all"
                                            >
                                                Finalizar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
