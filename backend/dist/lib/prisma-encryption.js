import { encryptFields, decryptFields, isEncryptionEnabled } from './encryption.js';
// Mapa de campos sensíveis por modelo Prisma
const SENSITIVE_FIELDS = {
    Patient: [
        'cpf',
        'rg',
        'email',
        'phone',
        'financialResponsibleCpf',
    ],
    Doctor: [
        'cpf',
        'email',
        'phone',
        'pixKey',
    ],
    Clinic: [
        'cnpj',
        'conta',
        'agencia',
        'chavePix',
        'telefone',
        'whatsapp',
    ],
    GlobalLead: [
        'email',
        'whatsapp',
    ],
};
// Operações de escrita (precisam criptografar)
const WRITE_OPERATIONS = ['create', 'update', 'upsert', 'createMany', 'updateMany'];
// Operações de leitura (precisam descriptografar)
const READ_OPERATIONS = ['findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow'];
/**
 * Criptografa campos sensíveis nos dados de entrada
 */
function encryptInputData(data, fields) {
    if (!data || typeof data !== 'object')
        return data;
    return encryptFields(data, fields);
}
/**
 * Descriptografa campos sensíveis nos dados de saída
 */
function decryptOutputData(data, fields) {
    if (!data)
        return data;
    if (Array.isArray(data)) {
        return data.map(item => decryptFields(item, fields));
    }
    return decryptFields(data, fields);
}
/**
 * Extensão Prisma para criptografia automática de campos sensíveis
 */
export const extendPrismaEncryption = (prisma) => {
    if (!isEncryptionEnabled()) {
        console.warn('[ENCRYPTION] Encryption disabled — campos sensíveis ficarão em texto plano.');
        return prisma;
    }
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const fields = SENSITIVE_FIELDS[model];
                    // Se o modelo não tem campos sensíveis, executar normalmente
                    if (!fields || fields.length === 0) {
                        return query(args);
                    }
                    // === ESCRITA: Criptografar dados antes de salvar ===
                    if (WRITE_OPERATIONS.includes(operation)) {
                        if (args.data) {
                            args.data = encryptInputData(args.data, fields);
                        }
                        // Para createMany com array
                        if (operation === 'createMany' && Array.isArray(args.data)) {
                            args.data = args.data.map((item) => encryptInputData(item, fields));
                        }
                        // Para upsert: criptografar tanto create quanto update
                        if (operation === 'upsert') {
                            if (args.create) {
                                args.create = encryptInputData(args.create, fields);
                            }
                            if (args.update) {
                                args.update = encryptInputData(args.update, fields);
                            }
                        }
                    }
                    // Executar a operação
                    const result = await query(args);
                    // === LEITURA: Descriptografar dados depois de ler ===
                    if (READ_OPERATIONS.includes(operation) && result) {
                        return decryptOutputData(result, fields);
                    }
                    // Para create/update que retornam o objeto, também descriptografar
                    if (['create', 'update', 'upsert'].includes(operation) && result) {
                        return decryptOutputData(result, fields);
                    }
                    return result;
                },
            },
        },
    });
};
