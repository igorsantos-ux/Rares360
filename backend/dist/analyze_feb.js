import * as xlsx from '@e965/xlsx';
const filePath = 'c:/Users/Igor/OneDrive/Desktop/PROJETOS/Antigravity/Rares360/Modelo Planilha/FATURAMENTO TOTAL INC BEUATY .xlsx';
function parseCurrency(val) {
    if (typeof val === 'number')
        return val;
    if (!val || typeof val !== 'string')
        return 0;
    let clean = val.replace(/R\$\s?/, '').trim();
    if (clean.includes(',') && clean.includes('.'))
        clean = clean.replace(/\./g, '').replace(',', '.');
    else if (clean.includes(','))
        clean = clean.replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
}
try {
    const wb = xlsx.read(require('fs').readFileSync(filePath));
    const sheetName = wb.SheetNames.find(n => n.includes('FATURAMENTO DIARIO')) || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    let totalFeb = 0;
    let febRows = 0;
    const duplicatesMap = new Map();
    data.forEach((row, index) => {
        const cleanRow = {};
        for (const key in row) {
            cleanRow[key.trim().toUpperCase()] = row[key];
        }
        const dateRaw = cleanRow['DATA DA VENDA'];
        let date = null;
        if (dateRaw) {
            if (typeof dateRaw === 'number') {
                date = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
            }
            else {
                date = new Date(dateRaw);
            }
        }
        if (date && !isNaN(date.getTime()) && date.getMonth() === 1) { // Fevereiro
            const valor = parseCurrency(cleanRow['PREÇO DE VENDA']);
            totalFeb += valor;
            febRows++;
            const hash = `${cleanRow['PROCEDIMENTO']}|${valor}|${date.toISOString().split('T')[0]}`;
            duplicatesMap.set(hash, (duplicatesMap.get(hash) || 0) + 1);
        }
    });
    console.log(`--- AUDITORIA FEVEREIRO ---`);
    console.log(`Total de linhas em Fev: ${febRows}`);
    console.log(`Soma Total: R$ ${totalFeb.toLocaleString('pt-BR')}`);
    let dupCount = 0;
    duplicatesMap.forEach((count, hash) => {
        if (count > 1) {
            dupCount += (count - 1);
            if (dupCount < 50)
                console.log(`Duplicata em potencial detectada: ${hash} (aparece ${count} vezes)`);
        }
    });
    console.log(`Total de linhas que seriam ignoradas por de-duplicação: ${dupCount}`);
}
catch (err) {
    console.error('Erro:', err.message);
}
