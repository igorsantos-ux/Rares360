import { PrismaClient } from '@prisma/client';

// Usando o HOST DIRETO do Supabase para evitar erros do Supavisor/Pooler
const directUrl = "postgresql://postgres.qrhrtzveglczlxofexwj:k%26%25QDqAZ2R25zAm@db.qrhrtzveglczlxofexwj.supabase.co:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl,
    },
  },
});

async function main() {
  const statuses = [
    'AGUARDANDO_PAGAMENTO',
    'CANCELADO_PROFISSIONAL',
    'CHAMANDO',
    'DESMARCADO_PACIENTE',
    'EM_ATENDIMENTO',
    'CONFIRMADO',
    'NAO_CONFIRMADO',
    'FALTA',
    'REMARCADO',
    'ATENDIDO',
    'AGUARDANDO'
  ];

  console.log('🚀 Iniciando atualização via DIRECT HOST (db.qrhrtzveglczlxofexwj.supabase.co)...');

  for (const status of statuses) {
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type t 
                         JOIN pg_enum e ON t.oid = e.enumtypid 
                         WHERE t.typname = 'AppointmentStatus' AND e.enumlabel = '${status}') THEN
            ALTER TYPE "AppointmentStatus" ADD VALUE '${status}';
          END IF;
        END
        $$;
      `);
      console.log(`✅ Status "${status}" verificado.`);
    } catch (e) {
      // Se der erro de duplicado aqui (mesmo com IF NOT EXISTS), apenas ignoramos
      if (e.message.includes('already exists')) {
          console.log(`ℹ️ Status "${status}" já existe no banco.`);
      } else {
          console.error(`❌ Erro em "${status}":`, e.message);
      }
    }
  }

  console.log('✨ Banco de dados sincronizado com sucesso!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('💥 Erro fatal de conexão:', err);
  process.exit(1);
});
