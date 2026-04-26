/**
 * Criptografia de campos sensíveis — AES-256-GCM
 * 
 * Formato: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 * 
 * Requer ENCRYPTION_KEY no .env (32 bytes = 64 hex chars)
 * Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const PREFIX = 'enc:v1:';

// Carregar chave de criptografia
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY;
let encryptionKey: Buffer | null = null;

if (ENCRYPTION_KEY_HEX) {
    if (ENCRYPTION_KEY_HEX.length !== 64) {
        console.error('FATAL: ENCRYPTION_KEY deve ter exatamente 64 caracteres hexadecimais (32 bytes).');
        process.exit(1);
    }
    encryptionKey = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
} else {
    console.warn('[SECURITY] ENCRYPTION_KEY não configurada. Campos sensíveis NÃO serão criptografados.');
}

/**
 * Verifica se a criptografia está habilitada
 */
export function isEncryptionEnabled(): boolean {
    return encryptionKey !== null;
}

/**
 * Criptografa um valor de texto plano usando AES-256-GCM
 */
export function encrypt(plaintext: string): string {
    if (!encryptionKey || !plaintext) return plaintext;

    // Se já está criptografado, retornar como está
    if (plaintext.startsWith(PREFIX)) return plaintext;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv, { authTagLength: TAG_LENGTH });

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag().toString('hex');

        return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('[ENCRYPTION] Erro ao criptografar:', (error as Error).message);
        return plaintext; // Fail-open para não quebrar o sistema
    }
}

/**
 * Descriptografa um valor criptografado
 */
export function decrypt(ciphertext: string): string {
    if (!encryptionKey || !ciphertext) return ciphertext;

    // Se não está criptografado, retornar como está
    if (!ciphertext.startsWith(PREFIX)) return ciphertext;

    try {
        const payload = ciphertext.slice(PREFIX.length);
        const parts = payload.split(':');

        if (parts.length !== 3) {
            console.error('[ENCRYPTION] Formato inválido de dados criptografados');
            return ciphertext;
        }

        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv, { authTagLength: TAG_LENGTH });
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('[ENCRYPTION] Erro ao descriptografar:', (error as Error).message);
        return '[ERRO: Não foi possível descriptografar]';
    }
}

/**
 * Criptografa múltiplos campos de um objeto
 */
export function encryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
    if (!encryptionKey || !obj) return obj;

    const result = { ...obj };
    for (const field of fields) {
        if (result[field] && typeof result[field] === 'string') {
            (result as any)[field] = encrypt(result[field]);
        }
    }
    return result;
}

/**
 * Descriptografa múltiplos campos de um objeto
 */
export function decryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
    if (!encryptionKey || !obj) return obj;

    const result = { ...obj };
    for (const field of fields) {
        if (result[field] && typeof result[field] === 'string') {
            (result as any)[field] = decrypt(result[field]);
        }
    }
    return result;
}
