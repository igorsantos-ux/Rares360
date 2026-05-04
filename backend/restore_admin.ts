import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Restaurando usuário administrador principal...');

    const email = 'igor.santos@rares360.com.br';
    const password = 'admin'; // Senha temporária, o usuário deve trocar
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN_GLOBAL',
            name: 'Igor Santos'
        },
        create: {
            email,
            name: 'Igor Santos',
            password: hashedPassword,
            role: 'ADMIN_GLOBAL'
        }
    });

    console.log(`✅ Usuário ${email} restaurado com sucesso como ADMIN_GLOBAL!`);
    console.log('Sua senha temporária é: admin');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
