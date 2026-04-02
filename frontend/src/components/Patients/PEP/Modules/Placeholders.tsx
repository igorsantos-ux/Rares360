const PlaceholderModule = ({ title, icon: Icon }: any) => (
    <div className="p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-[#F5F5DC] rounded-[2rem] flex items-center justify-center text-[#8A9A5B] shadow-inner shadow-[#8A9A5B]/10">
            <Icon size={48} strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#697D58]">{title}</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-sm">Este módulo está em fase de implementação final para garantir o máximo padrão de segurança e UX clínica.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
            <div className="h-20 bg-slate-50 border border-[#8A9A5B]/5 rounded-2xl animate-pulse" />
            <div className="h-20 bg-slate-50 border border-[#8A9A5B]/5 rounded-2xl animate-pulse" />
            <div className="h-20 bg-slate-50 border border-[#8A9A5B]/5 rounded-2xl animate-pulse" />
            <div className="h-20 bg-slate-50 border border-[#8A9A5B]/5 rounded-2xl animate-pulse" />
        </div>
    </div>
);

import { UserCheck, FileSignature, PackageSearch, History, WalletCards, Files } from 'lucide-react';

export const MainDataModule = ({ patient: _patient }: { patient: any }) => <PlaceholderModule title="Dados Cadastrais" icon={UserCheck} />;
export const PrescriptionModule = ({ patient: _patient }: { patient: any }) => <PlaceholderModule title="Receituário Digital" icon={FileSignature} />;
export const InventoryModule = ({ patient: _patient }: { patient: any }) => <PlaceholderModule title="Estoque & Insumos" icon={PackageSearch} />;
export const HistoryModule = ({ patient: _patient }: { patient: any }) => <PlaceholderModule title="Histórico de Consultas" icon={History} />;
export const FinancialModule = ({ patient: _patient }: { patient: any }) => <PlaceholderModule title="Propostas & Orçamentos" icon={WalletCards} />;
export const DocumentsModule = ({ patient: _patient }: { patient: any }) => <PlaceholderModule title="Documentos & Exames" icon={Files} />;
