import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { maskSensitiveDoc } from '../../lib/maskUtils';
import { coreApi } from '../../services/api';
import toast from 'react-hot-toast';

interface SensitiveFieldProps {
    value: string | null | undefined;
    entity: string;
    entityId: string;
    targetField: string;
    className?: string;
}

export function SensitiveField({ value, entity, entityId, targetField, className = '' }: SensitiveFieldProps) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!value) return <span className={`text-slate-400 ${className}`}>---</span>;

    const handleReveal = async () => {
        if (isRevealed) {
            setIsRevealed(false);
            return;
        }

        setIsLoading(true);
        try {
            // Requisição para logar auditoria de visualização sensível
            await coreApi.logSensitiveView({ entity, entityId, targetField });
            
            setIsRevealed(true);
            toast.success('Visualização registrada (Auditoria LGPD)', { duration: 2000 });
            
            // Auto hide depois de 10 segundos
            setTimeout(() => {
                setIsRevealed(false);
            }, 10000);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao verificar permissão de acesso.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="font-mono tracking-wide">
                {isRevealed ? value : maskSensitiveDoc(value)}
            </span>
            <button 
                onClick={handleReveal}
                disabled={isLoading}
                title="Acesso Protegido - Clique para revelar (Será auditado)"
                className="text-slate-400 hover:text-emerald-600 transition-colors bg-slate-100 hover:bg-emerald-50 rounded-md p-1 disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : isRevealed ? (
                    <EyeOff size={14} />
                ) : (
                    <Eye size={14} />
                )}
            </button>
        </div>
    );
}
