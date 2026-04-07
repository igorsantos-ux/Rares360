import { PrismaClient } from '@prisma/client';
import { extendPrisma } from './prisma-multi-tenant.js';
export const basePrisma = new PrismaClient();
const prisma = extendPrisma(basePrisma);
export const getPrismaClient = () => prisma;
export default prisma;
