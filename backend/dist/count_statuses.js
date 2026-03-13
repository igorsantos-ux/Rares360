import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const counts = await prisma.accountPayableInstallment.groupBy({
        by: ['status'],
        _count: { _all: true }
    });
    console.log('--- Contagem de Status no DB ---');
    console.log(JSON.stringify(counts, null, 2));
}
main().finally(() => prisma.$disconnect());
