import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findThe600Rows() {
    console.log('--- BUSCANDO AS 600 LINHAS PERDIDAS ---');

    const tables = [
        'AccountPayable',
        'AccountPayableInstallment',
        'ImportBatch',
        'ImportErrorLog',
        'Transaction',
        'Patient'
    ];

    for (const table of tables) {
        try {
            const count = await (prisma as any)[table].count();
            console.log(`- ${table}: ${count} registros`);
        } catch (e) {
            // console.log(`- ${table}: Não encontrada ou erro`);
        }
    }

    // Tentar buscar por query raw se há algum ImportBatch com ID cmux...
    try {
        const batchQuery = await prisma.$queryRaw`SELECT id, "clinicId", "recordCount" FROM "ImportBatch" WHERE id LIKE 'cm%'`;
        console.log('\nBusca Raw por IDs CUID:', batchQuery);
    } catch (e) { }

    await prisma.$disconnect();
}

findThe600Rows();
