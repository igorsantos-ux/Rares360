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
    static async bulkImportPatients(req, res) {
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
            if (data.length === 0) {
                return res.status(400).json({ message: 'A planilha está vazia' });
            }
            let importedCount = 0;
            let updatedCount = 0;
            for (const row of data) {
                // Normalizar as chaves para facilitar o match (Case Insensitive e Trim)
                const cleanRow = {};
                for (const key in row) {
                    cleanRow[key.trim().toLowerCase()] = row[key];
                }
                const fullName = cleanRow['paciente'] || cleanRow['nome'] || cleanRow['nome completo'];
                if (!fullName)
                    continue;
                const cpf = cleanRow['cpf'] ? String(cleanRow['cpf']).replace(/\D/g, '') : null;
                const rg = cleanRow['rg'] ? String(cleanRow['rg']) : null;
                const email = cleanRow['e-mail'] || cleanRow['email'];
                const phone = cleanRow['celular'] || cleanRow['telefone'] || cleanRow['whatsapp'];
                const profession = cleanRow['profissão'] || cleanRow['profissao'] || cleanRow['cargo'];
                const gender = cleanRow['sexo'] || cleanRow['gênero'] || cleanRow['genero'];
                const maritalStatus = cleanRow['estado civil'];
                // Mapeamento de LeadSource (Origem + Indicação)
                const origin = cleanRow['origem'] || '';
                const indication = cleanRow['indicação'] || cleanRow['indicacao'] || '';
                const leadSource = [origin, indication].filter(Boolean).join(' / ');
                // Endereço concatenado
                const rua = cleanRow['endereço'] || cleanRow['endereco'] || '';
                const numero = cleanRow['número'] || cleanRow['numero'] || '';
                const bairro = cleanRow['bairro'] || '';
                const cidade = cleanRow['cidade'] || '';
                const estado = cleanRow['estado'] || '';
                const cep = cleanRow['cep'] || '';
                const addressParts = [rua, numero, bairro, cidade, estado, cep].filter(Boolean);
                const address = addressParts.length > 0 ? addressParts.join(', ') : null;
                // Nascimento
                let birthDate = null;
                const birthRaw = cleanRow['nascimento'] || cleanRow['data de nascimento'];
                if (birthRaw) {
                    if (typeof birthRaw === 'number') {
                        birthDate = new Date(Math.round((birthRaw - 25569) * 86400 * 1000));
                    }
                    else {
                        const parsedDate = new Date(birthRaw);
                        if (!isNaN(parsedDate.getTime())) {
                            birthDate = parsedDate;
                        }
                    }
                }
                const patientData = {
                    fullName,
                    rg,
                    cpf,
                    birthDate,
                    gender,
                    maritalStatus,
                    profession,
                    phone: phone ? String(phone) : null,
                    email: email ? String(email) : null,
                    address,
                    leadSource,
                    clinicId
                };
                // Lógica de Upsert baseada no CPF (se existir)
                if (cpf) {
                    const existingPatient = await prisma.patient.findFirst({
                        where: { cpf, clinicId }
                    });
                    if (existingPatient) {
                        await prisma.patient.update({
                            where: { id: existingPatient.id },
                            data: patientData
                        });
                        updatedCount++;
                    }
                    else {
                        await prisma.patient.create({
                            data: patientData
                        });
                        importedCount++;
                    }
                }
                else {
                    // Se não tem CPF, cria sempre
                    await prisma.patient.create({
                        data: patientData
                    });
                    importedCount++;
                }
            }
            return res.json({
                message: 'Processamento concluído',
                imported: importedCount,
                updated: updatedCount,
                total: data.length
            });
        }
        catch (error) {
            console.error('Erro na importação de pacientes:', error);
            return res.status(500).json({ message: 'Erro ao processar planilha de pacientes', error: error.message });
        }
    }
}
