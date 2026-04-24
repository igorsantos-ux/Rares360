import React from 'react';

// Rótulos e paleta por plano comercial (cinza / azul / dourado).
// Cores exatas do spec — não alterar sem alinhamento de design.
const PLAN_STYLES: Record<string, { bg: string; text: string }> = {
    Essencial:    { bg: '#D3D1C7', text: '#5F5E5A' },
    Profissional: { bg: '#B5D4F4', text: '#185FA5' },
    Excellence:   { bg: '#FAC775', text: '#854F0B' },
};

interface PlanBadgeProps {
    plan?: string | null;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan }) => {
    const value = plan && PLAN_STYLES[plan] ? plan : 'Essencial';
    const { bg, text } = PLAN_STYLES[value];

    return (
        <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold tracking-wide"
            style={{ backgroundColor: bg, color: text }}
        >
            {value}
        </span>
    );
};
