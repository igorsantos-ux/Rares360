import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const clinicId = '3272fe27-069a-4915-91ff-2b1416f511c4';
  
  // 1. Criar Paciente Demo
  const patient = await prisma.patient.create({
    data: {
      fullName: 'Dr. Arthur Siqueira (DEMO VIP)',
      cpf: '999.888.777-66',
      email: 'arthur.demo@rares.com',
      phone: '(11) 98888-7777',
      birthDate: new Date('1985-05-20'),
      insurance: 'Bradesco Saúde Premium',
      clinicId,
      tags: ['VIP', 'Alta Fidelidade'],
    }
  });

  // 2. Adicionar Faturamento (LTV)
  await prisma.transaction.create({
    data: {
      description: 'Procedimento Estético Avançado - Pacote Diamond',
      amount: 15400,
      type: 'INCOME',
      status: 'PAID',
      category: 'Procedimentos',
      clinicId,
      patientId: patient.id,
      date: new Date(),
    }
  });

  // 3. Adicionar Uso de Insumo (para cálculo de margem)
  let item = await prisma.inventoryItem.findFirst({ where: { clinicId } });
  if (!item) {
      item = await prisma.inventoryItem.create({
          data: {
              name: 'Insumo Clínica Premium',
              category: 'Insumos',
              quantity: 100,
              unit: 'un',
              unitCost: 150,
              clinicId
          }
      });
  }

  await prisma.inventoryUsage.create({
    data: {
      patientId: patient.id,
      inventoryItemId: item.id,
      quantity: 5,
      clinicId,
    }
  });

  // 4. Adicionar Evolução Clínica (PEP)
  await prisma.clinicalEvolution.create({
    data: {
      patientId: patient.id,
      text: '<p><strong>Primeira Consulta:</strong> Paciente apresenta excelente resposta tecidual. Realizado preenchimento com técnica avançada. Margem operacional do paciente é excelente para a clínica.</p>',
      professionalId: 'staff-id-demo',
      date: new Date(),
      clinicId,
    }
  });

  // 5. Adicionar Receita
  await prisma.prescription.create({
    data: {
      patientId: patient.id,
      content: { medications: [{ name: 'Filtro Solar 50 FPS', dosage: 'A cada 4h' }] },
      clinicId,
    }
  });

  console.log('✅ Paciente VIP e dados clínicos de demonstração criados com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
