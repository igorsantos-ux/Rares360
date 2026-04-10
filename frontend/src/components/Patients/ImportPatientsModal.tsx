import { useState } from 'react';
import { 
    X, 
    Upload, 
    FileText, 
    CheckCircle2, 
    Loader2, 
    Download,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportPatientsModal({ isOpen, onClose, onSuccess }: Props) {
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
            formData.append('file', file);

            // Simulação de progresso enquanto o backend processa
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 1000);

            const response = await api.post('core/patients/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            clearInterval(progressInterval);
            setProgress(100);

            setResult(response.data);
            toast.success('Importação concluída com sucesso!');
            onSuccess();
        } catch (error: any) {
            console.error('Erro na importação:', error);
            toast.error(error.response?.data?.message || 'Erro ao importar pacientes. Verifique o formato do arquivo.');
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
        link.href = '/templates/MODELO - PACIENTE.xlsx';
        link.download = 'MODELO - PACIENTE.xlsx';
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
                            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="bg-[#8A9A5B] p-6 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">Importação em Massa</h2>
                                        <p className="text-white/80 text-xs font-medium">Carregue sua planilha do Feegow ou do modelo</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {!result ? (
                                    <>
                                        {/* Upload Zone */}
                                        <label 
                                            className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${
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
                                                    <p className="text-slate-400 text-xs mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-slate-800 font-black uppercase tracking-wider text-sm">Arraste sua planilha aqui</p>
                                                    <p className="text-slate-400 text-xs mt-1">Formatos aceitos: .CSV e .XLSX</p>
                                                </div>
                                            )}
                                        </label>

                                        {/* Download Template */}
                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                                    <Download size={16} />
                                                </div>
                                                <div className="text-xs">
                                                    <p className="font-black text-amber-800 uppercase tracking-widest">Não tem a planilha?</p>
                                                    <p className="text-amber-600 font-medium">Baixe aqui o nosso modelo padrão</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={downloadTemplate}
                                                className="px-4 py-2 bg-white text-amber-600 text-xs font-black rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors shadow-sm"
                                            >
                                                BAIXAR MODELO
                                            </button>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={handleImport}
                                            disabled={!file || isProcessing}
                                            className="w-full h-14 bg-[#8A9A5B] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#8A9A5B]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 size={24} className="animate-spin" />
                                                    PROCESSANDO...
                                                </>
                                            ) : (
                                                <>
                                                    INICIAR IMPORTAÇÃO
                                                    <ArrowRight size={20} />
                                                </>
                                            )}
                                        </button>

                                        {isProcessing && (
                                            <div className="space-y-2">
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        className="h-full bg-[#8A9A5B]"
                                                    />
                                                </div>
                                                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {progress < 100 ? `Importando dados... ${progress}%` : 'Finalizando...'}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center space-y-6 pt-4">
                                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <CheckCircle2 size={48} />
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800">Sucesso total!</h3>
                                            <p className="text-slate-400 text-sm font-medium">Os dados foram processados com inteligência.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-3xl font-black text-[#8A9A5B]">{result.imported}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Novos Pacientes</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-3xl font-black text-amber-500">{result.updated}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atualizados</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={reset}
                                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                                            >
                                                Importar Mais
                                            </button>
                                            <button 
                                                onClick={onClose}
                                                className="flex-2 py-4 bg-[#8A9A5B] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#8A9A5B]/20 hover:scale-[1.02] transition-all"
                                            >
                                                CONCLUIR SESSÃO
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
