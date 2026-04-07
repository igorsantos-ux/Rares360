import { PrismaClient } from '@prisma/client';

const OLD_DB_URL = "postgresql://postgres.qrhrtzveglczlxofexwj:k%26%25QDqAZ2R25zAm@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const NEW_DB_URL = "postgresql://postgres.auuetzgkqcjlzmlrlkiy:VDWUlnmJXo3BDd9D@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const oldPrisma = new PrismaClient({
  datasources: { db: { url: OLD_DB_URL } },
});

const newPrisma = new PrismaClient({
  datasources: { db: { url: NEW_DB_URL } },
});

async function migrate() {
  console.log('Iniciando migração de dados...');

  const tables = [
    'clinic',
    'user',
    'doctor',
    'patient',
    'room',
    'equipment',
    'inventoryItem',
    'procedurePricing',
    'appointment',
    'transaction',
    'accountPayable',
    'accountPayableInstallment',
    'clinicalEvolution',
    'prescription',
    'inventoryUsage',
    'proposal',
    'lead',
    'stockMovement',
    'financialGoal',
    'document',
    'clinicDocument',
    'pricingSimulation',
    'pricingSupply',
    'dailyClosure',
    'procedureExecution',
    'task',
    'passwordHistory',
    'globalLead',
  ];

  for (const table of tables) {
    console.log(`Migrando tabela: ${table}...`);
    try {
      // @ts-ignore
      const data = await oldPrisma[table].findMany();
      if (data.length > 0) {
        // @ts-ignore
        await newPrisma[table].createMany({
          data,
          skipDuplicates: true,
        });
        console.log(`✓ ${data.length} registros migrados em ${table}.`);
      } else {
        console.log(`- Tabela ${table} está vazia.`);
      }
    } catch (error) {
      console.error(`Erro ao migrar tabela ${table}:`, error.message);
    }
  }

  console.log('Migração concluída!');
}

migrate()
  .catch((e) => {
    console.error('Erro fatal na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  });
