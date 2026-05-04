/**
 * ExecucaoController — Registro de execução de procedimentos com baixa automática de estoque
 */
import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditLogger.js';
import { Decimal } from '@prisma/client/runtime/library';

export class ExecucaoController {

    // ═══ LISTAR EXECUÇÕES ═══
    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { pacienteId, page = 1, limit = 50 } = req.query;

            const where: any = {
                contaItem: {
                    conta: { clinicId }
                }
            };
            if (pacienteId) where.pacienteId = pacienteId;

            const [items, total] = await Promise.all([
                prisma.execucaoProcedimentoV2.findMany({
                    where,
                    include: {
                        contaItem: {
                            include: { procedimento: { select: { name: true, category: true } } }
                        },
                        baixasEstoque: {
                            include: { execucao: false } // evita recursao pesada
                        }
                    },
                    orderBy: { dataExecucao: 'desc' },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit)
                }),
                prisma.execucaoProcedimentoV2.count({ where })
            ]);

            return res.json({ items, total, page: Number(page), limit: Number(limit) });
        } catch (error: any) {
            console.error('[EXECUCAO] Erro ao listar:', error);
            return res.status(500).json({ error: 'Erro ao listar execuções' });
        }
    }

    // ═══ REGISTRAR EXECUÇÃO (Atômico) ═══
    static async executar(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { contaItemId, profissionalId, dataExecucao, observacoes, insumosEditados } = req.body;

            if (!contaItemId || !profissionalId) {
                return res.status(400).json({ error: 'contaItemId e profissionalId são obrigatórios' });
            }

            const item = await prisma.contaPacienteItem.findFirst({
                where: { id: contaItemId, conta: { clinicId } },
                include: { conta: true }
            });

            if (!item) return res.status(404).json({ error: 'Item de conta não encontrado' });
            if (item.quantidadeExecutada >= item.quantidade) {
                return res.status(400).json({ error: 'Este procedimento já foi totalmente executado nesta conta' });
            }

            // Buscar insumos padrão do procedimento
            const insumosPadrao = await prisma.procedimentoInsumo.findMany({
                where: { procedimentoId: item.procedimentoId },
                include: { itemEstoque: true }
            });

            // Mesclar insumos padrão com edições pontuais feitas pelo usuário na tela
            const consumos = insumosPadrao.map(insumo => {
                const editado = insumosEditados?.find((e: any) => e.itemEstoqueId === insumo.itemEstoqueId);
                return {
                    itemEstoqueId: insumo.itemEstoqueId,
                    quantidade: editado !== undefined ? Number(editado.quantidade) : Number(insumo.quantidadePadrao),
                    custoUnitario: Number(insumo.itemEstoque.unitCost || 0)
                };
            }).filter(c => c.quantidade > 0);

            const result = await prisma.$transaction(async (tx) => {
                // 1. Criar a execução
                const execucao = await tx.execucaoProcedimentoV2.create({
                    data: {
                        contaItemId,
                        pacienteId: item.conta.pacienteId,
                        procedimentoId: item.procedimentoId,
                        profissionalId,
                        dataExecucao: dataExecucao ? new Date(dataExecucao) : new Date(),
                        observacoes,
                        registradoPor: userId
                    }
                });

                // 2. Incrementar quantidade executada
                await tx.contaPacienteItem.update({
                    where: { id: contaItemId },
                    data: { quantidadeExecutada: { increment: 1 } }
                });

                // 3. Dar baixa no estoque
                for (const consumo of consumos) {
                    // Checar saldo
                    const estoque = await tx.inventoryItem.findFirst({
                        where: { id: consumo.itemEstoqueId, clinicId }
                    });
                    
                    if (estoque) {
                        const novoSaldo = Number(estoque.currentStock) - consumo.quantidade;
                        
                        await tx.inventoryItem.update({
                            where: { id: estoque.id },
                            data: { currentStock: novoSaldo }
                        });

                        await tx.stockMovement.create({
                            data: {
                                itemId: estoque.id,
                                clinicId,
                                type: 'OUT',
                                quantity: consumo.quantidade,
                                reason: `Baixa automática. Execução: ${execucao.id}`,
                                userId: userId
                            }
                        });

                        await tx.baixaEstoqueExecucao.create({
                            data: {
                                execucaoId: execucao.id,
                                itemEstoqueId: estoque.id,
                                quantidade: consumo.quantidade,
                                custoUnitario: consumo.custoUnitario,
                                custoTotal: consumo.quantidade * consumo.custoUnitario
                            }
                        });
                    }
                }

                return execucao;
            });

            await createAuditLog({
                action: 'CREATE', userId, req, clinicId,
                entity: 'ExecucaoProcedimentoV2', entityId: result.id,
                newValues: { contaItemId, consumos }
            });

            return res.json({ message: 'Execução registrada com sucesso', execucao: result });
        } catch (error: any) {
            console.error('[EXECUCAO] Erro:', error);
            return res.status(500).json({ error: error.message || 'Erro ao registrar execução' });
        }
    }
}
