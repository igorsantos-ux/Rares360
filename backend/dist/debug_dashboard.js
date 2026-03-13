import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function debugDashboard() {
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) {
        console.log('Nenhuma clínica encontrada.');
        return;
    }
    const clinicId = clinic.id;
    console.log(`Debugando Clínica: ${clinic.name} (${clinicId})`);
    const today = new Date();
    const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const unpaid = await prisma.accountPayableInstallment.aggregate({
        where: {
            accountPayable: { clinicId },
            status: { not: 'PAGO' }
        },
        _sum: { amount: true }
    });
    const monthExpenses = await prisma.accountPayableInstallment.aggregate({
        where: {
            accountPayable: { clinicId },
            dueDate: {
                gte: firstDayMonth,
                lte: lastDayMonth
            }
        },
        _sum: { amount: true }
    });
    const totalCount = await prisma.accountPayableInstallment.count({
        where: { accountPayable: { clinicId } }
    });
    console.log('Dashboard Data:', {
        totalInstallments: totalCount,
        unpaidAmount: unpaid._sum.amount,
        monthExpensesAmount: monthExpenses._sum.amount,
        period: { firstDayMonth, lastDayMonth }
    });
    await prisma.$disconnect();
}
debugDashboard();
