import { PrismaClient } from '@prisma/client';
import { extendPrisma } from './prisma-multi-tenant.js';
import { auditExtension } from './auditExtension.js';

export const basePrisma = new PrismaClient();
const prismaWithTenant = extendPrisma(basePrisma);
const prisma = auditExtension(prismaWithTenant as any);

export const getPrismaClient = () => prisma;

export default prisma;
