import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkEnum() {
    try {
        // Consultar o tipo enum diretamente no PostgreSQL
        const result = await prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'ImportModule'`;
        console.log('Valores do enum ImportModule no DB:', result);
    } catch (e) {
        console.error('Erro ao consultar enum:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkEnum();
