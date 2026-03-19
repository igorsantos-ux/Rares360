import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando script de limpeza para produção (ESM Version)...');

  // 1. BACKUP
  const tempDir = process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp';
  const backupPath = path.join(tempDir, `backup_production_${Date.now()}.json`);
  console.log(`📦 Criando backup de segurança em: ${backupPath}`);
  
  const backupData = {
    patients: await prisma.patient.findMany(),
    transactions: await prisma.transaction.findMany(),
    inventoryItems: await prisma.inventoryItem.findMany(),
    stockMovements: await prisma.stockMovement.findMany(),
    accountPayables: await prisma.accountPayable.findMany(),
    dailyClosures: await prisma.dailyClosure.findMany(),
    tasks: await prisma.task.findMany(),
    clinicDocuments: await prisma.clinicDocument.findMany(),
    lead: await prisma.lead.findMany()
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log('✅ Backup concluído.');

  // 2. LIMPEZA
  console.log('🧹 Limpando dados...');
  
  // Ordem segura
  await prisma.stockMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.procedureExecution.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.accountPayableInstallment.deleteMany();
  await prisma.accountPayable.deleteMany();
  await prisma.dailyClosure.deleteMany();
  await prisma.task.deleteMany();
  await prisma.clinicDocument.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.financialGoal.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.pricingSupply.deleteMany();
  await prisma.pricingSimulation.deleteMany();
  await prisma.procedurePricing.deleteMany();
  await prisma.document.deleteMany();

  console.log('✨ BANCO LIMPO E PRONTO PARA PRODUÇÃO!');
}

main()
  .catch((e) => {
    console.error('❌ ERRO:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
