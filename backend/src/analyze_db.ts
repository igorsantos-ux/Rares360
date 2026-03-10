import prisma from './lib/prisma.js';

async function analyze() {
    console.log('--- Análise de Dados ---');

    const clinics = await prisma.clinic.findMany();
    console.log('Clínicas:', clinics.map(c => ({ id: c.id, name: c.name })));

    const users = await prisma.user.findMany();
    console.log('Usuários:', users.map(u => ({ id: u.id, email: u.email, clinicId: u.clinicId })));

    const customers = await prisma.customer.findMany({
        take: 10,
        select: { id: true, name: true, externalSource: true }
    });
    console.log('Clientes (Amostra):', customers);

    const transactions = await prisma.transaction.count();
    console.log('Total de Transações:', transactions);

    const categories = await prisma.category.findMany({ select: { id: true, name: true, type: true } });
    console.log('Categorias:', categories);
}

analyze();
