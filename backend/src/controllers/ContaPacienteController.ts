/**
 * ContaPacienteController — Listagem, detalhes e pagamento de parcelas
 */
import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditLogger.js';
import { Decimal } from '@prisma/client/runtime/library';

export class ContaPacienteController {

    // ═══ LISTAR ═══
    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { status, pacienteId, page = 1, limit = 20 } = req.query;

            const where: any = { clinicId };
            if (status) where.status = status;
            if (pacienteId) where.pacienteId = pacienteId;

            const [items, total] = await Promise.all([
                prisma.contaPaciente.findMany({
                    where,
                    include: {
                        paciente: { select: { id: true, fullName: true, phone: true } },
                        formaPagamento: { select: { nome: true, tipo: true } },
                        _count: { select: { itens: true, parcelasFinanc: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit)
                }),
                prisma.contaPaciente.count({ where })
            ]);

            return res.json({ items, total, page: Number(page), limit: Number(limit) });
        } catch (error: any) {
            console.error('[CONTA_PACIENTE] Erro ao listar:', error);
            return res.status(500).json({ error: 'Erro ao listar contas' });
        }
    }

    // ═══ DETALHES ═══
    static async getById(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { id } = req.params;

            const conta = await prisma.contaPaciente.findFirst({
                where: { id, clinicId },
                include: {
                    paciente: { select: { id: true, fullName: true, phone: true, email: true } },
                    formaPagamento: true,
                    itens: {
                        include: {
                            procedimento: { select: { id: true, name: true, category: true } },
                            execucoes: true
                        }
                    },
                    parcelasFinanc: { orderBy: { numeroParcela: 'asc' } },
                    documentos: true,
                    orcamento: { select: { numero: true } }
                }
            });
            if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });

            return res.json(conta);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar conta' });
        }
    }

    // ═══ PAGAR PARCELA ═══
    static async pagarParcela(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { contaId, parcelaId } = req.params;

            const conta = await prisma.contaPaciente.findFirst({ where: { id: contaId, clinicId } });
            if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });

            const result = await prisma.$transaction(async (tx) => {
                const parcela = await tx.parcelaContaPaciente.findFirst({
                    where: { id: parcelaId, contaId }
                });
                if (!parcela) throw new Error('Parcela não encontrada');
                if (parcela.pago) throw new Error('Parcela já paga');

                // Marcar parcela como paga
                await tx.parcelaContaPaciente.update({
                    where: { id: parcelaId },
                    data: { pago: true, pagoEm: new Date() }
                });

                // Atualizar valor pago e saldo devedor
                const novoValorPago = new Decimal(Number(conta.valorPago)).add(parcela.valorParcela);
                const novoSaldo = new Decimal(Number(conta.valorTotal)).sub(novoValorPago);

                // Verificar se todas parcelas estão pagas
                const pendentes = await tx.parcelaContaPaciente.count({
                    where: { contaId, pago: false, id: { not: parcelaId } }
                });
                const novoStatus = pendentes === 0 ? 'PAGA' : 'ABERTA';

                await tx.contaPaciente.update({
                    where: { id: contaId },
                    data: {
                        valorPago: novoValorPago,
                        saldoDevedor: novoSaldo.lessThan(0) ? new Decimal(0) : novoSaldo,
                        status: novoStatus
                    }
                });

                return { novoStatus, valorPago: Number(novoValorPago) };
            });

            await createAuditLog({
                action: 'UPDATE', userId, req, clinicId,
                entity: 'ContaPaciente', entityId: contaId,
                newValues: { parcelaId, ...result }
            });

            return res.json({ message: 'Parcela paga com sucesso', ...result });
        } catch (error: any) {
            console.error('[CONTA_PACIENTE] Erro ao pagar parcela:', error);
            return res.status(500).json({ error: error.message || 'Erro ao pagar parcela' });
        }
    }

    // ═══ KPIs ═══
    static async kpis(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;

            const [abertas, pagas, canceladas] = await Promise.all([
                prisma.contaPaciente.aggregate({ where: { clinicId, status: 'ABERTA' }, _sum: { saldoDevedor: true }, _count: true }),
                prisma.contaPaciente.aggregate({ where: { clinicId, status: 'PAGA' }, _sum: { valorTotal: true }, _count: true }),
                prisma.contaPaciente.count({ where: { clinicId, status: 'CANCELADA' } }),
            ]);

            // Parcelas vencidas
            const vencidas = await prisma.parcelaContaPaciente.count({
                where: {
                    conta: { clinicId },
                    pago: false,
                    vencimento: { lt: new Date() }
                }
            });

            return res.json({
                abertas: abertas._count,
                saldoAReceber: Number(abertas._sum.saldoDevedor || 0),
                pagas: pagas._count,
                totalRecebido: Number(pagas._sum.valorTotal || 0),
                canceladas,
                parcelasVencidas: vencidas
            });
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar KPIs' });
        }
    }
}
