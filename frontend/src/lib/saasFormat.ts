// Helpers de formatação compartilhados na área SaaS.

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatBRL = (value?: number | null): string => BRL.format(Number(value || 0));

// Formata CNPJ bruto para XX.XXX.XXX/XXXX-XX. Aceita entrada já formatada.
export function formatCNPJ(raw?: string | null): string {
    if (!raw) return '—';
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length !== 14) return raw;
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function daysSince(date?: string | Date | null): number {
    if (!date) return 0;
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = Date.now() - d.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
