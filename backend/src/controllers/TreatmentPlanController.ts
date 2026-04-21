import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import PDFDocument from 'pdfkit';

export class TreatmentPlanController {
    // Listar planos de tratamento do paciente
    static async list(req: any, res: Response) {
        try {
            const clinicId = req.clinicId || (req as any).user?.clinicId;
            const { patientId } = req.query;

            if (!patientId) return res.status(400).json({ error: 'Patient ID is required' });

            const plans = await prisma.treatmentPlan.findMany({
                where: {
                    clinicId,
                    patientId: String(patientId)
                },
                include: {
                    items: {
                        include: {
                            procedure: true,
                            executedBy: { select: { id: true, name: true } }
                        }
                    },
                    receivables: true
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json(plans);
        } catch (error: any) {
            console.error('Error listing treatment plans:', error);
            res.status(500).json({ error: 'Erro ao listar planos de tratamento' });
        }
    }

    // Criar um novo orçamento (Status: DRAFT)
    static async create(req: any, res: Response) {
        try {
            const clinicId = req.clinicId || (req as any).user?.clinicId;
            const { patientId, items, totalAmount, notes } = req.body;

            const plan = await prisma.treatmentPlan.create({
                data: {
                    patientId,
                    clinicId,
                    totalAmount: parseFloat(totalAmount),
                    notes,
                    status: 'DRAFT',
                    items: {
                        create: items.map((item: any) => ({
                            procedureId: item.procedureId,
                            procedureName: item.name,
                            unitValue: parseFloat(item.unitValue),
                            discount: parseFloat(item.discount || 0),
                            finalValue: parseFloat(item.finalValue),
                            status: 'PENDING'
                        }))
                    }
                },
                include: { items: true }
            });

            res.status(201).json(plan);
        } catch (error: any) {
            console.error('Error creating treatment plan:', error);
            res.status(500).json({ error: 'Erro ao criar plano de tratamento' });
        }
    }

    // Aprovar orçamento e gerar financeiro
    static async approve(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { installments } = req.body; // Array de { amount, dueDate, paymentMethod }
            const clinicId = req.clinicId || (req as any).user?.clinicId;

            const plan = await prisma.treatmentPlan.findUnique({
                where: { id, clinicId },
                include: { patient: true }
            });

            if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });

            // Transação Atômica: Muda status + Cria Recebíveis
            const updatedPlan = await prisma.$transaction(async (tx) => {
                const updated = await tx.treatmentPlan.update({
                    where: { id },
                    data: { status: 'APPROVED' }
                });

                // Criar registros em AccountReceivable
                if (installments && Array.isArray(installments)) {
                    for (let i = 0; i < installments.length; i++) {
                        const inst = installments[i];
                        await tx.accountReceivable.create({
                            data: {
                                clinicId,
                                patientId: plan.patientId,
                                treatmentPlanId: plan.id,
                                description: `Parcela ${i + 1}/${installments.length} - Plano #${plan.id.slice(0, 8)}`,
                                amount: parseFloat(inst.amount),
                                dueDate: new Date(inst.dueDate),
                                status: 'PENDENTE',
                                paymentMethod: inst.paymentMethod,
                                installmentNumber: i + 1
                            }
                        });
                    }
                }

                return updated;
            });

            res.json(updatedPlan);
        } catch (error: any) {
            console.error('Error approving treatment plan:', error);
            res.status(500).json({ error: 'Erro ao aprovar plano de tratamento' });
        }
    }

    // Marcar item como executado e baixar estoque
    static async executeItem(req: any, res: Response) {
        try {
            const { itemId } = req.params;
            const { professionalId } = req.body;
            const clinicId = req.clinicId || (req as any).user?.clinicId;

            const item = await prisma.treatmentItem.findUnique({
                where: { id: itemId },
                include: { 
                    treatmentPlan: true,
                    procedure: {
                        include: { supplies: true }
                    }
                }
            });

            if (!item || item.treatmentPlan.clinicId !== clinicId) {
                return res.status(404).json({ error: 'Item não encontrado' });
            }

            if (item.status === 'EXECUTED') {
                return res.status(400).json({ error: 'Item já executado' });
            }

            // Transação Atômica: Atualizar Item + Baixa de Estoque
            await prisma.$transaction(async (tx) => {
                // 1. Atualizar Status do Item
                await tx.treatmentItem.update({
                    where: { id: itemId },
                    data: {
                        status: 'EXECUTED',
                        executedAt: new Date(),
                        executedById: professionalId
                    }
                });

                // 2. Baixa de Estoque dos Insumos (supplies)
                for (const supply of item.procedure.supplies) {
                    const inventoryItem = await tx.inventoryItem.findFirst({
                        where: { name: supply.name, clinicId }
                    });

                    if (inventoryItem) {
                        // Registrar Movimentação
                        await tx.stockMovement.create({
                            data: {
                                clinicId,
                                itemId: inventoryItem.id,
                                type: 'OUT',
                                quantity: supply.quantity,
                                reason: `Execução clínica: ${item.procedureName} (Plano #${item.treatmentPlanId.slice(0, 8)})`
                            }
                        });

                        // Atualizar Saldo
                        await tx.inventoryItem.update({
                            where: { id: inventoryItem.id },
                            data: {
                                currentStock: { decrement: supply.quantity }
                            }
                        });
                    }
                }
            });

            res.json({ message: 'Item marcado como executado com sucesso' });
        } catch (error: any) {
            console.error('Error executing treatment item:', error);
            res.status(500).json({ error: 'Erro ao marcar item como executado' });
        }
    }

