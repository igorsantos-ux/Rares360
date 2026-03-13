import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('--- Verificando registros com fileUrl ---');
    const hasFile = await prisma.accountPayable.findMany({
        where: { fileUrl: { not: null, not: '' } },
        select: { id: true, description: true, fileUrl: true }
    });
    console.log(`Total de contas com anexo: ${hasFile.length}`);
    hasFile.forEach(acc => {
        console.log(`- [${acc.id}] ${acc.description}: ${acc.fileUrl}`);
    });
    const installments = await prisma.accountPayableInstallment.findMany({
        include: { accountPayable: true },
        take: 5
    });
    console.log('\n--- Exemplo de Mapeamento de Parcela ---');
    installments.forEach(inst => {
        console.log(`Parcela ID: ${inst.id}`);
        console.log(`Status: ${inst.status}`);
        console.log(`Account fileUrl: ${inst.accountPayable?.fileUrl}`);
        console.log('---');
    });
}
main().finally(() => prisma.$disconnect());
