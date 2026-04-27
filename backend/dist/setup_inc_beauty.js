import prisma from './lib/prisma.js';
async function setup() {
    const incBeautyId = 'bc78fc97-20d2-412a-a4c3-f9ea0c5eb04a';
    console.log('--- CONFIGURANDO AMBIENTE INC BEAUTY ---');
    // 1. Vincular Roberta à INC BEAUTY
    await prisma.user.updateMany({
        where: { email: 'roberta@rares360.com.br' },
        data: { clinicId: incBeautyId }
    });
    console.log('Usuário Roberta vinculado à INC BEAUTY.');
    // 2. Garantir que o faturamento de todas as clínicas esteja limpo para evitar confusão
    const result = await prisma.transaction.deleteMany({
        where: { type: 'INCOME' }
    });
    console.log(`${result.count} registros de faturamento removidos de todo o sistema.`);
    console.log('Pronto! Todas as contas agora apontam para INC BEAUTY e o financeiro está zerado.');
}
setup();
