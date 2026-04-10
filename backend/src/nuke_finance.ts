import prisma from './lib/prisma.js';

async function nukeAllFinance() {
  try {
    console.log('--- OPERAÇÃO NUKE FINANCE ---');
    
    // 1. Limpar TODAS as Transactions (Geral)
    const tCount = await prisma.transaction.deleteMany({});
    console.log(`Transactions removidas: ${tCount.count}`);

    // 2. Limpar AccountPayableInstallment e AccountPayable
    const apiCount = await prisma.accountPayableInstallment.deleteMany({});
    const apCount = await prisma.accountPayable.deleteMany({});
    console.log(`Parcelas Contas a Pagar removidas: ${apiCount.count}`);
    console.log(`Contas a Pagar removidas: ${apCount.count}`);

    // 3. Limpar ProcedureExecution
    const peCount = await prisma.procedureExecution.deleteMany({});
    console.log(`Execuções de Procedimento removidas: ${peCount.count}`);

    // 4. Limpar DailyClosure
    const dcCount = await prisma.dailyClosure.deleteMany({});
    console.log(`Fechamentos diários removidos: ${dcCount.count}`);

    console.log('Ambiente financeiro zerado em todo o banco de dados.');

  } catch (err) {
    console.error('Erro no Nuke:', err);
  } finally {
    await prisma.$disconnect();
  }
}

nukeAllFinance();
