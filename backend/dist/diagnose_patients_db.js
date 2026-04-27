import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    // Clínica da Roberta (bc78fc97-20d2-412a-a4c3-f9ea0c5eb04a)
    const clinicId = 'bc78fc97-20d2-412a-a4c3-f9ea0c5eb04a';
    const count = await prisma.patient.count({
        where: { clinicId }
    });
    console.log(`\n--- DIAGNÓSTICO DE PACIENTES ---`);
    console.log(`Clínica: ${clinicId}`);
    console.log(`Total de pacientes encontrados: ${count}`);
    if (count > 0) {
        const lastPatient = await prisma.patient.findFirst({
            where: { clinicId },
            orderBy: { createdAt: 'desc' },
            select: { name: true, createdAt: true, email: true }
        });
        console.log(`Último paciente importado: ${lastPatient?.name} em ${lastPatient?.createdAt}`);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
