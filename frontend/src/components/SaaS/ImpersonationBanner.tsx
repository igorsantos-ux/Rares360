import React, { useEffect, useState } from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { exitImpersonation, isImpersonating, getImpersonatedClinicName } from '../../lib/impersonation';

// Banner amarelo fixo no topo quando o ADMIN_GLOBAL está operando dentro de
// uma clínica via impersonação. Monta-se globalmente em App.tsx.
// "Sair do modo admin" restaura o token do admin original e volta para /saas-dashboard.
export const ImpersonationBanner: React.FC = () => {
    const [active, setActive] = useState(false);
    const [clinicName, setClinicName] = useState<string | null>(null);

    useEffect(() => {
        setActive(isImpersonating());
        setClinicName(getImpersonatedClinicName());
    }, []);

    if (!active) return null;

    const handleExit = () => {
        if (exitImpersonation()) {
            // Full reload para limpar contextos (AuthContext busca /auth/me com o token restaurado)
            window.location.href = '/saas-dashboard';
        }
    };

    return (
        <div
            role="alert"
            className="sticky top-0 z-[200] w-full bg-[#FAC775] border-b border-[#854F0B]/30 text-[#5A3506] px-4 py-2 flex items-center justify-between gap-3 text-sm font-semibold"
        >
            <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert size={18} className="shrink-0" />
                <span className="truncate">
                    MODO ADMIN — Você está visualizando: <strong>{clinicName || 'Clínica'}</strong>
                </span>
            </div>
            <button
                type="button"
                onClick={handleExit}
                className="flex items-center gap-1.5 bg-[#854F0B] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-[#6b3f08] transition-colors"
            >
                <LogOut size={14} /> Sair do modo admin
            </button>
        </div>
    );
};
