import { MailService } from './services/MailService.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Tenta carregar o .env de várias formas para garantir
const envPath = path.resolve(process.cwd(), '.env');
console.log(`[DIAG] Procurando .env em: ${envPath}`);

if (fs.existsSync(envPath)) {
    console.log(`[DIAG] Arquivo .env encontrado!`);
    dotenv.config({ path: envPath });
} else {
    console.error(`[DIAG] ERRO: Arquivo .env NÃO encontrado em ${envPath}`);
}

async function runTest() {
    const testEmail = process.argv[2] || 'ti.rares@rares360.com.br';
    
    console.log(`[DIAG] Verificando credenciais:`);
    console.log(` - HOST: ${process.env.SMTP_HOST}`);
    console.log(` - USER: ${process.env.SMTP_USER}`);
    console.log(` - PASS: ${process.env.SMTP_PASS ? '******** (Preenchido)' : 'VAZIO'}`);

    console.log(`\n[TEST] Iniciando disparo de teste para: ${testEmail}`);
    
    try {
        await MailService.sendOnboardingEmail(testEmail, 'Usuário de Teste RARES', 'RARES@2026!TEST');
        console.log('\n[TEST] SUCESSO: E-mail enviado com sucesso!');
    } catch (error: any) {
        console.error('\n[TEST] ERRO: Falha ao enviar e-mail de teste.');
        // O log detalhado já sairá pelo MailService (debug: true)
    }
}

runTest();
