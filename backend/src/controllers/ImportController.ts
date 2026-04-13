import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import * as xlsx from 'xlsx';
import { TaskService } from '../services/TaskService.js';

export class ImportController {
    static async bulkImportPatients(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId;
            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada' });
            }

            const workbook = xlsx.read((req as any).file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data: any[] = xlsx.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return res.status(400).json({ message: 'Planilha vazia' });
            }

            const batch = await prisma.importBatch.create({
                data: {
                    clinicId,
                    module: 'PACIENTES',
                    fileName: (req as any).file.originalname,
                    recordCount: 0
                }
            });

            let importCount = 0;

            for (const row of data) {
                const cleanRow: any = {};
                for (const key in row) {
                    cleanRow[key.trim().toUpperCase()] = row[key];
                }

                const name = cleanRow['NOME'] || cleanRow['NOME COMPLETO'] || cleanRow['PACIENTE'] || cleanRow['NOME DO PACIENTE'];
                if (!name) continue;

                const email = cleanRow['E-MAIL'] || cleanRow['EMAIL'] || cleanRow['EMAIL PRINCIPAL'];
                const phone = String(cleanRow['CELULAR'] || cleanRow['TELEFONE'] || cleanRow['TELEFONE CELULAR'] || cleanRow['FONE'] || '');
                const cpf = cleanRow['CPF'] || cleanRow['DOCUMENTO'];
                const birthDateRaw = cleanRow['DATA DE NASCIMENTO'] || cleanRow['NASCIMENTO'] || cleanRow['DATA NASCIMENTO'];

                let birthDate = null;
                if (birthDateRaw) {
                    if (typeof birthDateRaw === 'number') {
                        birthDate = new Date(Math.round((birthDateRaw - 25569) * 86400 * 1000));
                    } else {
                        const parsed = new Date(birthDateRaw);
                        if (!isNaN(parsed.getTime())) birthDate = parsed;
                    }
                }

                // Busca manual para evitar erro de índice composto inexistente
                const existingPatient = await prisma.patient.findFirst({
                    where: {
                        clinicId,
                        OR: [
                            cpf ? { cpf: String(cpf).replace(/\D/g, '') } : null,
                            email ? { email: email } : null
                        ].filter(Boolean) as any
                    }
                });

                const patientData = {
                    fullName: name,
                    phone,
                    birthDate,
                    cpf: cpf ? String(cpf).replace(/\D/g, '') : undefined,
                    rg: cleanRow['RG'] ? String(cleanRow['RG']) : undefined,
                    profession: cleanRow['PROFISSÃO'] || cleanRow['PROFISSÃO '],
                    healthInsurance: cleanRow['CONVÊNIO'] || cleanRow['PLANO DE SAÚDE'],
                    leadSource: cleanRow['ORIGEM'] || cleanRow['INDICAÇÃO'],
                    clinicId
                };

                if (existingPatient) {
                    await prisma.patient.update({
                        where: { id: existingPatient.id },
                        data: patientData
                    });
                } else {
                    await prisma.patient.create({
                        data: {
                            ...patientData,
                            email: email || null,
                            importBatchId: batch.id
                        }
                    });
                }
                importCount++;
            }

            await prisma.importBatch.update({
                where: { id: batch.id },
                data: { recordCount: importCount }
            });

