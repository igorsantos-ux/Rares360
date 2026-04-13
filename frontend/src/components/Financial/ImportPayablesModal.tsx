import { useState } from 'react';
import {
    X,
    Upload,
    FileText,
    CheckCircle2,
    Loader2,
    ArrowRight,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { importApi } from '../../services/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportPayablesModal({ isOpen, onClose, onSuccess }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ successCount: number; errorCount: number; totalRows: number; batchId: string } | null>(null);

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

            const progressInterval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 1000);

            const response = await importApi.importPayables(formData);

            clearInterval(progressInterval);
            setProgress(100);

            setResult(response.data);
            toast.success('Processamento concluído!');
            onSuccess();
        } catch (error: any) {
            console.error('Erro na importação:', error);
            toast.error(error.response?.data?.message || 'Erro ao importar dados. Verifique a segurança da clínica ou o formato do arquivo.');
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
                            <div className="bg-[#DEB587] p-6 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">Contas a Pagar</h2>
                                        <p className="text-white/80 text-xs font-medium">Importação de Planilha "MODELO"</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {!result ? (
                                    <>
                                        {/* Security Notice */}
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
                                            <AlertCircle size={20} className="text-amber-500 shrink-0" />
                                            <p className="text-[10px] font-bold text-amber-700 uppercase leading-relaxed tracking-wider">
                                                Atenção: O sistema validará se o CNPJ/Empresa na planilha coincide com esta unidade.
                                                Divergências causarão falha de segurança no upload.
                                            </p>
                                        </div>

                                        {/* Step 2: Upload Zone */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Carregue o arquivo</p>
                                            <label
                                                className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group ${file ? 'border-[#DEB587] bg-[#DEB587]/5' : 'border-slate-200 hover:border-[#DEB587] hover:bg-slate-50'
                                                    }`}
                                            >
                                                <input type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileChange} disabled={isProcessing} />

                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all ${file ? 'bg-[#DEB587] text-white scale-110 shadow-lg shadow-[#DEB587]/20' : 'bg-slate-100 text-slate-400 group-hover:bg-[#DEB587]/10 group-hover:text-[#DEB587]'
                                                    }`}>
                                                    {file ? <FileText size={28} /> : <Upload size={28} />}
                                                </div>

                                                {file ? (
                                                    <div className="text-center">
                                                        <p className="text-sm text-slate-800 font-bold">{file.name}</p>
                                                        <p className="text-slate-400 text-[10px] mt-0.5">{(file.size / 1024).toFixed(2)} KB</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <p className="text-slate-800 font-black uppercase tracking-wider text-xs">Arraste sua planilha modelo aqui</p>
                                                        <p className="text-slate-400 text-[10px] mt-1 font-medium">XLSX ou CSV</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={handleImport}
                                            disabled={!file || isProcessing}
                                            className="w-full h-14 bg-[#DEB587] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#DEB587]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 mt-4"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 size={24} className="animate-spin" />
                                                    Mapeando Dados...
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
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        className="h-full bg-[#DEB587]"
                                                    />
                                                </div>
                                                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {progress < 100 ? `Ponto de controle ${progress}%` : 'Sincronizando com banco...'}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center space-y-6 pt-4">
                                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                                            <CheckCircle2 size={48} />
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800">Processamento Concluído</h3>
                                            <p className="text-slate-400 text-sm font-medium">Lote vinculado ID: {result.batchId.slice(0, 8)}...</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-3xl font-black text-emerald-500">{result.successCount}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sucessos</p>
                                            </div>
                                            <div className={`bg-slate-50 p-4 rounded-2xl border ${result.errorCount > 0 ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'}`}>
                                                <p className={`text-3xl font-black ${result.errorCount > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{result.errorCount}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Falhas</p>
                                            </div>
                                        </div>

                                        {result.errorCount > 0 && (
                                            <div className="text-left bg-rose-50 border border-rose-100 p-3 rounded-xl">
                                                <p className="text-rose-600 text-[10px] font-bold uppercase tracking-wider">
                                                    DICA: Verifique o histórico de importação para baixar o log de erros detalhado por linha.
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={reset}
                                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                                            >
                                                Outro Arquivo
                                            </button>
                                            <button
                                                onClick={onClose}
                                                className="flex-2 py-4 bg-[#DEB587] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#DEB587]/20 hover:scale-[1.02] transition-all"
                                            >
                                                FECHAR
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
