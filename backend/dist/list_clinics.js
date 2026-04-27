import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function listClinics() {
    const clinics = await prisma.clinic.findMany();
    console.log('--- CLINICAS ---');
    clinics.forEach(c => console.log(`- ${c.name} | ID: ${c.id}`));
    await prisma.$disconnect();
}
listClinics();
