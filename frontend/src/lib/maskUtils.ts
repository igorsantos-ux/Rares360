export function maskSensitiveDoc(doc: string | undefined | null): string {
    if (!doc) return '---';

    // Se assemelhar a CPF 000.000.000-00
    const numbersOnly = doc.replace(/\D/g, '');
    
    if (numbersOnly.length === 11) {
        return `***.${numbersOnly.slice(3, 6)}.***-**`;
    }

    if (numbersOnly.length === 14) { // CNPJ
        return `**.***.${numbersOnly.slice(5, 8)}/0001-**`;
    }
    
    // Fallback genérico para telefone, RG, etc.
    if (doc.length > 5) {
        return `***${doc.slice(3, -2)}**`;
    }

    return '***';
}
