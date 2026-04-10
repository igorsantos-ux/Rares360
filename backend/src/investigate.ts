import prisma from './lib/prisma.js';

async function investigate() {
  const incomes = await prisma.transaction.findMany({
    where: { type: 'INCOME' },
    select: { clinicId: true, amount: true, description: true },
    take: 10
  });

  console.log('--- AMOSTRA DE TRANSAÇÕES DE FATURAMENTO ---');
  if (incomes.length === 0) {
    console.log('Nenhuma transação de INCOME encontrada em todo o banco.');
  } else {
    incomes.forEach(i => {
      console.log(`ClinicId: ${i.clinicId} | Valor: ${i.amount} | Desc: ${i.description.substring(0, 20)}`);
    });
  }
}

investigate();
