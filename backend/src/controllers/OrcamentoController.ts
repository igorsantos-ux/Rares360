/**
 * OrcamentoController — CRUD + fluxo de status + aprovação atômica
 * Fluxo: RASCUNHO → ENVIADO → APROVADO (gera Contrato + Conta) | REJEITADO
 */
import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import { createAuditLog } from '../lib/auditLogger.js';

// Gera número sequencial: ORC-2026-00001
async function gerarNumero(clinicId: string, prefixo: string = 'ORC'): Promise<string> {
    const ano = new Date().getFullYear();
    const count = await prisma.orcamento.count({
        where: { clinicId, numero: { startsWith: `${prefixo}-${ano}` } }
    });
    return `${prefixo}-${ano}-${String(count + 1).padStart(5, '0')}`;
}

export class OrcamentoController {

    // ═══ LISTAR ═══
    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { status, pacienteId, page = 1, limit = 20 } = req.query;

            const where: any = { clinicId };
            if (status) where.status = status;
            if (pacienteId) where.pacienteId = pacienteId;

            const [items, total] = await Promise.all([
                prisma.orcamento.findMany({
                    where,
                    include: {
                        paciente: { select: { id: true, fullName: true, phone: true } },
                        formaPagamento: { select: { id: true, nome: true, tipo: true } },
                        itens: { include: { procedimento: { select: { name: true, category: true } } } },
                        _count: { select: { itens: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit)
                }),
                prisma.orcamento.count({ where })
            ]);

            return res.json({ items, total, page: Number(page), limit: Number(limit) });
        } catch (error: any) {
            console.error('[ORCAMENTO] Erro ao listar:', error);
            return res.status(500).json({ error: 'Erro ao listar orçamentos' });
        }
    }

