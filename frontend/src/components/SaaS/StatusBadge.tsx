import React from 'react';

// Badge de status operacional da clínica (ATIVO / TRIAL / INATIVO).
// Inclui ponto colorido antes do texto conforme spec.
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    ATIVO:   { bg: '#EAF3DE', text: '#3B6D11', dot: '#3B6D11', label: 'Ativo' },
    TRIAL:   { bg: '#FAEEDA', text: '#854F0B', dot: '#854F0B', label: 'Trial' },
    INATIVO: { bg: '#FCEBEB', text: '#A32D2D', dot: '#A32D2D', label: 'Inativo' },
};

interface StatusBadgeProps {
    status?: string | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const key = status && STATUS_STYLES[status] ? status : 'TRIAL';
    const { bg, text, dot, label } = STATUS_STYLES[key];

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold tracking-wide"
            style={{ backgroundColor: bg, color: text }}
        >
            <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: dot }}
            />
            {label}
        </span>
    );
};
