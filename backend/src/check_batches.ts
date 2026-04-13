import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllBatches() {
    console.log('--- BUSCANDO TODOS OS LOTES NO BANCO ---');
    const allBatches = await prisma.importBatch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log(`Lotes totais: ${allBatches.length}`);
    allBatches.forEach(b => {
        console.log(`- [${b.module}] ${b.fileName} | Sucessos: ${b.recordCount} | Data: ${b.createdAt} | ID: ${b.id}`);
    });

    const clinics = await prisma.clinic.findMany();
    console.log('\nClínicas e CNPJs:');
    clinics.forEach(c => console.log(`- ${c.name}: ${c.cnpj}`));

    await prisma.$disconnect();
}

checkAllBatches();
