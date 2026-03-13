import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('--- Normalizando Status (ING -> PT) ---');
    // PENDING -> PENDENTE
    const pendingCount = await prisma.accountPayableInstallment.updateMany({
        where: { status: 'PENDING' },
        data: { status: 'PENDENTE' }
    });
    console.log(`PENDING -> PENDENTE: ${pendingCount.count} registros`);
    // OVERDUE -> ATRASADO
    const overdueCount = await prisma.accountPayableInstallment.updateMany({
        where: { status: 'OVERDUE' },
        data: { status: 'PENDENTE' } // We use PENDENTE as base to let logic calculate if it is currently overdue
    });
    console.log(`OVERDUE -> PENDENTE: ${overdueCount.count} registros`);
    // PAGO (nothing to change, if any PAID exists)
    const paidCount = await prisma.accountPayableInstallment.updateMany({
        where: { status: 'PAID' },
        data: { status: 'PAGO' }
    });
    console.log(`PAID -> PAGO: ${paidCount.count} registros`);
    // Parent accounts too
    await prisma.accountPayable.updateMany({
        where: { status: 'PENDING' },
        data: { status: 'PENDENTE' }
    });
    await prisma.accountPayable.updateMany({
        where: { status: 'PAID' },
        data: { status: 'PAGO' }
    });
    console.log('--- Normalização Concluída ---');
}
main().finally(() => prisma.$disconnect());
