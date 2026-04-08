import { PrismaClient } from '@prisma/client';

const NEW_DB_URL = "postgresql://postgres.auuetzgkqcjlzmlrlkiy:VDWUlnmJXo3BDd9D@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prisma = new PrismaClient({
  datasources: { db: { url: NEW_DB_URL } },
});

async function findUser() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log('--- LISTA DE USUÁRIOS (NOVO BANCO) ---');
  console.log(JSON.stringify(users, null, 2));
}

findUser().finally(() => prisma.$disconnect());
