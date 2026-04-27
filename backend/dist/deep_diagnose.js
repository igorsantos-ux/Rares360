import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function deepDiagnose() {
    console.log('--- DIAGNÓSTICO PROFUNDO ---');
    // 1. Total de registros
    const total = await prisma.accountPayable.count();
    console.log(`Total Geral em AccountPayable: ${total}`);
    // 2. Registros por Clínica
    const byClinic = await prisma.accountPayable.groupBy({
        by: ['clinicId'],
        _count: { id: true }
    });
    console.log('\nRegistros por Clínica ID:');
    byClinic.forEach(c => console.log(`- Clinic ${c.clinicId}: ${c._count.id}`));
    // 3. Amostra de datas
    if (total > 0) {
        const sample = await prisma.accountPayable.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { description: true, dueDate: true, clinicId: true, totalAmount: true }
        });
        console.log('\nÚltimos 10 registros criados:');
        sample.forEach(s => console.log(`- ${s.description} | Venc: ${s.dueDate} | Clinic: ${s.clinicId} | Valor: ${s.totalAmount}`));
    }
    // 4. Verificar Lotes
    const batches = await prisma.importBatch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('\nÚltimos 5 Lotes:');
    batches.forEach(b => console.log(`- ID: ${b.id} | Module: ${b.module} | Count: ${b.recordCount} | Clinic: ${b.clinicId}`));
    await prisma.$disconnect();
}
deepDiagnose();
