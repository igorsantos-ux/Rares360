import { basePrisma } from './lib/prisma.js';
import { AuthService } from './services/AuthService.js';

async function restoreAdmin() {
  try {
    console.log('🚀 Restaurando usuários proprietários...');
    
    const hashedPassword = await AuthService.hashPassword('admin123');
    
    // 1. Criar Clínica Padrão (necessária para administradores de clínica)
    const clinic = await basePrisma.clinic.upsert({
      where: { cnpj: '00.000.000/0001-00' },
      update: {},
      create: {
        name: 'Rares360 Gestão',
        cnpj: '00.000.000/0001-00',
        logradouro: 'Sede Rares360',
        cidade: 'São Paulo',
        estado: 'SP'
      }
    });

    // 2. Restaurar Igor (ADMIN_GLOBAL)
    await basePrisma.user.upsert({
      where: { email: 'igor.santos@rares360.com.br' },
      update: { password: hashedPassword, role: 'ADMIN_GLOBAL' },
      create: {
        name: 'Igor Santos',
        email: 'igor.santos@rares360.com.br',
        password: hashedPassword,
        role: 'ADMIN_GLOBAL'
      }
    });

    // 3. Restaurar Roberta (ADMIN_GLOBAL)
    await basePrisma.user.upsert({
      where: { email: 'roberta.alamino@rares360.com.br' },
      update: { password: hashedPassword, role: 'ADMIN_GLOBAL' },
      create: {
        name: 'Roberta Alamino',
        email: 'roberta.alamino@rares360.com.br',
        password: hashedPassword,
        role: 'ADMIN_GLOBAL'
      }
    });

    console.log('✅ Usuários restaurados com sucesso!');
    console.log('📧 igor.santos@rares360.com.br (Global)');
    console.log('📧 roberta.alamino@rares360.com.br (Clínica)');
    console.log('🔑 Senha padrão: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao restaurar:', error);
    process.exit(1);
  }
}

restoreAdmin();
