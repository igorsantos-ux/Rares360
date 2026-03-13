import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('--- Verificando registros específicos da screenshot ---');
    const items = await prisma.accountPayableInstallment.findMany({
        include: { accountPayable: true },
        where: {
            accountPayable: {
                description: { in: ['Boleto Alamino', 'Salario', 'Energia'] }
            }
        }
    });
    items.forEach(inst => {
        console.log(`Desc: ${inst.accountPayable.description}`);
        console.log(`Status: ${inst.status}`);
        console.log(`fileUrl: ${inst.accountPayable.fileUrl}`);
        console.log('---');
    });
}
main().finally(() => prisma.$disconnect());
