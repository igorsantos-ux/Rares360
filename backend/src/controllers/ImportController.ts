import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import * as xlsx from 'xlsx';

export class ImportController {
    static async importTransactions(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId;
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
            const data: any[] = xlsx.utils.sheet_to_json(worksheet);

            const transactionsToCreate = data.map((row: any) => {
                // Mapeamento baseado no modelo "FLUXO DE CAIXA - INSTITUTO NASSARALLA.xlsx"
                const valorRaw = row['Valor'] || 0;
                const valor = Math.abs(typeof valorRaw === 'string' ? parseFloat(valorRaw.replace(',', '.')) : valorRaw);

                const tipo = row['Tipo']?.toUpperCase() === 'ENTRADA' ? 'INCOME' : 'EXPENSE';
                const status = row['Status']?.toUpperCase() === 'PAGO' ? 'PAID' : 'PENDING';

                // Tratar datas (Excel serial ou string)
                let dataTransacao = new Date();
                if (row['Data de Pagamento']) {
                    dataTransacao = new Date(row['Data de Pagamento']);
                } else if (row['Data Vencimento']) {
                    dataTransacao = new Date(row['Data Vencimento']);
                }

                return {
                    description: row['Descrição'] || row['Subcategoria'] || 'Importação Excel',
                    amount: valor,
                    netAmount: valor,
                    type: tipo,
                    status: status,
                    category: row['Categoria'] || 'Importado',
                    paymentMethod: row['Meio de Pagamento'] || 'Outros',
                    centerOfCost: row['Centro de Custo'] || 'Operacional',
                    date: isNaN(dataTransacao.getTime()) ? new Date() : dataTransacao,
                    clinicId: clinicId
                };
            });

            // Criar em lote
            const result = await prisma.transaction.createMany({
                data: transactionsToCreate
            });

            return res.json({
                message: `${result.count} transações importadas com sucesso!`,
                count: result.count
            });

        } catch (error: any) {
            console.error('Erro na importação Excel:', error);
            return res.status(500).json({ message: 'Erro ao processar planilha', error: error.message });
        }
    }
}
