/**
 * FormaPagamentoController — CRUD completo de formas de pagamento
 * Suporta cálculo de taxas ao vivo e cache Redis
 */
import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import { createAuditLog } from '../lib/auditLogger.js';

// ═══ Helpers ═══
const CACHE_KEY = (clinicId: string) => `forma_pagamento:${clinicId}`;
const CACHE_TTL = 300; // 5 minutos

async function invalidateCache(clinicId: string) {
    try {
        const redisClient = (await import('../lib/redis.js')).default;
        if (redisClient) await redisClient.del(CACHE_KEY(clinicId));
    } catch { /* Redis opcional */ }
}

export class FormaPagamentoController {

    // ═══ LISTAR — GET /api/forma-pagamento ═══
    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;

            // Tenta cache
            try {
                const redisClient = (await import('../lib/redis.js')).default;
                if (redisClient) {
                    const cached = await redisClient.get(CACHE_KEY(clinicId));
                    if (cached) return res.json(JSON.parse(cached));
                }
            } catch { /* Redis opcional */ }

            const formas = await prisma.formaPagamento.findMany({
                where: { clinicId },
                orderBy: { ordem: 'asc' }
            });

            // Salva no cache
            try {
                const redisClient = (await import('../lib/redis.js')).default;
                if (redisClient) await redisClient.setex(CACHE_KEY(clinicId), CACHE_TTL, JSON.stringify(formas));
            } catch { /* Redis opcional */ }

