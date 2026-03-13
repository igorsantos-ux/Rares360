import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('--- Buscando conta "luz" especificamente ---');
    const items = await prisma.accountPayableInstallment.findMany({
        where: {
            accountPayable: {
                description: { contains: 'luz', mode: 'insensitive' }
            }
        },
        include: { accountPayable: true }
    });
    if (items.length === 0) {
        console.log('Nenhuma conta "luz" encontrada.');
    }
    items.forEach(inst => {
        console.log(`ID: ${inst.id}`);
        console.log(`Desc: ${inst.accountPayable.description}`);
        console.log(`Status: ${inst.status}`);
        console.log(`DueDate (Raw): ${inst.dueDate.toISOString()}`);
        console.log(`DueDate (ToLocale): ${inst.dueDate.toLocaleString()}`);
        console.log('---');
    });
    const now = new Date();
    console.log(`Server Now (ISO): ${now.toISOString()}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`Server Today (00:00:00 ISO): ${today.toISOString()}`);
}
main().finally(() => prisma.$disconnect());
