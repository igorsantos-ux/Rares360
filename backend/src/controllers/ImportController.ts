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
                // Normalizar as chaves para evitar problemas com espaços extras (ex: " PREÇO DE VENDA")
                const cleanRow: any = {};
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
                    } else {
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

            const existingSet = new Set(existingTransactions.map(t => 
                `${t.description.trim()}|${t.amount}|${t.date.toISOString().split('T')[0]}|${t.category}`
            ));

            // Filtrar apenas linhas com valor maior que 0 e que não existam na base
            const validTransactions = transactionsToCreate.filter(t => {
                if (t.amount <= 0) return false;
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

        } catch (error: any) {
            console.error('Erro na importação Excel:', error);
            return res.status(500).json({ message: 'Erro ao processar planilha', error: error.message });
        }
    }

    static async importFinancialData(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId;
            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            const { type } = req.body;
            if (!type) {
                return res.status(400).json({ message: 'Tipo de importação não especificado' });
            }

            // Ler o buffer do arquivo Excel
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            
            // Determinar qual aba usar baseado no tipo ou pegar a padrão
            let sheetName = '';
            if (type === 'billing') {
                sheetName = workbook.SheetNames.find(n => n.includes('FATURAMENTO DIARIO')) || workbook.SheetNames[0];
            } else if (type === 'pricing') {
                sheetName = workbook.SheetNames.find(n => n.includes('PREÇO PROCEDIMENTOS')) || workbook.SheetNames[0];
            } else if (type === 'equipment') {
                sheetName = workbook.SheetNames.find(n => n.includes('TECNOLOGIAS')) || workbook.SheetNames[0];
            } else {
                sheetName = workbook.SheetNames[0];
            }

            const worksheet = workbook.Sheets[sheetName];
            const data: any[] = xlsx.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return res.status(400).json({ message: 'A planilha ou aba selecionada está vazia' });
            }

            let resultCount = 0;
            let updatedCount = 0;

            if (type === 'billing') {
                // Lógica de Faturamento Diário (Transactions)
                const transactionsToCreate = data.map((row: any) => {
                    const cleanRow: any = {};
                    for (const key in row) {
                        cleanRow[key.trim().toUpperCase()] = row[key];
                    }

                    const valorRaw = cleanRow['PREÇO DE VENDA'] || 0;
                    const valor = Math.abs(typeof valorRaw === 'string' ? parseFloat(valorRaw.replace(/\D/g, '').replace(',', '.')) : valorRaw);
                    
                    const valorLiquidoRaw = cleanRow['VALOR LIQUIDO '] || valorRaw;
                    const valorLiquido = Math.abs(typeof valorLiquidoRaw === 'string' ? parseFloat(valorLiquidoRaw.replace(/\D/g, '').replace(',', '.')) : valorLiquidoRaw);

                    let date = new Date();
                    const dataRaw = cleanRow['DATA DA VENDA'];
                    if (dataRaw) {
                        if (typeof dataRaw === 'number') {
                            date = new Date(Math.round((dataRaw - 25569) * 86400 * 1000));
                        } else {
                            const parsed = new Date(dataRaw);
                            if (!isNaN(parsed.getTime())) date = parsed;
                        }
                    }

                    const procedimento = cleanRow['PROCEDIMENTO '] || 'Procedimento não informado';
                    const paciente = cleanRow['PACIENTE'] || '';
                    const descricao = `${procedimento}${paciente ? ` - ${paciente}` : ''}`;

                    return {
                        description: descricao,
                        amount: valor,
                        netAmount: valorLiquido,
                        type: 'INCOME',
                        status: 'PAID',
                        category: cleanRow['TIPO'] || 'Faturamento',
                        paymentMethod: cleanRow['FORMA DE PAGAMENTO'] || 'Outros',
                        centerOfCost: 'Operacional',
                        date: date,
                        clinicId: clinicId
                    };
                });

                // De-duplicação
                const existingTransactions = await prisma.transaction.findMany({
                    where: { clinicId, type: 'INCOME' },
                    select: { description: true, amount: true, date: true }
                });

                const existingSet = new Set(existingTransactions.map(t => 
                    `${t.description.trim()}|${t.amount}|${t.date.toISOString().split('T')[0]}`
                ));

                const validTransactions = transactionsToCreate.filter(t => {
                    if (t.amount <= 0) return false;
                    const hash = `${t.description.trim()}|${t.amount}|${t.date.toISOString().split('T')[0]}`;
                    if (existingSet.has(hash)) return false;
                    existingSet.add(hash);
                    return true;
                });

                if (validTransactions.length > 0) {
                    const result = await prisma.transaction.createMany({ data: validTransactions });
                    resultCount = result.count;
                }
            } 
            else if (type === 'pricing') {
                // Lógica de Precificação (ProcedurePricing)
                for (const row of data) {
                    const cleanRow: any = {};
                    for (const key in row) {
                        cleanRow[key.trim().toUpperCase()] = row[key];
                    }

                    const name = cleanRow['PROCEDIMENTO'];
                    if (!name) continue;

                    const priceRaw = cleanRow['PREÇO- TABELA '] || 0;
                    const price = Math.abs(typeof priceRaw === 'string' ? parseFloat(priceRaw.replace(/\D/g, '').replace(',', '.')) : priceRaw);
                    
                    const costRaw = cleanRow['TOTAL - CUSTO OPERACIONAL'] || 0;
                    const cost = Math.abs(typeof costRaw === 'string' ? parseFloat(costRaw.replace(/\D/g, '').replace(',', '.')) : costRaw);

                    const duration = cleanRow['DURAÇÃO'] || 60;

                    const existing = await prisma.procedurePricing.findFirst({
                        where: { name, clinicId }
                    });

                    if (existing) {
                        await prisma.procedurePricing.update({
                            where: { id: existing.id },
                            data: { currentPrice: price, totalCost: cost, durationMinutes: Number(duration) }
                        });
                        updatedCount++;
                    } else {
                        await prisma.procedurePricing.create({
                            data: { name, currentPrice: price, totalCost: cost, durationMinutes: Number(duration), clinicId }
                        });
                        resultCount++;
                    }
                }
            }
            else if (type === 'equipment') {
                // Lógica de Tecnologias (Equipment)
                for (const row of data) {
                    const cleanRow: any = {};
                    for (const key in row) {
                        cleanRow[key.trim().toUpperCase()] = row[key];
                    }

                    const name = cleanRow['TECNOLOGIA'] || cleanRow['NOME'] || cleanRow['EQUIPAMENTO'];
                    if (!name) continue;

                    const status = cleanRow['STATUS'] || 'ATIVO';

                    const existing = await prisma.equipment.findFirst({
                        where: { name, clinicId }
                    });

                    if (!existing) {
                        await prisma.equipment.create({
                            data: { name, status, clinicId }
                        });
                        resultCount++;
                    } else {
                        updatedCount++;
                    }
                }
            }

            return res.json({
                message: 'Processamento concluído',
                total: data.length,
                imported: resultCount,
                updated: updatedCount
            });

        } catch (error: any) {
            console.error('Erro na importação financeira:', error);
            return res.status(500).json({ message: 'Erro ao processar planilha financeira', error: error.message });
        }
    }
}
