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
                    // Nota: ALTER TYPE ... ADD VALUE não pode rodar dentro de blocos de transação (DO/BEGIN no Postgres)
                    // Por isso executamos individualmente e capturamos o erro caso já exista.
                    await prisma.$executeRawUnsafe(`ALTER TYPE "AppointmentStatus" ADD VALUE '${status}'`);
                    console.log(`✅ Status "${status}" adicionado ao banco.`);
                } catch (e: any) {
                    // Ignoramos erro se o valor já existir (erro 42710 no Postgres)
                    if (!e.message.includes('already exists') && !e.message.includes('42710')) {
                        console.log(`ℹ️ Enum status update info (${status}): ${e.message}`);
                    }
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
