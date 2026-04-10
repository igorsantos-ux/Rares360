import prisma from './lib/prisma.js';

async function cleanupIncBeauty() {
  try {
    const incBeautyId = 'bc78fc97-20d2-412a-a4c3-f9ea0c5eb04a';
    console.log(`--- LIMPANDO FATURAMENTO DA INC BEAUTY ---`);

    const result = await prisma.transaction.deleteMany({
      where: {
        clinicId: incBeautyId,
        type: 'INCOME'
      }
    });

    console.log(`Sucesso: ${result.count} registros de faturamento da INC BEAUTY removidos.`);

  } catch (err) {
    console.error('Erro na limpeza:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupIncBeauty();
