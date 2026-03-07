import prisma from './lib/prisma.js';
import bcrypt from 'bcryptjs';

async function testLogin() {
    const email = 'admin@heathfinance.com.br';
    const password = 'admin123';

    try {
        console.log(`--- Testando login para: ${email} ---`);
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.error('❌ Usuário não encontrado no banco!');
            return;
        }

        console.log('✅ Usuário encontrado. Verificando senha...');
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            console.log('✅ SENHA CORRETA! O problema não é no banco nem no hashing.');
        } else {
            console.error('❌ SENHA INCORRETA! O hashing pode estar divergente.');
        }

    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

testLogin();
