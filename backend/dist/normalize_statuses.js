import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('🚀 Iniciando normalização de status...');
    // Normaliza AccountPayableInstallment
    const updatedInstallments = await prisma.accountPayableInstallment.updateMany({
        where: { status: 'PENDING' },
        data: { status: 'PENDENTE' }
    });
    console.log(`✅ ${updatedInstallments.count} parcelas atualizadas de PENDING para PENDENTE.`);
    const updatedPaidInstallments = await prisma.accountPayableInstallment.updateMany({
        where: { status: 'PAID' },
        data: { status: 'PAGO' }
    });
    console.log(`✅ ${updatedPaidInstallments.count} parcelas atualizadas de PAID para PAGO.`);
    // Normaliza AccountPayable (Header)
    const updatedHeaders = await prisma.accountPayable.updateMany({
        where: { status: 'PENDING' },
        data: { status: 'PENDENTE' }
    });
    console.log(`✅ ${updatedHeaders.count} cabeçalhos atualizados de PENDING para PENDENTE.`);
    console.log('✨ Normalização concluída.');
}
main()
    .catch((e) => {
    console.error('❌ Erro na normalização:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
