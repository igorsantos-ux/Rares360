import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    console.log('🔍 Buscando logs de erro da última importação...');

    const lastBatch = await prisma.importBatch.findFirst({
        where: { module: 'ESTOQUE' },
        orderBy: { createdAt: 'desc' },
        include: {
            errors: {
                take: 5
            }
        }
    });

    if (!lastBatch) {
        console.log('❌ Nenhum lote de importação de estoque encontrado.');
        return;
    }

    console.log(`\n📊 Lote ID: ${lastBatch.id}`);
    console.log(`📅 Data: ${lastBatch.createdAt}`);
    console.log(`❌ Erros encontrados: ${lastBatch.errorCount}`);

    console.log('\n🚫 Amostra de erros:');
    lastBatch.errors.forEach((err, idx) => {
        console.log(`[${idx + 1}] Linha ${err.rowNumber}: ${err.errorMessage}`);
        console.log(`   Dados: ${err.rowData}\n`);
    });

    process.exit(0);
}

diagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
