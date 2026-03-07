import prisma from './lib/prisma.js';

async function diagnose() {
    try {
        console.log('--- Diagnóstico de Usuários ---');
        const users = await prisma.user.findMany();
        console.log('Total de usuários:', users.length);
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));

        const clinics = await prisma.clinic.findMany();
        console.log('Total de clínicas:', clinics.length);

        process.exit(0);
    } catch (error) {
        console.error('Erro no diagnóstico:', error);
        process.exit(1);
    }
}

diagnose();
