import { PrismaClient } from '@prisma/client';
import { extendPrisma } from './prisma-multi-tenant.js';

const prisma = new PrismaClient();

/**
 * Retorna uma instância do Prisma estendida com o isolamento de clínica.
 * Se nenhum clinicId for fornecido, retorna a instância padrão.
 */
export const getPrismaClient = (clinicId?: string) => {
    return extendPrisma(prisma, clinicId);
};

export default prisma;