    // Gerar PDF do Orçamento
    static async generatePDF(req: any, res: Response) {
        try {
            const { id } = req.params;
            const clinicId = req.clinicId || (req as any).user?.clinicId;

            const plan = await prisma.treatmentPlan.findUnique({
                where: { id, clinicId },
                include: {
                    patient: true,
                    clinic: true,
                    items: true
                }
            });

            if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            
            // Configurar cabeçalho da resposta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=orcamento_${plan.id.slice(0, 8)}.pdf`);
            
            doc.pipe(res);

            // Cores da Identidade Visual (Baseado no Rares360)
            const primaryColor = plan.clinic.corMarca || '#8A9A5B';
            const secondaryColor = '#697D58';
            const textColor = '#334155';

            // --- CABEÇALHO ---
            doc.fillColor(primaryColor)
               .fontSize(20)
               .font('Helvetica-Bold')
               .text('PLANO DE TRATAMENTO', { align: 'right' });
            
            doc.fillColor(textColor)
               .fontSize(10)
               .font('Helvetica')
               .text(`Data: ${new Date(plan.createdAt).toLocaleDateString('pt-BR')}`, { align: 'right' });
            
            doc.moveDown();

            // Dados da Clínica
            doc.fontSize(12).font('Helvetica-Bold').text(plan.clinic.name);
            doc.fontSize(10).font('Helvetica').text(`CNPJ: ${plan.clinic.cnpj || 'N/A'}`);
            doc.text(`${plan.clinic.cidade} - ${plan.clinic.estado}`);
            doc.moveDown(2);

            // Dados do Paciente
            doc.rect(50, doc.y, 495, 40).fill('#F8FAFC');
            doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('PACIENTE', 60, doc.y + 10);
            doc.fillColor(textColor).fontSize(12).text(plan.patient.fullName, 60, doc.y + 2);
            doc.moveDown(3);

            // --- TABELA DE ITENS ---
            const tableTop = doc.y;
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10);
            doc.text('PROCEDIMENTO', 60, tableTop);
            doc.text('QTDE', 300, tableTop);
            doc.text('VALOR UNIT.', 360, tableTop);
            doc.text('TOTAL', 480, tableTop);

            doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#E2E8F0').stroke();

            let currentY = tableTop + 25;
            doc.font('Helvetica').fillColor(textColor);

            plan.items.forEach(item => {
                doc.text(item.procedureName, 60, currentY);
                doc.text('1', 300, currentY);
                doc.text(item.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 360, currentY);
                doc.text(item.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 480, currentY);
                currentY += 20;

                if (currentY > 700) { doc.addPage(); currentY = 50; }
            });

            doc.moveTo(50, currentY).lineTo(545, currentY).stroke('#E2E8F0');
            currentY += 15;

            // --- TOTAIS ---
            doc.font('Helvetica-Bold').fontSize(14);
            doc.text(`VALOR TOTAL: ${plan.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 350, currentY, { align: 'right' });
            
            doc.moveDown(3);

            // --- RODAPÉ ---
            if (plan.notes) {
                doc.fontSize(10).font('Helvetica-Bold').text('OBSERVAÇÕES:', 60);
                doc.font('Helvetica').text(plan.notes, 60);
            }

            doc.fontSize(8)
               .fillColor('#94A3B8')
               .text('Este documento é um orçamento válido por 15 dias.', 50, 780, { align: 'center' });

            doc.end();
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ error: 'Erro ao gerar PDF' });
        }
    }

    // Receber pagamento de uma parcela
    static async receivePayment(req: any, res: Response) {
        try {
            const { id } = req.params;
            const clinicId = req.clinicId || (req as any).user?.clinicId;

            const receivable = await prisma.accountReceivable.findUnique({
                where: { id, clinicId },
                include: { patient: true }
            });

            if (!receivable) return res.status(404).json({ error: 'Título não encontrado' });

            if (receivable.status === 'RECEBIDO') {
                return res.status(400).json({ error: 'Título já liquidado' });
            }

            // Mudar status e Integrar com Fluxo de Caixa (Transaction)
            await prisma.$transaction(async (tx) => {
                await tx.accountReceivable.update({
                    where: { id },
                    data: { status: 'RECEBIDO' }
                });

                // Criar Transaction de INCOME
                await tx.transaction.create({
                    data: {
                        clinicId,
                        patientId: receivable.patientId,
                        description: `Pagamento recebido: ${receivable.description}`,
                        amount: receivable.amount,
                        netAmount: receivable.amount,
                        type: 'INCOME',
                        status: 'PAID',
                        category: 'Procedimentos',
                        paymentMethod: receivable.paymentMethod || 'Outros',
                        date: new Date(),
                        dueDate: receivable.dueDate,
                        isExecuted: true
                    }
                });
            });

            res.json({ message: 'Pagamento recebido com sucesso' });
        } catch (error: any) {
            console.error('Error receiving payment:', error);
            res.status(500).json({ error: 'Erro ao processar recebimento' });
        }
    }
}
