import prisma from './lib/prisma.js';

async function analyze() {
    console.log('--- Análise de Dados Completa ---');

    const counters = {
        clinics: await prisma.clinic.count(),
        users: await prisma.user.count(),
        transactions: await prisma.transaction.count(),
        doctors: await prisma.doctor.count(),
        customers: await prisma.customer.count(),
        leads: await prisma.lead.count(),
        stockItems: await prisma.stockItem.count(),
        goals: await prisma.financialGoal.count(),
        documents: await prisma.document.count(),
        integrations: await prisma.integration.count()
    };

    console.log('Contagem de registros:', counters);

    const sampling = {
        doctors: await prisma.doctor.findMany({ take: 5, select: { name: true, specialty: true } }),
        stock: await prisma.stockItem.findMany({ take: 5, select: { name: true, category: true } }),
        leads: await prisma.lead.findMany({ take: 5, select: { name: true, source: true } })
    };

    console.log('Amostra de Médicos:', sampling.doctors);
    console.log('Amostra de Estoque:', sampling.stock);
    console.log('Amostra de Leads:', sampling.leads);

    await prisma.$disconnect();
}

analyze();
