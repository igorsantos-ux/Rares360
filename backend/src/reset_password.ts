import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const NEW_DB_URL = "postgresql://postgres.auuetzgkqcjlzmlrlkiy:VDWUlnmJXo3BDd9D@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const EMAIL = 'igor.santos@rares360.com.br';
const NEW_PASSWORD = 'admin123'; // Senha padrão solicitada/sugerida

const prisma = new PrismaClient({
  datasources: { db: { url: NEW_DB_URL } },
});

async function resetPassword() {
  console.log(`--- Resatando senha para: ${EMAIL} ---`);
  
  const user = await prisma.user.findUnique({
    where: { email: EMAIL }
  });

  if (!user) {
    console.error('❌ Usuário não encontrado no Novo Banco!');
    return;
  }

  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

  await prisma.user.update({
    where: { email: EMAIL },
    data: { 
      password: hashedPassword,
      mustChangePassword: false // Evita forçar troca no primeiro login se não for desejado
    }
  });

  console.log(`✅ Senha resetada com sucesso para: ${NEW_PASSWORD}`);
}

resetPassword()
  .catch(e => console.error('Erro:', e))
  .finally(() => prisma.$disconnect());
