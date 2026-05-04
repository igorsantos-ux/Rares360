import { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../../components/ui/Dialog";
import { Button } from "../../../../components/ui/Button";
import { pricingApi } from '../../../../services/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingImportModal = ({ isOpen, onClose }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      const response = await pricingApi.importPrices(file);
      setResult(response.data);
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast.success('Importação processada!');
    } catch (error) {
      toast.error('Erro ao enviar arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Tabela de Preços</DialogTitle>
          <DialogDescription>
            Envie uma planilha Excel (.xlsx) com as colunas <strong>PROCEDIMENTO</strong> e <strong>PRECO_VENDA</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {!result ? (
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${
                file ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="pricing-upload"
              />
              <label htmlFor="pricing-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                  {file ? <FileSpreadsheet className="w-6 h-6 text-blue-600" /> : <Upload className="w-6 h-6 text-slate-400" />}
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {file ? file.name : 'Clique para selecionar arquivo'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Excel (.xlsx) até 5MB</p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <Check className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">{result.imported} preços atualizados</p>
                  <p className="text-xs text-emerald-700">O sistema mapeou os nomes automaticamente.</p>
                </div>
              </div>

              {result.notFound.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-bold text-amber-900">{result.notFound.length} não encontrados</p>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {result.notFound.map((name: string, i: number) => (
                      <p key={i} className="text-[10px] text-amber-700 font-mono">• {name}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <div className="flex w-full gap-3">
              <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Processar
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={reset}>Concluir</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
