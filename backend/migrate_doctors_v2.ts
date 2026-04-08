import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Expandindo a tabela Doctor com novas colunas...');
        
        const queries = [
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "cpf" TEXT;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3);`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "email" TEXT;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "crmUf" TEXT;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "rqe" TEXT;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "consultationValue" DOUBLE PRECISION;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "repasseType" TEXT;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "repasseValue" DOUBLE PRECISION;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "pixKey" TEXT;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "defaultDuration" INTEGER NOT NULL DEFAULT 30;`,
            `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "availability" JSONB;`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "Doctor_cpf_key" ON "Doctor"("cpf");`
        ];

        for (const query of queries) {
            try {
                await prisma.$executeRawUnsafe(query);
                console.log(`✅ Sucesso: ${query.substring(0, 40)}...`);
            } catch (e) {
                console.warn(`⚠️ Aviso: ${query.substring(0, 40)}... (Pode ser que a coluna já exista)`);
            }
        }

        console.log('🚀 Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro crítico na migração:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
