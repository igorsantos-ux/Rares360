import prisma from './lib/prisma.js';

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, clinicId: true }
    });
    console.log('--- USUÁRIOS NO BANCO ---');
    users.forEach(u => console.log(`Email: ${u.email} | Nome: ${u.name} | ClinicId: ${u.clinicId}`));
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
