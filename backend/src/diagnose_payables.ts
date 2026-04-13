import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- DIAGNÓSTICO DE IMPORTAÇÃO (CONTAS A PAGAR) ---');

    // 1. Verificar Lotes
    const batches = await prisma.importBatch.findMany({
        where: { module: 'CONTAS_A_PAGAR' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log(`\nÚltimos ${batches.length} lotes encontrados:`);
    for (const b of batches) {
        console.log(`- Id: ${b.id} | Arquivo: ${b.fileName} | Sucessos: ${b.recordCount} | Data: ${b.createdAt}`);

        // Ver erros do lote
        const errors = await prisma.importErrorLog.findMany({
            where: { importBatchId: b.id },
            take: 3
        });
        if (errors.length > 0) {
            console.log(`  [!] Erros encontrados (${errors.length} primeiros):`);
            errors.forEach(e => console.log(`      Linha ${e.rowNumber}: ${e.errorMessage}`));
        } else {
            console.log(`  [✓] Nenhum erro registrado para este lote.`);
        }
    }

    // 2. Verificar Contas Criadas
    const count = await prisma.accountPayable.count();
    console.log(`\nTotal de registros em AccountPayable: ${count}`);

    if (count > 0) {
        const sample = await prisma.accountPayable.findMany({
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
                description: true,
                dueDate: true,
                totalAmount: true,
                status: true,
                clinicId: true
            }
        });
        console.log('Amostra dos últimos 3 registros:');
        sample.forEach(s => console.log(`- ${s.description} | Venc: ${s.dueDate} | Valor: ${s.totalAmount} | Status: ${s.status} | ClinicId: ${s.clinicId}`));
    }

    // 3. Verificar Clínica Roberta Alumino (se possível)
    const clinics = await prisma.clinic.findMany({
        select: { id: true, name: true, cnpj: true }
    });
    console.log('\nClínicas cadastradas:');
    clinics.forEach(c => console.log(`- ${c.name} (CNPJ: ${c.cnpj}) | ID: ${c.id}`));

    await prisma.$disconnect();
}

diagnose();