            return res.json(formas);
        } catch (error: any) {
            console.error('[FORMA_PAGAMENTO] Erro ao listar:', error);
            return res.status(500).json({ error: 'Erro ao listar formas de pagamento' });
        }
    }

    // ═══ CRIAR — POST /api/forma-pagamento ═══
    static async create(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const {
                nome, tipo, taxaPercentual = 0, taxaFixa = 0, taxaAntecipacao = 0,
                prazoRecebimento = 0, permiteParcelamento = false, parcelasMaximas = 1,
                taxaPorParcela, ordem = 0
            } = req.body;

            if (!nome || !tipo) {
                return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
            }

            const tiposValidos = ['DINHEIRO', 'PIX', 'CREDITO', 'DEBITO', 'BOLETO'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({ error: `Tipo inválido. Valores aceitos: ${tiposValidos.join(', ')}` });
            }

            const forma = await prisma.formaPagamento.create({
                data: {
                    clinicId, nome, tipo,
                    taxaPercentual: new Decimal(taxaPercentual),
                    taxaFixa: new Decimal(taxaFixa),
                    taxaAntecipacao: new Decimal(taxaAntecipacao),
                    prazoRecebimento, permiteParcelamento,
                    parcelasMaximas: permiteParcelamento ? parcelasMaximas : 1,
                    taxaPorParcela: taxaPorParcela || null,
                    ordem
                }
            });

            await invalidateCache(clinicId);

            await createAuditLog({
                action: 'CREATE', userId, req, clinicId,
                entity: 'FormaPagamento', entityId: forma.id,
                newValues: { nome, tipo }
            });

            return res.status(201).json(forma);
        } catch (error: any) {
            console.error('[FORMA_PAGAMENTO] Erro ao criar:', error);
            return res.status(500).json({ error: 'Erro ao criar forma de pagamento' });
        }
    }

    // ═══ ATUALIZAR — PUT /api/forma-pagamento/:id ═══
    static async update(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { id } = req.params;

            const existing = await prisma.formaPagamento.findFirst({
                where: { id, clinicId }
            });
            if (!existing) return res.status(404).json({ error: 'Forma de pagamento não encontrada' });

            const {
                nome, tipo, taxaPercentual, taxaFixa, taxaAntecipacao,
                prazoRecebimento, permiteParcelamento, parcelasMaximas,
                taxaPorParcela, ordem, ativo
            } = req.body;

            // Validar: não desativar se for a última ativa
            if (ativo === false) {
                const ativas = await prisma.formaPagamento.count({
                    where: { clinicId, ativo: true, id: { not: id } }
                });
                if (ativas === 0) {
                    return res.status(400).json({ error: 'Deve existir pelo menos 1 forma de pagamento ativa' });
                }
            }

            const data: any = {};
            if (nome !== undefined) data.nome = nome;
            if (tipo !== undefined) data.tipo = tipo;
            if (taxaPercentual !== undefined) data.taxaPercentual = new Decimal(taxaPercentual);
            if (taxaFixa !== undefined) data.taxaFixa = new Decimal(taxaFixa);
            if (taxaAntecipacao !== undefined) data.taxaAntecipacao = new Decimal(taxaAntecipacao);
            if (prazoRecebimento !== undefined) data.prazoRecebimento = prazoRecebimento;
            if (permiteParcelamento !== undefined) data.permiteParcelamento = permiteParcelamento;
            if (parcelasMaximas !== undefined) data.parcelasMaximas = parcelasMaximas;
            if (taxaPorParcela !== undefined) data.taxaPorParcela = taxaPorParcela;
            if (ordem !== undefined) data.ordem = ordem;
            if (ativo !== undefined) data.ativo = ativo;

            const updated = await prisma.formaPagamento.update({
                where: { id },
                data
            });

            await invalidateCache(clinicId);

            await createAuditLog({
                action: 'UPDATE', userId, req, clinicId,
                entity: 'FormaPagamento', entityId: id,
                oldValues: existing as any, newValues: data
            });

            return res.json(updated);
        } catch (error: any) {
            console.error('[FORMA_PAGAMENTO] Erro ao atualizar:', error);
            return res.status(500).json({ error: 'Erro ao atualizar forma de pagamento' });
        }
    }

    // ═══ DELETAR — DELETE /api/forma-pagamento/:id ═══
    static async delete(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { id } = req.params;

            const existing = await prisma.formaPagamento.findFirst({
                where: { id, clinicId }
            });
            if (!existing) return res.status(404).json({ error: 'Forma de pagamento não encontrada' });

            // Verificar se está em uso (orçamentos ou contas)
            const emUso = await prisma.orcamento.count({ where: { formaPagamentoId: id } });
            if (emUso > 0) {
                // Soft-delete: apenas desativar
                await prisma.formaPagamento.update({ where: { id }, data: { ativo: false } });
                await invalidateCache(clinicId);
                return res.json({ message: 'Forma de pagamento desativada (possui orçamentos vinculados)' });
            }

            await prisma.formaPagamento.delete({ where: { id } });
            await invalidateCache(clinicId);

            await createAuditLog({
                action: 'DELETE', userId, req, clinicId,
                entity: 'FormaPagamento', entityId: id,
                oldValues: existing as any
            });

            return res.json({ message: 'Forma de pagamento excluída' });
        } catch (error: any) {
            console.error('[FORMA_PAGAMENTO] Erro ao deletar:', error);
            return res.status(500).json({ error: 'Erro ao deletar forma de pagamento' });
        }
    }

    // ═══ CALCULAR TAXAS — POST /api/forma-pagamento/calcular ═══
    // Simulação ao vivo: dado um valor e parcelas, retorna os custos
    static async calcular(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const { formaId, valor, parcelas = 1 } = req.body;

            if (!formaId || !valor) {
                return res.status(400).json({ error: 'formaId e valor são obrigatórios' });
            }

            const forma = await prisma.formaPagamento.findFirst({
                where: { id: formaId, clinicId }
            });
            if (!forma) return res.status(404).json({ error: 'Forma de pagamento não encontrada' });

            const valorNum = Number(valor);
            const taxaPerc = Number(forma.taxaPercentual);
            const taxaFx = Number(forma.taxaFixa);
            const taxaAntecip = Number(forma.taxaAntecipacao);

            // Taxa da parcela (se existir mapa de taxas)
            let taxaParcelaPerc = 0;
            if (forma.taxaPorParcela && parcelas > 1) {
                const mapa = forma.taxaPorParcela as Record<string, number>;
                taxaParcelaPerc = mapa[String(parcelas)] || 0;
            }

            // Cálculo:
            // taxaTotal = (valor * taxaPercentual/100) + taxaFixa + (valor * taxaAntecipacao/100) + (valor * taxaParcela/100)
            const taxaPercentualValor = valorNum * (taxaPerc / 100);
            const taxaAntecipacaoValor = valorNum * (taxaAntecip / 100);
            const taxaParcelaValor = valorNum * (taxaParcelaPerc / 100);
            const taxasTotal = taxaPercentualValor + taxaFx + taxaAntecipacaoValor + taxaParcelaValor;

            const valorLiquido = valorNum - taxasTotal;
            const valorParcela = parcelas > 0 ? valorNum / parcelas : valorNum;

            return res.json({
                valorBruto: valorNum,
                parcelas,
                taxas: {
                    percentual: Number(taxaPercentualValor.toFixed(2)),
                    fixa: taxaFx,
                    antecipacao: Number(taxaAntecipacaoValor.toFixed(2)),
                    parcela: Number(taxaParcelaValor.toFixed(2)),
                    total: Number(taxasTotal.toFixed(2))
                },
                valorLiquido: Number(valorLiquido.toFixed(2)),
                valorParcela: Number(valorParcela.toFixed(2)),
                prazoRecebimento: forma.prazoRecebimento
            });
        } catch (error: any) {
            console.error('[FORMA_PAGAMENTO] Erro ao calcular:', error);
            return res.status(500).json({ error: 'Erro ao calcular taxas' });
        }
    }
}
