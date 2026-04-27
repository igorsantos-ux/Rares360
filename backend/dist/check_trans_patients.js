import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkTransactions() {
    console.log('--- VERIFICANDO TRANSAÇÕES E PACIENTES ---');
    const clinicId = 'bc78fc97-20d2-412a-a4c3-f9ea0c5eb04a';
    const total = await prisma.transaction.count({ where: { clinicId } });
    console.log(`Total de Transações: ${total}`);
    const withPatient = await prisma.transaction.count({
        where: {
            clinicId,
            patientId: { not: null }
        }
    });
    console.log(`Transações com PatientId: ${withPatient}`);
    if (total > 0) {
        const sample = await prisma.transaction.findMany({
            where: { clinicId },
            take: 5,
            select: { description: true, amount: true, patientId: true, date: true }
        });
        console.log('\nAmostra:');
        sample.forEach(t => console.log(`- ${t.description} | R$ ${t.amount} | PatId: ${t.patientId} | Data: ${t.date}`));
    }
    const patients = await prisma.patient.count({ where: { clinicId } });
    console.log(`\nTotal de Pacientes na Clínica: ${patients}`);
    await prisma.$disconnect();
}
checkTransactions();
