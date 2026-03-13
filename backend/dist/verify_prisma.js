import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('--- Verificando Campos do Modelo AccountPayable ---');
    try {
        // @ts-ignore
        const fields = Object.keys(prisma.accountPayable.fields || {});
        console.log('Campos detectados no Prisma Client:', fields);
        if (fields.includes('costCenter')) {
            console.log('✅ Campo costCenter está presente no cliente.');
        }
        else {
            console.log('❌ Campo costCenter NÃO está presente no cliente.');
        }
    }
    catch (e) {
        console.log('Erro ao inspecionar campos:', e.message);
    }
}
main().finally(() => prisma.$disconnect());
