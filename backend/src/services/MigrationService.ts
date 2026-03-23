import prisma from '../lib/prisma.js';

export class MigrationService {
    static async runSoftMigrations() {
        console.log('🛡️ Starting Soft Migrations check...');
        try {
            // Adicionar colunas faltantes em Transaction
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "netAmount" DOUBLE PRECISION DEFAULT 0;
            `);
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "quantity" DOUBLE PRECISION DEFAULT 1;
            `);
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "isExecuted" BOOLEAN DEFAULT false;
            `);

            // Garantir que a tabela FinancialGoal existe (simplificado, se não existir o prisma já falharia em outras partes, 
            // mas aqui focamos em colunas novas em tabelas existentes que quebram o findMany)
            
            console.log('✅ Soft Migrations completed successfully.');
        } catch (error) {
            console.error('❌ Soft Migration failed:', error);
            // Não paramos o servidor se a migração falhar, pois pode ser que as colunas já existam 
            // ou o dialeto do DB seja diferente.
        }
    }
}
