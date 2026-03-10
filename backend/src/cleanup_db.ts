import prisma from './lib/prisma.js';

async function cleanup() {
    console.log('🚀 Iniciando limpeza de dados fictícios...');

    try {
        // Deletar transações primeiro (devido às constraints de chave estrangeira)
        const deletedTransactions = await prisma.transaction.deleteMany({});
        console.log(`✅ ${deletedTransactions.count} transações removidas.`);

        // Deletar metas financeiras
        const deletedGoals = await prisma.financialGoal.deleteMany({});
        console.log(`✅ ${deletedGoals.count} metas financeiras removidas.`);

        // Deletar itens de estoque
        const deletedStock = await prisma.stockItem.deleteMany({});
        console.log(`✅ ${deletedStock.count} itens de estoque removidos.`);

        // Deletar documentos
        const deletedDocs = await prisma.document.deleteMany({});
        console.log(`✅ ${deletedDocs.count} documentos removidos.`);

        // Deletar leads
        const deletedLeads = await prisma.lead.deleteMany({});
        console.log(`✅ ${deletedLeads.count} leads removidos.`);

        // Deletar médicos
        const deletedDoctors = await prisma.doctor.deleteMany({});
        console.log(`✅ ${deletedDoctors.count} médicos removidos.`);

        // Deletar clientes QUE NÃO SÃO do Feegow (sem externalId)
        const deletedCustomers = await prisma.customer.deleteMany({
            where: {
                externalId: null
            }
        });
        console.log(`✅ ${deletedCustomers.count} clientes fictícios removidos.`);

        console.log('✨ Limpeza concluída com sucesso! O banco está pronto para dados reais.');
    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
