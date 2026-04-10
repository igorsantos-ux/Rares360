import * as xlsx from 'xlsx';
import path from 'path';

const filePath = 'c:/Users/Igor/OneDrive/Desktop/PROJETOS/Antigravity/Rares360/Modelo Planilha/FATURAMENTO TOTAL INC BEUATY .xlsx';

try {
    const wb = xlsx.readFile(filePath);
    console.log('--- ABAS DISPONÍVEIS ---');
    console.log(wb.SheetNames);

    const billingSheetName = wb.SheetNames.find(n => n.includes('FATURAMENTO DIARIO'));
    if (billingSheetName) {
        const sheet = wb.Sheets[billingSheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        if (data.length > 0) {
            console.log('\n--- ABA: ', billingSheetName, ' ---');
            console.log('Chaves Originais:', Object.keys(data[0]));
            const cleanKeys = Object.keys(data[0]).map(k => k.trim().toUpperCase());
            console.log('Chaves Trimmed/Upper:', cleanKeys);
            console.log('Exemplo Linha 1:', data[0]);
        }
    }

    const pricingSheetName = wb.SheetNames.find(n => n.includes('PREÇO PROCEDIMENTOS'));
    if (pricingSheetName) {
        const sheet = wb.Sheets[pricingSheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        if (data.length > 0) {
            console.log('\n--- ABA: ', pricingSheetName, ' ---');
            console.log('Chaves Trimmed/Upper:', Object.keys(data[0]).map(k => k.trim().toUpperCase()));
            console.log('Exemplo Linha 1:', data[0]);
        }
    }
} catch (err) {
    console.error('Erro ao ler planilha:', err.message);
}
