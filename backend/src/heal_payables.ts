import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function healOrphans() {
    console.log('--- CURANDO REGISTROS ÓRFÃOS (SEM PARCELAS) ---');

    // 1. Buscar Contas que não possuem nenhuma parcela
    const orphans = await prisma.accountPayable.findMany({
        where: {
            installments: {
                none: {}
            }
        },
        include: {
            importBatch: true
        }
    });

    console.log(`Encontradas ${orphans.length} contas sem parcelas.`);

    if (orphans.length === 0) {
        console.log('Nada para curar.');
        return;
    }

    let healedCount = 0;
    for (const acc of orphans) {
        try {
            await prisma.accountPayableInstallment.create({
                data: {
                    accountPayableId: acc.id,
                    installmentNumber: 1,
                    amount: acc.totalAmount,
                    dueDate: acc.dueDate,
                    status: acc.status as any,
                    paidAt: acc.status === 'PAGO' ? (acc.paymentDate || acc.dueDate) : null,
                    paymentMethod: acc.paymentMethod || 'Outros'
                }
            });
            healedCount++;
            if (healedCount % 50 === 0) console.log(`Curados: ${healedCount}...`);
        } catch (e: any) {
            console.error(`Erro ao curar conta ${acc.id}:`, e.message);
        }
    }

    console.log(`\n✅ Sucesso! ${healedCount} parcelas criadas.`);
    await prisma.$disconnect();
}

healOrphans();
