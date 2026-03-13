import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const sum = await prisma.accountPayableInstallment.aggregate({
        where: { status: 'PENDENTE' },
        _sum: { amount: true }
    });
    console.log(`Soma PENDENTE: R$ ${sum._sum.amount}`);
}
main().finally(() => prisma.$disconnect());
