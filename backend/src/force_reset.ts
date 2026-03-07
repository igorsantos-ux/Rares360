import prisma from './lib/prisma.js';
import { AuthService } from './services/AuthService.js';

async function forceReset() {
    try {
        console.log('--- Iniciando Reset de Senhas no Supabase ---');
        const defaultPassword = 'admin123';
        const hashedPassword = await AuthService.hashPassword(defaultPassword);

        const users = ['admin@heathfinance.com.br', 'roberta@alamino.com'];

        for (const email of users) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.user.update({
                    where: { email },
                    data: { password: hashedPassword }
                });
                console.log(`✅ Senha resetada para: ${email}`);
            } else {
                console.log(`⚠️ Usuário não encontrado: ${email}`);
            }
        }

        console.log('--- Processo Concluído! ---');
        process.exit(0);
    } catch (error) {
        console.error('Erro no reset:', error);
        process.exit(1);
    }
}

forceReset();
