import xlsx from 'xlsx';

const filePath = 'c:\\Users\\Igor\\OneDrive\\Desktop\\PROJETOS\\Antigravity\\Rares360\\Modelo Planilha\\MODELO - PROCEDIMENTO.xlsx';

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('Sheet Name:', sheetName);
    if (data.length > 0) {
        console.log('Raw Columns:', Object.keys(data[0]));
        const normalizedKeys = Object.keys(data[0]).map(k => k.trim().toUpperCase());
        console.log('Normalized Columns:', normalizedKeys);
        console.log('First Row Data (Sample):', JSON.stringify(data[0], null, 2));
    } else {
        console.log('Worksheet is empty.');
    }
} catch (error) {
    console.error('Error reading file:', error);
}
