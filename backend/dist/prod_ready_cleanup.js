import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
const prisma = new PrismaClient();
async function main() {
    console.log('🚀 Iniciando script de limpeza para produção...');
    // 1. BACKUP (Simulado/Dump JSON)
    const backupPath = path.join('C:\\Users\\Igor\\AppData\\Local\\Temp', `backup_${Date.now()}.json`);
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
        leads: await prisma.lead.findMany(),
        goals: await prisma.financialGoal.findMany()
    };
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log('✅ Backup concluído com sucesso.');
    // 2. LIMPEZA (FAXINA)
    console.log('🧹 Limpando dados fictícios...');
    // Ordem de deleção para respeitar FKs (dependendo do onDelete: Cascade no Prisma)
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
    console.log('✨ Limpeza concluída! O banco está pronto para dados reais.');
    console.log('⚠️  Mantivemos as tabelas de CLINIC e USER (Estrutura e Acesso).');
}
main()
    .catch((e) => {
    console.error('❌ Erro durante a limpeza:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
