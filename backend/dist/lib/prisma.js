import { PrismaClient } from '@prisma/client';
import { extendPrisma } from './prisma-multi-tenant.js';
const basePrisma = new PrismaClient();
const prisma = extendPrisma(basePrisma);
export const getPrismaClient = () => prisma;
export default prisma;
