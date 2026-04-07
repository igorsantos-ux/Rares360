import prisma from '../lib/prisma.js';
import * as xlsx from 'xlsx';
export class ImportController {
    static async importTransactions(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada' });
            }
            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }
            // Ler o buffer do arquivo Excel
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // Converter para JSON as colunas
            const data = xlsx.utils.sheet_to_json(worksheet);
            const transactionsToCreate = data.map((row) => {
                // Normalizar as chaves para evitar problemas com espaços extras (ex: " PREÇO DE VENDA")
                const cleanRow = {};
                for (const key in row) {
                    cleanRow[key.trim().toUpperCase()] = row[key];
                }
                const valorRaw = cleanRow['PREÇO DE VENDA'] || 0;
                const valor = Math.abs(typeof valorRaw === 'string' ? parseFloat(valorRaw.replace(',', '.')) : valorRaw);
                const valorLiquidoRaw = cleanRow['VALOR LIQUIDO'] || valorRaw;
                const valorLiquido = Math.abs(typeof valorLiquidoRaw === 'string' ? parseFloat(valorLiquidoRaw.replace(',', '.')) : valorLiquidoRaw);
                // Como é Faturamento, trataremos sempre como ENTRADA (INCOME)
                const tipo = 'INCOME';
                // Tratar status - vamos assumir PAGO se houver valor, a menos que especificado
                const status = 'PAID';
                // Tratar datas (Excel serial ou string)
                let dataTransacao = new Date();
                const dataRaw = cleanRow['DATA DA VENDA'];
                if (dataRaw) {
                    if (typeof dataRaw === 'number') {
                        // Excel serial date to JS Date
                        dataTransacao = new Date(Math.round((dataRaw - 25569) * 86400 * 1000));
                    }
                    else {
                        dataTransacao = new Date(dataRaw);
                    }
                }
                const paciente = cleanRow['PACIENTE'] || 'Paciente não informado';
                const procedimento = cleanRow['PROCEDIMENTO'] || 'Procedimento não informado';
                const medico = cleanRow['MEDICO SOLICITANTE'] || cleanRow['MÉDICO EXECUTOR'] || '';
                const descricao = `${procedimento} - ${paciente}${medico ? ` (${medico})` : ''}`;
                return {
                    description: descricao,
                    amount: valor,
                    netAmount: valorLiquido,
                    type: tipo,
                    status: status,
                    category: cleanRow['TIPO'] || 'Faturamento',
                    paymentMethod: cleanRow['FORMA DE PAGAMENTO'] || 'Outros',
                    centerOfCost: 'Operacional', // Pode ser ajustado conforme a necessidade
                    date: isNaN(dataTransacao.getTime()) ? new Date() : dataTransacao,
                    clinicId: clinicId
                };
            });
            // Buscar transações existentes para evitar duplicatas
            const existingTransactions = await prisma.transaction.findMany({
                where: { clinicId, type: 'INCOME' },
                select: { description: true, amount: true, date: true, category: true }
            });
            const existingSet = new Set(existingTransactions.map(t => `${t.description.trim()}|${t.amount}|${t.date.toISOString().split('T')[0]}|${t.category}`));
            // Filtrar apenas linhas com valor maior que 0 e que não existam na base
            const validTransactions = transactionsToCreate.filter(t => {
                if (t.amount <= 0)
                    return false;
                const hash = `${t.description.trim()}|${t.amount}|${t.date.toISOString().split('T')[0]}|${t.category}`;
                if (existingSet.has(hash)) {
                    return false;
                }
                existingSet.add(hash); // Prevenir linhas duplicadas dentro da mesma planilha
                return true;
            });
            if (validTransactions.length === 0) {
                return res.json({
                    message: 'Nenhuma nova transação encontrada. Todos os dados da planilha já constam no painel!',
                    count: 0
                });
            }
            // Criar em lote
            const result = await prisma.transaction.createMany({
                data: validTransactions
            });
            return res.json({
                message: `${result.count} novas transações importadas com sucesso!`,
                count: result.count
            });
        }
        catch (error) {
            console.error('Erro na importação Excel:', error);
            return res.status(500).json({ message: 'Erro ao processar planilha', error: error.message });
        }
    }
}
