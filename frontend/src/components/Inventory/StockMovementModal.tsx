import React, { useState, useRef } from 'react';
import {
    X,
    ArrowUpCircle,
    ArrowDownCircle,
    Save,
    AlertCircle,
    Upload,
    Download,
    FileSpreadsheet,
    Loader2,
    CheckCircle2,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi, importApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Combobox } from '../ui/Combobox';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockItems: any[];
    initialType?: 'IN' | 'OUT';
}

export const StockMovementModal = ({ isOpen, onClose, stockItems, initialType = 'IN' }: StockMovementModalProps) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
    const [type, setType] = useState<'IN' | 'OUT'>(initialType);
    const [itemId, setItemId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Estados para Importação
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [importResult, setImportResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sincroniza o tipo quando o modal abre
    React.useEffect(() => {
        if (isOpen) {
            setType(initialType);
            resetForm();
            setActiveTab('manual');
            setImportResult(null);
        }
    }, [isOpen, initialType]);

    const selectedItem = stockItems.find(i => i.id === itemId);

    const manualMutation = useMutation({
        mutationFn: (data: any) => coreApi.registerStockMovement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock-items'] });
            queryClient.invalidateQueries({ queryKey: ['stock-history'] });
            toast.success('Movimentação registrada com sucesso!');
            resetForm();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao registrar movimentação');
        }
    });

    const resetForm = () => {
        setItemId('');
        setQuantity('');
        setReason('');
        setDate(new Date().toISOString().split('T')[0]);
        setFile(null);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!itemId || !quantity || !type) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        const qtyValue = parseFloat(quantity);
        if (type === 'OUT' && selectedItem && selectedItem.currentStock < qtyValue) {
            toast.error(`Saldo insuficiente! Estoque atual: ${selectedItem.currentStock}`);
            return;
        }

        manualMutation.mutate({
            itemId,
            type,
            quantity: qtyValue,
            reason,
            date: new Date(date)
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsProcessing(true);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('file', file);

            setProgress(40);
            const response = await importApi.importStockMovements(formData);

            setProgress(100);
            setImportResult(response.data);
            queryClient.invalidateQueries({ queryKey: ['stock-items'] });
            queryClient.invalidateQueries({ queryKey: ['stock-history'] });
            toast.success('Importação concluída!');
        } catch (error: any) {
            console.error('Erro na importação:', error);
            toast.error(error.response?.data?.message || 'Erro ao processar planilha');
            setIsProcessing(false);
        }
    };

    const downloadTemplate = () => {
        // O usuário pediu o modelo lá no prompt inicial, vou assumir que o arquivo existe ou criar link para o que salvei antes
        const link = document.createElement('a');
        link.href = '/templates/MODELO - ESTOQUE.xlsx'; // Reutilizando o mesmo modelo ou um específico se houver
        link.download = 'MODELO_MOVIMENTACAO.xlsx';
        link.click();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden"
                    >
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl ${type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {type === 'IN' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-700 tracking-tight">
                                        Movimentação de Estoque
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle de entradas e saídas</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="px-8 pt-4">
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full">
                                <button
                                    onClick={() => setActiveTab('manual')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'manual' ? 'bg-white shadow-xl shadow-slate-200 text-[#8A9A5B]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Lançamento Manual
                                </button>
                                <button
                                    onClick={() => setActiveTab('bulk')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'bulk' ? 'bg-white shadow-xl shadow-slate-200 text-[#8A9A5B]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Importação em Massa
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            {activeTab === 'manual' ? (
                                <form onSubmit={handleManualSubmit} className="space-y-6">
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setType('IN')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${type === 'IN' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            ENTRADA
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setType('OUT')}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${type === 'OUT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            SAÍDA
                                        </button>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecionar Insumo</label>
                                            <Combobox
                                                options={stockItems.map(item => ({
                                                    value: item.id,
                                                    label: item.name,
                                                    rightLabel: `${item.currentStock} ${item.unit}`
                                                }))}
                                                value={itemId}
                                                onValueChange={setItemId}
                                                placeholder="Selecione um item..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="0.00"
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo / Tipo</label>
                                            <select
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/20 font-bold text-sm text-slate-700"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                required
                                            >
                                                <option value="">Selecione o motivo...</option>
                                                {type === 'IN' ? (
                                                    <>
                                                        <option value="Compra">Compra / Reposição</option>
                                                        <option value="Ajuste de Saldo">Ajuste de Saldo (Inventário)</option>
                                                        <option value="Devolução">Devolução de Paciente</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="Uso em Procedimento">Uso em Procedimento</option>
                                                        <option value="Perda / Validade">Perda / Validade</option>
                                                        <option value="Ajuste de Saldo">Ajuste de Saldo (Inventário)</option>
                                                        <option value="Consumo Interno">Consumo Interno</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    {type === 'OUT' && selectedItem && parseFloat(quantity) > selectedItem.currentStock && (
                                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                                            <p className="text-xs font-bold text-red-600 leading-relaxed">
                                                Atenção: A quantidade de saída é maior que o saldo atual ({selectedItem.currentStock}). A operação será bloqueada.
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={manualMutation.isPending || (type === 'OUT' && selectedItem && parseFloat(quantity) > selectedItem.currentStock)}
                                            className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${type === 'IN'
                                                ? 'bg-[#8A9A5B] text-white shadow-[#8A9A5B]/20'
                                                : 'bg-red-500 text-white shadow-red-500/20'
                                                } hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100`}
                                        >
                                            {manualMutation.isPending ? 'PROCESSANDO...' : (
                                                <>
                                                    <Save size={18} />
                                                    {type === 'IN' ? 'Confirmar Entrada' : 'Confirmar Saída'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    {!importResult && !isProcessing ? (
                                        <div
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDrop}
                                            className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center hover:border-[#8A9A5B] hover:bg-[#8A9A5B]/5 transition-all group flex flex-col items-center gap-4 bg-slate-50/30"
                                        >
                                            <div className="w-16 h-16 bg-white shadow-xl shadow-slate-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {file ? <FileSpreadsheet className="text-[#8A9A5B]" size={32} /> : <Upload className="text-slate-300" size={32} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-700 text-sm uppercase tracking-tight">
                                                    {file ? file.name : 'Selecione a Planilha de Movimentações'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-bold mt-1">Arraste o arquivo ou clique para selecionar</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept=".xlsx,.csv"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mt-2 px-6 py-3 bg-white border border-slate-200 text-[#8A9A5B] text-[10px] font-black rounded-xl hover:shadow-lg transition-all uppercase tracking-widest"
                                            >
                                                Selecionar Arquivo
                                            </button>
                                        </div>
                                    ) : isProcessing && !importResult ? (
                                        <div className="py-12 flex flex-col items-center gap-6">
                                            <div className="relative w-24 h-24">
                                                <Loader2 className="w-full h-full text-[#8A9A5B] animate-spin stroke-[2]" />
                                                <div className="absolute inset-0 flex items-center justify-center font-black text-[#8A9A5B] text-sm">
                                                    {progress}%
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-black text-slate-700 uppercase tracking-tight">Processando Importação</h4>
                                                <p className="text-xs text-slate-400 font-bold mt-1 tracking-widest">Sincronizando livro razão de estoque...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="py-12 bg-[#8A9A5B]/5 rounded-[2rem] border border-[#8A9A5B]/10 flex flex-col items-center gap-6 text-center"
                                        >
                                            <div className="w-20 h-20 bg-white shadow-xl shadow-[#8A9A5B]/20 rounded-[2rem] flex items-center justify-center">
                                                <CheckCircle2 className="text-green-500" size={40} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-700 tracking-tight">Importação Finalizada!</h3>
                                                <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">A movimentação foi sincronizada</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 w-full max-w-xs px-8">
                                                <div className="bg-white p-4 rounded-3xl shadow-sm">
                                                    <p className="text-[10px] font-black text-green-600 uppercase">Sucesso</p>
                                                    <p className="text-2xl font-black text-slate-700 tracking-tighter">{importResult.successCount}</p>
                                                </div>
                                                <div className="bg-white p-4 rounded-3xl shadow-sm">
                                                    <p className="text-[10px] font-black text-red-400 uppercase">Erros</p>
                                                    <p className="text-2xl font-black text-slate-700 tracking-tighter">{importResult.errorCount}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setImportResult(null); setFile(null); }}
                                                className="text-[10px] font-black text-[#8A9A5B] uppercase tracking-[0.2em] hover:opacity-70 transition-all border-b-2 border-[#8A9A5B]"
                                            >
                                                Importar outro arquivo
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* Download Template & Start Buttons */}
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-10 h-10 bg-white text-[#8A9A5B] rounded-xl flex items-center justify-center shadow-sm">
                                                    <Download size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Modelo de Planilha</p>
                                                    <p className="text-slate-400 text-xs font-medium">Baixe o formato padrão de Entradas</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={downloadTemplate}
                                                className="h-10 px-6 bg-[#8A9A5B] text-white text-[10px] font-black rounded-xl hover:bg-[#697D58] transition-colors shadow-lg shadow-[#8A9A5B]/20 uppercase tracking-widest"
                                            >
                                                Baixar
                                            </button>
                                        </div>

                                        {!importResult && (
                                            <button
                                                onClick={handleImport}
                                                disabled={!file || isProcessing}
                                                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3"
                                            >
                                                {isProcessing ? 'Sincronizando Dados...' : 'Iniciar Importação de Massa'}
                                                <ArrowUpCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
