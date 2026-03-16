import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const documents = await prisma.clinicDocument.findMany();
  console.log('Total de documentos encontrados:', documents.length);
  
  const clinics = await prisma.clinic.findMany({
    include: {
      _count: {
        select: { clinicDocuments: true }
      }
    }
  });

  console.log('--- Resumo por Clínica ---');
  clinics.forEach(c => {
    console.log(`Clínica: ${c.name} (${c.id}) - Documentos: ${c._count.clinicDocuments}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
