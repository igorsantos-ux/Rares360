import prisma from './lib/prisma.js';
async function finalInvestigate() {
    const incBeautyId = 'bc78fc97-20d2-412a-a4c3-f9ea0c5eb04a';
    console.log('--- INVESTIGAÇÃO FINAL INC BEAUTY ---');
    const transactions = await prisma.transaction.findMany({
        where: { clinicId: incBeautyId },
        take: 10
    });
    console.log(`Total de transações na INC BEAUTY: ${await prisma.transaction.count({ where: { clinicId: incBeautyId } })}`);
    transactions.forEach(t => {
        console.log(`Tipo: ${t.type} | Valor: ${t.amount} | Data: ${t.date}`);
    });
    const allIncomes = await prisma.transaction.findMany({
        where: { type: 'INCOME' }
    });
    console.log(`Total de INCOME em todo o banco: ${allIncomes.length}`);
}
finalInvestigate();
