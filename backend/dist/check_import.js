import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkImport() {
    const txCount = await prisma.transaction.count();
    const latestTxs = await prisma.transaction.findMany({
        take: 10,
        orderBy: { date: 'desc' }
    });
    console.log('--- DIAGNÓSTICO DE IMPORTAÇÃO ---');
    console.log(`Total de transações no banco: ${txCount}`);
    if (latestTxs.length > 0) {
        console.log('Últimas 10 transações inseridas (mais recentes por data):');
        latestTxs.forEach(tx => {
            console.log(`- Data: ${tx.date.toISOString()} | Desc: ${tx.description} | Valor: ${tx.amount} | ClinicId: ${tx.clinicId}`);
        });
    }
    else {
        console.log('Nenhuma transação encontrada.');
    }
    const batches = await prisma.importBatch.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
    });
    console.log('\nÚltimos 3 Lotes de Importação:');
    batches.forEach(b => {
        console.log(`- Batch: ${b.fileName} | Registros: ${b.recordCount} | Data: ${b.createdAt.toISOString()}`);
    });
}
checkImport()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