    // ═══ DETALHES ═══
    static async getById(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { id } = req.params;

            const orc = await prisma.orcamento.findFirst({
                where: { id, clinicId },
                include: {
                    paciente: { select: { id: true, fullName: true, phone: true, email: true, cpf: true } },
                    formaPagamento: true,
                    itens: { include: { procedimento: { select: { id: true, name: true, category: true, basePrice: true } } } },
                    contrato: true,
                    contaPaciente: { include: { parcelasFinanc: true } }
                }
            });
            if (!orc) return res.status(404).json({ error: 'Orçamento não encontrado' });

            return res.json(orc);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar orçamento' });
        }
    }

    // ═══ CRIAR (Rascunho) ═══
    static async create(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const {
                pacienteId, formaPagamentoId, parcelas = 1,
                itens, observacoes, tipoDesconto = 'VALOR',
                valorDesconto = 0, validadeDias = 15
            } = req.body;

            if (!pacienteId || !formaPagamentoId || !itens?.length) {
                return res.status(400).json({ error: 'Paciente, forma de pagamento e pelo menos 1 item são obrigatórios' });
            }

            // Calcular totais
            let valorBruto = new Decimal(0);
            const itensProcessados = [];

            for (const item of itens) {
                const proc = await prisma.procedure.findFirst({
                    where: { id: item.procedimentoId, clinicId }
                });
                if (!proc) return res.status(400).json({ error: `Procedimento ${item.procedimentoId} não encontrado` });

                const valorUnit = new Decimal(item.valorUnitario || proc.basePrice || proc.currentPrice || 0);
                const qty = item.quantidade || 1;
                const descItem = new Decimal(item.desconto || 0);
                const valorTotal = valorUnit.mul(qty).sub(descItem);

                itensProcessados.push({
                    procedimentoId: item.procedimentoId,
                    quantidade: qty,
                    valorUnitario: valorUnit,
                    desconto: descItem,
                    valorTotal
                });
                valorBruto = valorBruto.add(valorTotal);
            }

            // Aplicar desconto global
            const descGlobal = new Decimal(valorDesconto);
            let valorLiquido: Decimal;
            if (tipoDesconto === 'PERCENTUAL') {
                valorLiquido = valorBruto.sub(valorBruto.mul(descGlobal).div(100));
            } else {
                valorLiquido = valorBruto.sub(descGlobal);
            }

            // Calcular taxas
            const forma = await prisma.formaPagamento.findFirst({ where: { id: formaPagamentoId, clinicId } });
            if (!forma) return res.status(400).json({ error: 'Forma de pagamento não encontrada' });

            const taxaPerc = Number(forma.taxaPercentual);
            const taxaFx = Number(forma.taxaFixa);
            const taxaAntecip = Number(forma.taxaAntecipacao);
            let taxaParcelaPerc = 0;
            if (forma.taxaPorParcela && parcelas > 1) {
                const mapa = forma.taxaPorParcela as Record<string, number>;
                taxaParcelaPerc = mapa[String(parcelas)] || 0;
            }

            const valLiq = Number(valorLiquido);
            const taxasTotal = new Decimal(
                (valLiq * taxaPerc / 100) + taxaFx + (valLiq * taxaAntecip / 100) + (valLiq * taxaParcelaPerc / 100)
            );
            const valorFinal = valorLiquido;

            const validoAte = new Date();
            validoAte.setDate(validoAte.getDate() + validadeDias);

            const numero = await gerarNumero(clinicId);

            const orcamento = await prisma.orcamento.create({
                data: {
                    clinicId, numero, pacienteId, formaPagamentoId, parcelas,
                    valorBruto, valorDesconto: descGlobal, tipoDesconto,
                    valorLiquido, taxasTotal, valorFinal,
                    observacoes, validadeDias, validoAte, status: 'RASCUNHO',
                    itens: { create: itensProcessados }
                },
                include: {
                    paciente: { select: { fullName: true } },
                    itens: { include: { procedimento: { select: { name: true } } } }
                }
            });

            await createAuditLog({
                action: 'CREATE', userId, req, clinicId,
                entity: 'Orcamento', entityId: orcamento.id,
                newValues: { numero, pacienteId, valorFinal: Number(valorFinal) }
            });

            return res.status(201).json(orcamento);
        } catch (error: any) {
            console.error('[ORCAMENTO] Erro ao criar:', error);
            return res.status(500).json({ error: 'Erro ao criar orçamento' });
        }
    }

    // ═══ ATUALIZAR (só RASCUNHO) ═══
    static async update(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { id } = req.params;

            const existing = await prisma.orcamento.findFirst({ where: { id, clinicId } });
            if (!existing) return res.status(404).json({ error: 'Orçamento não encontrado' });
            if (existing.status !== 'RASCUNHO') {
                return res.status(400).json({ error: 'Apenas orçamentos em rascunho podem ser editados' });
            }

            const { observacoes, validadeDias } = req.body;
            const data: any = {};
            if (observacoes !== undefined) data.observacoes = observacoes;
            if (validadeDias !== undefined) {
                data.validadeDias = validadeDias;
                const validoAte = new Date();
                validoAte.setDate(validoAte.getDate() + validadeDias);
                data.validoAte = validoAte;
            }

            const updated = await prisma.orcamento.update({ where: { id }, data });
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao atualizar orçamento' });
        }
    }

    // ═══ ENVIAR ═══
    static async enviar(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { id } = req.params;

            const orc = await prisma.orcamento.findFirst({ where: { id, clinicId } });
            if (!orc) return res.status(404).json({ error: 'Orçamento não encontrado' });
            if (orc.status !== 'RASCUNHO') return res.status(400).json({ error: 'Apenas rascunhos podem ser enviados' });

            const updated = await prisma.orcamento.update({
                where: { id }, data: { status: 'ENVIADO' }
            });

            await createAuditLog({
                action: 'UPDATE', userId, req, clinicId,
                entity: 'Orcamento', entityId: id,
                newValues: { status: 'ENVIADO' }
            });

            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao enviar orçamento' });
        }
    }

    // ═══ REJEITAR ═══
    static async rejeitar(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { id } = req.params;

            const orc = await prisma.orcamento.findFirst({ where: { id, clinicId } });
            if (!orc) return res.status(404).json({ error: 'Orçamento não encontrado' });
            if (!['RASCUNHO', 'ENVIADO'].includes(orc.status)) {
                return res.status(400).json({ error: 'Orçamento não pode ser rejeitado neste status' });
            }

            const updated = await prisma.orcamento.update({
                where: { id }, data: { status: 'REJEITADO' }
            });

            await createAuditLog({
                action: 'UPDATE', userId, req, clinicId,
                entity: 'Orcamento', entityId: id,
                newValues: { status: 'REJEITADO' }
            });

            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao rejeitar orçamento' });
        }
    }

    // ═══ APROVAR (Transação Atômica) ═══
    // Cria: Contrato + ContaPaciente + Parcelas + Atualiza status
    static async aprovar(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { id } = req.params;

            const orc = await prisma.orcamento.findFirst({
                where: { id, clinicId },
                include: { itens: true, paciente: { select: { fullName: true } }, formaPagamento: true }
            });
            if (!orc) return res.status(404).json({ error: 'Orçamento não encontrado' });
            if (!['RASCUNHO', 'ENVIADO'].includes(orc.status)) {
                return res.status(400).json({ error: 'Orçamento não pode ser aprovado neste status' });
            }

            const result = await prisma.$transaction(async (tx) => {
                // 1. Gerar número do contrato
                const anoContrato = new Date().getFullYear();
                const countContrato = await tx.contrato.count({
                    where: { clinicId, numero: { startsWith: `CONTR-${anoContrato}` } }
                });
                const numContrato = `CONTR-${anoContrato}-${String(countContrato + 1).padStart(5, '0')}`;

                // 2. Gerar HTML do contrato
                const htmlContrato = `<html><body>
                    <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
                    <p><strong>Contrato:</strong> ${numContrato}</p>
                    <p><strong>Orçamento:</strong> ${orc.numero}</p>
                    <p><strong>Paciente:</strong> ${orc.paciente.fullName}</p>
                    <p><strong>Valor:</strong> R$ ${Number(orc.valorFinal).toFixed(2)}</p>
                    <p><strong>Parcelas:</strong> ${orc.parcelas}x</p>
                    <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                    <h2>Procedimentos</h2>
                    <ul>${orc.itens.map(i => `<li>${i.quantidade}x - R$ ${Number(i.valorTotal).toFixed(2)}</li>`).join('')}</ul>
                </body></html>`;

                // 3. Criar contrato (PDF será gerado via serviço separado)
                const contrato = await tx.contrato.create({
                    data: {
                        clinicId, orcamentoId: id, numero: numContrato,
                        pdfUrl: '', pdfHash: 'pending',
                        conteudoHTML: htmlContrato, geradoPor: userId
                    }
                });

                // 4. Gerar número da conta
                const anoConta = new Date().getFullYear();
                const countConta = await tx.contaPaciente.count({
                    where: { clinicId, numero: { startsWith: `CT-${anoConta}` } }
                });
                const numConta = `CT-${anoConta}-${String(countConta + 1).padStart(5, '0')}`;

                // 5. Criar conta do paciente
                const conta = await tx.contaPaciente.create({
                    data: {
                        clinicId, pacienteId: orc.pacienteId, orcamentoId: id,
                        numero: numConta, valorTotal: orc.valorFinal,
                        saldoDevedor: orc.valorFinal, formaPagamentoId: orc.formaPagamentoId,
                        parcelas: orc.parcelas, status: 'ABERTA',
                        itens: {
                            create: orc.itens.map(item => ({
                                procedimentoId: item.procedimentoId,
                                quantidade: item.quantidade,
                                valorUnitario: item.valorUnitario,
                                valorTotal: item.valorTotal
                            }))
                        }
                    }
                });

                // 6. Gerar parcelas
                const valorParcela = Number(orc.valorFinal) / orc.parcelas;
                const parcelasData = [];
                for (let i = 1; i <= orc.parcelas; i++) {
                    const vencimento = new Date();
                    vencimento.setMonth(vencimento.getMonth() + (i - 1));
                    // Taxa por parcela
                    let taxaParcela = 0;
                    if (orc.formaPagamento.taxaPorParcela && orc.parcelas > 1) {
                        const mapa = orc.formaPagamento.taxaPorParcela as Record<string, number>;
                        const taxaPerc = mapa[String(orc.parcelas)] || 0;
                        taxaParcela = valorParcela * (taxaPerc / 100) / orc.parcelas;
                    }

                    parcelasData.push({
                        contaId: conta.id,
                        numeroParcela: i,
                        valorParcela: new Decimal(valorParcela),
                        valorTaxa: new Decimal(taxaParcela),
                        valorLiquido: new Decimal(valorParcela - taxaParcela),
                        vencimento
                    });
                }

                await tx.parcelaContaPaciente.createMany({ data: parcelasData });

                // 7. Atualizar orçamento
                await tx.orcamento.update({
                    where: { id },
                    data: {
                        status: 'APROVADO',
                        aprovadoEm: new Date(),
                        aprovadoPor: userId
                    }
                });

                return { contrato, conta };
            });

            await createAuditLog({
                action: 'UPDATE', userId, req, clinicId,
                entity: 'Orcamento', entityId: id,
                newValues: {
                    status: 'APROVADO',
                    contratoNumero: result.contrato.numero,
                    contaNumero: result.conta.numero
                }
            });

            return res.json({
                message: 'Orçamento aprovado com sucesso',
                contrato: result.contrato,
                conta: result.conta
            });
        } catch (error: any) {
            console.error('[ORCAMENTO] Erro ao aprovar:', error);
            return res.status(500).json({ error: 'Erro ao aprovar orçamento' });
        }
    }

    // ═══ KPIs ═══
    static async kpis(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;

            const [total, rascunhos, enviados, aprovados, rejeitados] = await Promise.all([
                prisma.orcamento.count({ where: { clinicId } }),
                prisma.orcamento.count({ where: { clinicId, status: 'RASCUNHO' } }),
                prisma.orcamento.count({ where: { clinicId, status: 'ENVIADO' } }),
                prisma.orcamento.count({ where: { clinicId, status: 'APROVADO' } }),
                prisma.orcamento.count({ where: { clinicId, status: 'REJEITADO' } }),
            ]);

            const taxaConversao = total > 0 ? ((aprovados / total) * 100).toFixed(1) : '0.0';

            // Valor total aprovado
            const valorAprovado = await prisma.orcamento.aggregate({
                where: { clinicId, status: 'APROVADO' },
                _sum: { valorFinal: true }
            });

            return res.json({
                total, rascunhos, enviados, aprovados, rejeitados,
                taxaConversao: Number(taxaConversao),
                valorTotalAprovado: Number(valorAprovado._sum.valorFinal || 0)
            });
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar KPIs' });
        }
    }
}
