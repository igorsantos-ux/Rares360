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

            // Sincronizar Enums de Agendamento (Novos Status Operacionais)
            const statuses = [
                'AGUARDANDO_PAGAMENTO',
                'CANCELADO_PROFISSIONAL',
                'CHAMANDO',
                'DESMARCADO_PACIENTE',
                'EM_ATENDIMENTO',
                'CONFIRMADO',
                'NAO_CONFIRMADO',
                'FALTA',
                'REMARCADO'
            ];

            for (const status of statuses) {
                try {
                    await prisma.$executeRawUnsafe(`
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_type t 
                                JOIN pg_enum e ON t.oid = e.enumtypid 
                                WHERE t.typname = 'AppointmentStatus' AND e.enumlabel = '${status}'
                            ) THEN
                                ALTER TYPE "AppointmentStatus" ADD VALUE '${status}';
                            END IF;
                        END
                        $$;
                    `);
                } catch (e) {
                    console.log(`ℹ️ Enum status check (${status}): ${e.message}`);
                }
            }
            
            
            console.log('✅ Soft Migrations completed successfully.');
        } catch (error) {
            console.error('❌ Soft Migration failed:', error);
            // Não paramos o servidor se a migração falhar, pois pode ser que as colunas já existam 
            // ou o dialeto do DB seja diferente.
        }
    }
}
