// Secure Logger - Data Masking automatico em logs
// Substitui dados sensiveis por versoes mascaradas antes de gravar logs.
// Em producao, TODOS os console.log/warn/error passam por este filtro.
//
// Padroes mascarados: CPF, CNPJ, Email, Telefone, Valores monetarios, JWT tokens
// Regex patterns para dados sensíveis
const PATTERNS = [
    // CPF: 123.456.789-00 ou 12345678900
    {
        regex: /(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/g,
        replacer: (match, g1) => `${g1}.***.***-**`,
    },
    {
        regex: /\b(\d{3})(\d{3})(\d{3})(\d{2})\b/g,
        replacer: (match, g1) => `${g1}*******`,
    },
    // CNPJ: 54.617.730/0001-65
    {
        regex: /(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})/g,
        replacer: (match, g1) => `${g1}.***.***/****-**`,
    },
    // E-mail: primeiros 2 chars + *** + @domínio
    {
        regex: /([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        replacer: (match, g1, g2) => `${g1}***@${g2}`,
    },
    // Telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    {
        regex: /\((\d{2})\)\s*(\d)(\d{3,4})-(\d{4})/g,
        replacer: (match, g1, g2) => `(${g1}) ${g2}****-****`,
    },
    // Valores financeiros em contexto de log: R$ XXX.XXX,XX
    {
        regex: /R\$\s*[\d.,]+/g,
        replacer: () => 'R$ [REDACTED]',
    },
    // Tokens JWT (não devem aparecer em logs)
    {
        regex: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
        replacer: () => '[JWT_TOKEN_REDACTED]',
    },
    // Strings que parecem ser chaves/secrets
    {
        regex: /(password|secret|token|apikey|api_key|authorization)["']?\s*[:=]\s*["']?([^\s"',}{]+)/gi,
        replacer: (match, key) => `${key}: [REDACTED]`,
    },
];
/**
 * Mascara dados sensíveis em uma string
 */
export function maskSensitiveData(input) {
    if (!input || typeof input !== 'string')
        return input;
    let masked = input;
    for (const pattern of PATTERNS) {
        masked = masked.replace(pattern.regex, pattern.replacer);
    }
    return masked;
}
/**
 * Mascara dados sensíveis em qualquer tipo de argumento
 */
function maskArgs(args) {
    return args.map(arg => {
        if (typeof arg === 'string') {
            return maskSensitiveData(arg);
        }
        if (arg instanceof Error) {
            const maskedError = new Error(maskSensitiveData(arg.message));
            maskedError.stack = arg.stack ? maskSensitiveData(arg.stack) : undefined;
            return maskedError;
        }
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.parse(maskSensitiveData(JSON.stringify(arg)));
            }
            catch {
                return arg;
            }
        }
        return arg;
    });
}
/**
 * Logger seguro com data masking automático
 */
export const secureLogger = {
    log: (...args) => console.log(...maskArgs(args)),
    info: (...args) => console.info(...maskArgs(args)),
    warn: (...args) => console.warn(...maskArgs(args)),
    error: (...args) => console.error(...maskArgs(args)),
    debug: (...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(...maskArgs(args));
        }
    },
};
/**
 * Instala o secure logger como substituto global do console em produção.
 * Chame esta função uma vez no início do servidor.
 */
export function installSecureLogger() {
    if (process.env.NODE_ENV === 'production') {
        const originalConsole = { ...console };
        console.log = (...args) => originalConsole.log(...maskArgs(args));
        console.info = (...args) => originalConsole.info(...maskArgs(args));
        console.warn = (...args) => originalConsole.warn(...maskArgs(args));
        console.error = (...args) => originalConsole.error(...maskArgs(args));
        console.debug = () => { }; // Desabilitar debug em produção
        originalConsole.log('[SECURITY] Secure logger instalado — dados sensíveis serão mascarados nos logs.');
    }
}
export default secureLogger;
