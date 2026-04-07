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
            // Adicionar colunas faltantes em Clinic (Precificação SaaS)
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "implementationFee" DOUBLE PRECISION DEFAULT 0;
            `);
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "monthlyFee" DOUBLE PRECISION DEFAULT 0;
            `);
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "proposalUrl" TEXT;
            `);
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "pricePerUser" DOUBLE PRECISION DEFAULT 50.0;
            `);
            // Garantir que a tabela GlobalLead existe
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "GlobalLead" (
                    "id" TEXT NOT NULL,
                    "name" TEXT NOT NULL,
                    "email" TEXT NOT NULL,
                    "whatsapp" TEXT NOT NULL,
                    "subject" TEXT NOT NULL,
                    "message" TEXT NOT NULL,
                    "status" TEXT NOT NULL DEFAULT 'NOVO',
                    "score" INTEGER NOT NULL DEFAULT 0,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "GlobalLead_pkey" PRIMARY KEY ("id")
                );
            `);
            console.log('✅ Soft Migrations completed successfully.');
        }
        catch (error) {
            console.error('❌ Soft Migration failed:', error);
            // Não paramos o servidor se a migração falhar, pois pode ser que as colunas já existam 
            // ou o dialeto do DB seja diferente.
        }
    }
}
