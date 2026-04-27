import prisma from './lib/prisma.js';
async function checkUser() {
    const users = await prisma.user.findMany({
        include: { clinic: true }
    });
    console.log('--- USUÁRIOS E SUAS CLÍNICAS ---');
    users.forEach(u => {
        console.log(`Usuário: ${u.email} | Clínica: ${u.clinic?.name || 'SEM CLÍNICA'} | ID Clínica: ${u.clinicId}`);
    });
}
checkUser();
