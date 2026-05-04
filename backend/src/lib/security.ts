/**
 * SEC-011: Strip Sensitive Fields
 * Remove campos sensíveis de objetos de resposta antes de enviar ao cliente.
 */
export function stripSensitiveFields(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
        return data.map(stripSensitiveFields);
    }

    if (typeof data === 'object') {
        // Handle Date objects
        if (data instanceof Date) return data;

        const result: any = {};
        const sensitiveKeys = ['password', 'hash', 'temporaryPassword', 'token', 'refreshToken'];

        for (const [key, value] of Object.entries(data)) {
            if (!sensitiveKeys.includes(key)) {
                result[key] = stripSensitiveFields(value);
            }
        }
        return result;
    }

    return data;
}

/**
 * SEC-012: XSS Sanitizer Básico
 * Converte caracteres perigosos em suas entidades HTML correspondentes.
 */
export function sanitizeHtml(str: string): string {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
