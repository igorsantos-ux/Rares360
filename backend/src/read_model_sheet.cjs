const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\Igor\\OneDrive\\Desktop\\PROJETOS\\Antigravity\\Rares360\\Modelo Planilha\\MODELO - FATURAMENTO DIARIO.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('--- DIAGNÓSTICO DA PLANILHA MODELO ---');
    console.log('Arquivo:', filePath);
    console.log('Nome da Aba:', sheetName);
    
    if (data.length > 0) {
        console.log('\nCabeçalhos Detectados:');
        console.log(Object.keys(data[0]));
        
        console.log('\nPrimeiras 1 linha (Amostra):');
        console.log(JSON.stringify(data.slice(0, 1), null, 2));
    } else {
        console.log('Planilha parece estar vazia.');
    }
} catch (error) {
    console.error('Erro ao ler a planilha:', error.message);
}
