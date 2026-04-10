import prisma from './lib/prisma.js';

async function listAll() {
  const clinics = await prisma.clinic.findMany();
  console.log('--- CLINICAS NO SISTEMA ---');
  clinics.forEach(c => console.log(`ID: ${c.id} | NOME: ${c.name}`));
}

listAll();