            return res.json({ message: `${importCount} pacientes processados com sucesso!`, count: importCount });

        } catch (error: any) {
            console.error('Erro na importação de pacientes:', error);
            return res.status(500).json({ message: 'Erro interno ao importar pacientes', error: error.message });
        }
    }

    static async importTransactions(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId;
            if (!clinicId) {
                return res.status(401).json({ message: 'Clínica não identificada' });
            }

            if (!(req as any).file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            // Ler o buffer do arquivo Excel
            const workbook = xlsx.read((req as any).file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Converter para JSON as colunas
            const data: any[] = xlsx.utils.sheet_to_json(worksheet);

            const batch = await prisma.importBatch.create({
                data: {
                    clinicId,
                    module: 'FATURAMENTO',
                    fileName: (req as any).file.originalname,
                    recordCount: 0
                }
            });

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
                data: validTransactions.map(t => ({ ...t, importBatchId: batch.id }))
            });

            await prisma.importBatch.update({
                where: { id: batch.id },
                data: { recordCount: result.count }
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

            if (!(req as any).file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            const { type } = req.body;
            console.log('DEBUG: Iniciando importação financeira:', {
                type,
                fileName: (req as any).file?.originalname,
                fileSize: (req as any).file?.size,
                bodyKeys: Object.keys(req.body)
            });

            if (!type) {
                return res.status(400).json({
                    message: 'Tipo de importação não especificado no payload (req.body.type)',
                    debug_body: req.body
                });
            }

            // Helper de normalização agressiva de chaves (Upper + Sem Acentos)
            const normalizeKey = (str: string) => {
                return str.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            };

            // Ler o buffer do arquivo Excel
            const workbook = xlsx.read((req as any).file.buffer, { type: 'buffer' });

            // Determinar qual aba usar baseado no tipo ou pegar a padrão
            let sheetName = '';
            if (type === 'billing') {
                sheetName = workbook.SheetNames.find(n => normalizeKey(n).includes('FATURAMENTO DIARIO')) || workbook.SheetNames[0];
            } else if (type === 'pricing') {
                // Tenta nomes comuns como PROCEDIMENTOS, PRECO, PLANILHA1
                sheetName = workbook.SheetNames.find(n => {
                    const norm = normalizeKey(n);
                    return norm.includes('PROCEDIMENTO') || norm.includes('PRECO') || norm.includes('PLANILHA1') || norm.includes('PLANILHA 1');
                }) || workbook.SheetNames[0];
            } else if (type === 'equipment') {
                sheetName = workbook.SheetNames.find(n => normalizeKey(n).includes('TECNOLOGIA')) || workbook.SheetNames[0];
            } else {
                sheetName = workbook.SheetNames[0];
            }

            const worksheet = workbook.Sheets[sheetName];
            const data: any[] = xlsx.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return res.status(400).json({ message: 'A planilha ou aba selecionada está vazia' });
            }

            const moduleMap: Record<string, any> = {
                'billing': 'FATURAMENTO',
                'pricing': 'PROCEDIMENTOS',
                'equipment': 'ESTOQUE'
            };

            const batch = await prisma.importBatch.create({
                data: {
                    clinicId,
                    module: moduleMap[type] || 'FATURAMENTO',
                    fileName: (req as any).file.originalname,
                    recordCount: 0
                }
            });

            let resultCount = 0;
            let updatedCount = 0;

            if (type === 'billing') {
                // Lógica de Faturamento Diário (Transactions)
                const patientCache = new Map<string, string>(); // Cache para evitar múltiplas consultas ao mesmo paciente
                const validTransactions: any[] = [];

                for (const row of data) {
                    const cleanRow: any = {};
                    for (const key in row) {
                        const normalizedKey = normalizeKey(key);
                        cleanRow[normalizedKey] = row[key];
                    }

                    const parseCurrency = (val: any) => {
                        if (typeof val === 'number') return val;
                        if (!val || typeof val !== 'string') return 0;
                        let clean = val.replace(/R\$\s?/, '').trim();
                        if (clean.includes(',') && clean.includes('.')) clean = clean.replace(/\./g, '').replace(',', '.');
                        else if (clean.includes(',')) clean = clean.replace(',', '.');
                        const parsed = parseFloat(clean);
                        return isNaN(parsed) ? 0 : parsed;
                    };

                    const valorRaw = cleanRow['PRECO DE VENDA'] || cleanRow['PRECO- TABELA'] || cleanRow['PRECO'] || cleanRow['VALOR'] || cleanRow['VALOR TOTAL'] || cleanRow['VALOR BRUTO'] || 0;
                    const valor = Math.abs(parseCurrency(valorRaw));
                    if (valor <= 0) continue;

                    const valorLiquidoRaw = cleanRow['VALOR LIQUIDO'] || cleanRow['LIQUIDO'] || cleanRow['VALOR RECEBIDO'] || valorRaw;
                    const valorLiquido = Math.abs(parseCurrency(valorLiquidoRaw));

                    const pacienteNome = (cleanRow['PACIENTE'] || cleanRow['NOME'] || cleanRow['CLIENTE'] || cleanRow['NOME DO PACIENTE'] || '').trim();
                    if (!pacienteNome) continue;

                    // 1. Vincular ou Criar Paciente antes da Transação
                    let patientId = patientCache.get(pacienteNome.toLowerCase());

                    if (!patientId) {
                        let patient = await prisma.patient.findFirst({
                            where: {
                                clinicId,
                                fullName: { equals: pacienteNome, mode: 'insensitive' }
                            }
                        });

                        if (!patient) {
                            console.log(`DEBUG: Criando paciente novo durante importação de faturamento: ${pacienteNome}`);
                            patient = await prisma.patient.create({
                                data: {
                                    fullName: pacienteNome,
                                    clinicId,
                                }
                            });
                        }
                        patientId = patient.id;
                        patientCache.set(pacienteNome.toLowerCase(), patientId);
                    }

                    let date = new Date();
                    const dataRaw = cleanRow['DATA DA VENDA'] || cleanRow['DATA'] || cleanRow['DATA PROCEDIMENTO'];
                    if (dataRaw) {
                        if (typeof dataRaw === 'number') {
                            date = new Date(Math.round((dataRaw - 25569) * 86400 * 1000));
                        } else {
                            const parsed = new Date(dataRaw);
                            if (!isNaN(parsed.getTime())) date = parsed;
                        }
                    }

                    const procedimento = cleanRow['PROCEDIMENTO'] || cleanRow['SERVICO'] || cleanRow['DESCRICAO'] || 'Procedimento não informado';
                    const medico = cleanRow['MEDICO SOLICITANTE'] || cleanRow['MEDICO'] || cleanRow['DOUTOR'] || cleanRow['PROFISSIONAL'] || '';
                    const descricao = `${procedimento} - ${pacienteNome}${medico ? ` (${medico})` : ''}`;

                    validTransactions.push({
                        description: descricao,
                        amount: valor,
                        netAmount: valorLiquido,
                        type: 'INCOME',
                        status: 'PAID', // Definido como PAID para entrar no LTV
                        category: cleanRow['TIPO'] || 'Faturamento',
                        paymentMethod: cleanRow['FORMA DE PAGAMENTO'] || cleanRow['PAGAMENTO'] || 'Outros',
                        centerOfCost: 'Operacional',
                        procedureName: procedimento,
                        doctorName: medico,
                        patientId, // Vínculo essencial para o LTV
                        date: date,
                        clinicId: clinicId,
                        importBatchId: batch.id
                    });
                }

                if (validTransactions.length > 0) {
                    const result = await prisma.transaction.createMany({
                        data: validTransactions
                    });
                    resultCount = result.count;

                    // Atualizar o lote IMEDIATAMENTE
                    await prisma.importBatch.update({
                        where: { id: batch.id },
                        data: { recordCount: resultCount }
                    });

                    // GATILHO CRM (Reaproveitando os pacientes já carregados)
                    for (const t of validTransactions) {
                        try {
                            await TaskService.triggerFollowUp(clinicId, {
                                patientId: t.patientId,
                                procedureName: t.procedureName,
                                transactionDate: t.date
                            });
                        } catch (crmError) {
                            console.error(`ERROR: CRM trigger failed:`, crmError);
                        }
                    }
                }
            }
            else if (type === 'pricing') {
                // Lógica de Procedimentos Simplificada (TIPO, PROCEDIMENTO, DURAÇÃO, PRODUTO, TAREFA)
                for (const row of data) {
                    const cleanRow: any = {};
                    for (const key in row) {
                        cleanRow[key.trim().toUpperCase()] = row[key];
                    }

                    const name = cleanRow['PROCEDIMENTO'] || cleanRow['NOME'];
                    if (!name) continue;

                    const parseNumber = (val: any) => {
                        if (typeof val === 'number') return val;
                        if (!val || typeof val !== 'string') return 0;
                        let clean = val.replace(/R\$\s?/, '').replace('%', '').trim();
                        if (clean.includes(',') && clean.includes('.')) clean = clean.replace(/\./g, '').replace(',', '.');
                        else if (clean.includes(',')) clean = clean.replace(',', '.');
                        const parsed = parseFloat(clean);
                        return isNaN(parsed) ? 0 : parsed;
                    };

                    const category = cleanRow['TIPO'] || cleanRow['CATEGORIA'] || cleanRow['GRUPO'] || 'Geral';
                    const durationRaw = cleanRow['DURACAO'] || cleanRow['DURACAO'] || cleanRow['TEMPO'] || 30;
                    const duration = Number(durationRaw);
                    const productName = String(cleanRow['PRODUTO'] || '');
                    const taskCount = Number(cleanRow['TAREFA'] || 0);

                    const procedureData = {
                        name,
                        category,
                        durationMinutes: isNaN(duration) ? 30 : duration,
                        productName,
                        taskCount: isNaN(taskCount) ? 0 : taskCount,
                        followUpDays: isNaN(taskCount) ? null : taskCount, // O usuário confirmou que TAREFA = Dias de Retorno
                        clinicId
                    };

                    const existing = await prisma.procedure.findFirst({
                        where: { name, clinicId }
                    });

                    if (existing) {
                        await prisma.procedure.update({
                            where: { id: existing.id },
                            data: procedureData
                        });
                        updatedCount++;
                    } else {
                        await prisma.procedure.create({
                            data: { ...procedureData, importBatchId: batch.id }
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
                            data: { name, status, clinicId, importBatchId: batch.id }
                        });
                        resultCount++;
                    } else {
                        updatedCount++;
                    }
                }
            }

            await prisma.importBatch.update({
                where: { id: batch.id },
                data: { recordCount: resultCount }
            });

            return res.json({
                message: 'Processamento concluído',
                total: data.length,
                imported: resultCount,
                updated: updatedCount
            });

        } catch (error: any) {
            console.error('❌ ERRO CRÍTICO NA IMPORTAÇÃO:', error);
            // Retorna o erro detalhado para o frontend capturar
            return res.status(500).json({
                message: error.message || 'Erro interno no processamento da planilha',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                details: error.toString()
            });
        }
    }

    static async diagnoseDB(req: Request, res: Response) {
        try {
            const dbUrl = process.env.DATABASE_URL || '';
            // Máscara para o hostname
            const hostname = dbUrl.split('@')[1]?.split(':')[0] || 'Hostname não encontrado';
            return res.json({
                status: 'online',
                db_hostname: hostname,
                message: 'Verifique se este hostname coincide com o do seu Supabase atual.'
            });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async listImportBatches(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId;
            if (!clinicId) return res.status(401).json({ message: 'Clínica não identificada' });

            const batches = await prisma.importBatch.findMany({
                where: { clinicId },
                orderBy: { createdAt: 'desc' }
            });

            return res.json(batches);
        } catch (error: any) {
            console.error('Erro ao listar lotes:', error);
            return res.status(500).json({ message: 'Erro ao listar histórico de importações' });
        }
    }

    static async deleteImportBatch(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId;
            const { batchId } = req.params;

            if (!clinicId) return res.status(401).json({ message: 'Clínica não identificada' });

            const batch = await prisma.importBatch.findUnique({
                where: { id: batchId, clinicId }
            });

            if (!batch) return res.status(404).json({ message: 'Lote não encontrado' });

            // Rollback: Deletar todos os registros vinculados a este lote
            // O onDelete: Cascade lidará com agendamentos/evoluções dos pacientes automaticamente no banco se configurado,
            // ou podemos fazer manual se necessário. No schema configuramos Cascade para relations se possível.

            await prisma.$transaction([
                prisma.patient.deleteMany({ where: { importBatchId: batchId, clinicId } }),
                prisma.transaction.deleteMany({ where: { importBatchId: batchId, clinicId } }),
                prisma.procedure.deleteMany({ where: { importBatchId: batchId, clinicId } }),
                prisma.equipment.deleteMany({ where: { importBatchId: batchId, clinicId } }),
                prisma.inventoryItem.deleteMany({ where: { importBatchId: batchId, clinicId } }),
                prisma.importBatch.delete({ where: { id: batchId } })
            ]);

            return res.json({ message: 'Rollback concluído com sucesso!' });

        } catch (error: any) {
            console.error('Erro no rollback:', error);
            return res.status(500).json({ message: 'Erro ao processar rollback da importação' });
        }
    }

    static async importPayables(req: Request, res: Response) {
        console.log('📥 Iniciando importPayables...');
        try {
            const clinicId = (req as any).user?.clinicId;
            console.log('🏥 ClinicId:', clinicId);
            if (!clinicId) return res.status(401).json({ message: 'Clínica não identificada' });

            if (!(req as any).file) {
                console.log('❌ Nenhum arquivo no request.file');
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            console.log('📂 Arquivo recebido:', (req as any).file.originalname, 'Size:', (req as any).file.size);

            const workbook = xlsx.read((req as any).file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

            console.log('📊 Linhas extraídas:', data.length);
            if (data.length === 0) return res.status(400).json({ message: 'Planilha vazia' });

            // 1. Criar Lote de Importação
            const batch = await prisma.importBatch.create({
                data: {
                    clinicId,
                    module: 'CONTAS_A_PAGAR' as any,
                    fileName: (req as any).file.originalname,
                    recordCount: 0
                }
            });

            // 2. Buscar Dados da Clínica para Validação de Segurança
            const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
            const clinicCNPJ = clinic?.cnpj?.replace(/\D/g, '');

            let successCount = 0;
            const errorLogs: any[] = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const cleanRow: any = {};

                // Limpeza agressiva de chaves (Trim + Upper)
                for (const key in row) {
                    cleanRow[key.trim().toUpperCase()] = row[key];
                }

                try {
                    // Validação de Segurança (CNPJ / Empresa)
                    const rowCNPJ = String(cleanRow['CNPJ'] || '').replace(/\D/g, '');
                    const rowEmpresa = String(cleanRow['EMPRESA'] || '').trim().toUpperCase();
                    const clinicName = clinic?.name.trim().toUpperCase();

                    // Se houver CNPJ na planilha e ele não bater com o da clínica, bloqueia (ponto 3.1)
                    if (rowCNPJ && clinicCNPJ && rowCNPJ !== clinicCNPJ) {
                        throw new Error(`Segurança: O CNPJ da linha (${rowCNPJ}) não coincide com o CNPJ da clínica (${clinicCNPJ}).`);
                    }

                    // Mapeamento de Status
                    let status = 'PENDENTE';
                    const statusRaw = String(cleanRow['STATUS'] || '').toUpperCase().trim();
                    if (statusRaw === 'EFETUADO' || statusRaw === 'PAGO') status = 'PAGO';
                    else if (statusRaw === 'A LANÇAR') status = 'PENDENTE';

                    // Parse de Datas
                    const dueDateRaw = cleanRow['VENCIMENTO'];
                    const paymentDateRaw = cleanRow['DATA DO PAGAMENTO'];

                    const parseDate = (val: any) => {
                        if (!val) return null;
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? null : d;
                    };

                    const dueDate = parseDate(dueDateRaw);
                    if (!dueDate) throw new Error('Data de Vencimento inválida ou ausente.');

                    const paymentDate = parseDate(paymentDateRaw);

                    // Parse de Valor
                    const parseCurrency = (val: any) => {
                        if (typeof val === 'number') return val;
                        if (!val || typeof val !== 'string') return 0;
                        let clean = val.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.').trim();
                        const parsed = parseFloat(clean);
                        return isNaN(parsed) ? 0 : parsed;
                    };

                    const amountRaw = cleanRow['VALOR (R$)'] || cleanRow['VALOR'] || 0;
                    const amount = parseCurrency(amountRaw);
                    if (amount <= 0) throw new Error('O valor da conta deve ser maior que zero.');

                    // Criar Contas a Pagar
                    const account = await prisma.accountPayable.create({
                        data: {
                            clinicId,
                            importBatchId: batch.id,
                            description: String(cleanRow['DESCRIÇÃO'] || cleanRow['DESCRICAO'] || 'Importação Contas a Pagar').trim(),
                            totalAmount: amount,
                            status,
                            dueDate,
                            paymentDate,
                            paymentMethod: String(cleanRow['TIPO DO PAGAMENTO'] || cleanRow['FORMA DE PAGAMENTO'] || 'Outros').trim(),
                            expenseType: String(cleanRow['TIPO DE DESPESA'] || 'FIXA').trim().toUpperCase(),
                            category: String(cleanRow['CLASSIFICAÇÃO'] || cleanRow['CLASSIFICACAO'] || 'Geral').trim(),
                            payee: String(cleanRow['FAVORECIDO/BENEFICIÁRIO'] || cleanRow['FAVORECIDO'] || cleanRow['BENEFICIARIO'] || 'Não informado').trim(),
                            notes: String(cleanRow['OBSERVAÇÃO NF - BOLETO'] || cleanRow['OBSERVACAO'] || '').trim(),
                            costCenter: String(cleanRow['CLASSIFICAÇÃO'] || 'Operacional').trim(),
                            costType: String(cleanRow['TIPO DE DESPESA'] || 'FIXA').trim().toUpperCase(),
                        }
                    });

                    // CRIAR PARCELA ÚNICA (Importante para visualização no front v14.0)
                    await prisma.accountPayableInstallment.create({
                        data: {
                            accountPayableId: account.id,
                            installmentNumber: 1,
                            amount: amount,
                            dueDate,
                            status,
                            paidAt: status === 'PAGO' ? (paymentDate || dueDate) : null,
                            paymentMethod: String(cleanRow['TIPO DO PAGAMENTO'] || cleanRow['FORMA DE PAGAMENTO'] || 'Outros').trim(),
                        }
                    });

                    successCount++;
                } catch (err: any) {
                    errorLogs.push({
                        importBatchId: batch.id,
                        rowNumber: i + 1,
                        rowData: row,
                        errorMessage: err.message || 'Erro desconhecido ao processar linha'
                    });
                }
            }

            // 3. Registrar Log de Erros (se houver)
            if (errorLogs.length > 0) {
                await prisma.importErrorLog.createMany({ data: errorLogs });
            }

            // 4. Atualizar Contagem de Sucesso no Lote
            await prisma.importBatch.update({
                where: { id: batch.id },
                data: { recordCount: successCount }
            });

            return res.json({
                message: 'Processamento concluído',
                totalRows: data.length,
                successCount,
                errorCount: errorLogs.length,
                batchId: batch.id
            });

        } catch (error: any) {
            console.error('Erro na importação de Contas a Pagar:', error);
            return res.status(500).json({ message: 'Erro interno ao processar planilha', error: error.message });
        }
    }
}
