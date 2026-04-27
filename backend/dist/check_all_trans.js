import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkAllTransactions() {
    console.log('--- VERIFICANDO TODAS AS TRANSAÇÕES ---');
    const clinicId = 'bc78fc97-20d2-412a-a4c3-f9ea0c5eb04a';
    const total = await prisma.transaction.count();
    console.log(`Total de Transações no BANCO INTEIRO: ${total}`);
    const byClinic = await prisma.transaction.groupBy({
        by: ['clinicId'],
        _count: { id: true }
    });
    console.log('\nPor Clínica:');
    byClinic.forEach(c => console.log(`- ${c.clinicId}: ${c._count.id}`));
    if (total > 0) {
        const lastOnes = await prisma.transaction.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        console.log('\nÚltimas 10 inseridas:');
        lastOnes.forEach(t => console.log(`- ${t.description} | ${t.clinicId} | ${t.type} | ${t.status}`));
    }
    await prisma.$disconnect();
}
checkAllTransactions();
