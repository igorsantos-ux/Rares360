import { PrismaClient } from '@prisma/client';
import { extendPrismaEncryption } from './prisma-encryption.js';
import { extendPrisma } from './prisma-multi-tenant.js';
import { auditExtension } from './auditExtension.js';
import { installSecureLogger } from './secureLogger.js';

// Instalar secure logger em produção (mascarar dados sensíveis nos logs)
installSecureLogger();

// Cadeia de extensões: Base → Encryption → Tenant Isolation → Audit
export const basePrisma = new PrismaClient();
const prismaWithEncryption = extendPrismaEncryption(basePrisma);
const prismaWithTenant = extendPrisma(prismaWithEncryption as any);
const prisma = auditExtension(prismaWithTenant as any);

export const getPrismaClient = () => prisma;

export default prisma;
