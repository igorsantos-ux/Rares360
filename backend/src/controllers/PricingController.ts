import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { calcPricing } from '../utils/pricingCalculator.js';
import { createAuditLog } from '../lib/auditLogger.js';
import { z } from 'zod';
import * as XLSX from '@e965/xlsx';

export class PricingController {
  /**
   * Lista todos os procedimentos com margens calculadas em tempo real
   */
  async getDiagnosis(req: any, res: Response) {
    try {
      const { clinicId } = req.clinicContext;
      const { tipo, status, search } = req.query;

      // Buscar config da clínica (com fallback para defaults via upsert)
      const config = await prisma.pricingConfig.upsert({
        where: { clinicId },
        create: { clinicId },
        update: {},
      });

      // Buscar procedimentos da clínica
      const procedures = await prisma.procedure.findMany({
        where: {
          clinicId,
          ...(tipo && { tipo: tipo as string }),
          ...(search && {
            name: { contains: search as string, mode: 'insensitive' }
          }),
          // Removida a trava de isActive para permitir precificar tudo
        },
        include: {
          prices: {
            where: { clinicId },
            take: 1,
          },
        },
        orderBy: [{ tipo: 'asc' }, { name: 'asc' }],
      });

      let kpiCritica = 0, kpiOk = 0, kpiIdeal = 0, kpiSemPreco = 0;

      const data = procedures.map((proc) => {
        const salePrice = proc.prices[0]?.salePrice ?? 0;
        
        // Conversão de Decimal (Prisma) para number (Calculator)
        const productCost = Number(proc.productCost || 0);
        const duration = proc.duration || proc.durationMinutes || 0;

        const result = calcPricing(
          { productCost, duration, salePrice },
          config as any
        );

        if (salePrice <= 0) kpiSemPreco++;
        else if (result.status === 'CRITICA') kpiCritica++;
        else if (result.status === 'OK') kpiOk++;
        else if (result.status === 'IDEAL') kpiIdeal++;

        return {
          id: proc.id,
          tipo: proc.tipo || proc.category,
          nome: proc.name,
          duracao: duration,
          custoProduto: productCost,
          salePrice,
          pricing: result,
        };
      });

      // Filtro por status após cálculo
      const filtered = status
        ? data.filter(d => d.pricing.status === status)
        : data;

      return res.json({
        procedures: filtered,
        config,
        kpis: {
          total: procedures.length,
          critica: kpiCritica,
          ok: kpiOk,
          ideal: kpiIdeal,
          semPreco: kpiSemPreco,
        },
      });
    } catch (error: any) {
      console.error('[PricingController.getDiagnosis] Erro:', error);
      return res.status(500).json({ error: 'Erro ao buscar diagnóstico de precificação' });
    }
  }

  /**
   * Busca a configuração global da clínica
   */
  async getConfig(req: any, res: Response) {
    try {
      const { clinicId } = req.clinicContext;
      const config = await prisma.pricingConfig.upsert({
        where: { clinicId },
        create: { clinicId },
        update: {},
      });
      return res.json(config);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar configuração' });
    }
  }

  /**
   * Salva parâmetros globais da clínica
   */
  async updateConfig(req: any, res: Response) {
    try {
      const { clinicId } = req.clinicContext;
      
      const pricingConfigSchema = z.object({
        taxaSalaPerMin: z.number().min(0).max(100),
        impostosRate:   z.number().min(0).max(1),
        cartaoRate:     z.number().min(0).max(0.2),
        comissaoRate:   z.number().min(0).max(0.2),
        repasseRate:    z.number().min(0).max(0.8),
        margemAlvo:     z.number().min(0).max(0.9),
      });

      const body = pricingConfigSchema.parse(req.body);

      const oldConfig = await prisma.pricingConfig.findUnique({ where: { clinicId } });

      const config = await prisma.pricingConfig.upsert({
        where: { clinicId },
        create: { clinicId, ...body },
        update: body,
      });

      // Auditoria
      await createAuditLog({
        action: 'PRICING_CONFIG_UPDATED' as any,
        userId: req.user.id,
        clinicId,
        req,
        entity: 'PricingConfig',
        entityId: config.id,
        oldValues: oldConfig || {},
        newValues: body,
      });

      return res.json(config);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      return res.status(500).json({ error: 'Erro ao salvar configuração' });
    }
  }

  /**
   * Atualiza o preço de venda de um procedimento específico
   */
  async updatePrice(req: any, res: Response) {
    try {
      const { clinicId } = req.clinicContext;
      const { procedureId } = req.params;
      const { salePrice } = z.object({
        salePrice: z.number().min(0)
      }).parse(req.body);

      const procedure = await prisma.procedure.findFirst({
        where: { id: procedureId, clinicId },
      });
      
      if (!procedure) return res.status(404).json({ error: 'Procedimento não encontrado' });

      const price = await prisma.procedurePrice.upsert({
        where: { clinicId_procedureId: { clinicId, procedureId } },
        create: { clinicId, procedureId, salePrice, updatedBy: req.user.id },
        update: { salePrice, updatedBy: req.user.id },
      });

      const config = await prisma.pricingConfig.upsert({
        where: { clinicId },
        create: { clinicId },
        update: {},
      });

      const result = calcPricing(
        { 
          productCost: Number(procedure.productCost || 0), 
          duration: procedure.duration || procedure.durationMinutes || 0, 
          salePrice 
        },
        config as any
      );

      return res.json({ price, pricing: result });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar preço' });
    }
  }

  /**
   * Importação em massa via planilha
   */
  async importPrices(req: any, res: Response) {
    try {
      const { clinicId } = req.clinicContext;
      if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      const procedures = await prisma.procedure.findMany({
        where: { clinicId },
        select: { id: true, name: true },
      });

      const procMap = new Map(
        procedures.map(p => [p.name.toLowerCase().trim(), p.id])
      );

      const results = { imported: 0, notFound: [] as string[], errors: [] as string[] };

      // Executar em transaction para garantir integridade
      await prisma.$transaction(async (tx) => {
        for (const row of rows) {
          const nome = String(row['PROCEDIMENTO'] || row['procedimento'] || row['Nome'] || '').trim();
          const precoRaw = row['PRECO_VENDA'] || row['preco_venda'] || row['Preço'] || row['Valor'];
          const preco = typeof precoRaw === 'number' ? precoRaw : parseFloat(String(precoRaw || 0).replace('R$', '').replace('.', '').replace(',', '.'));

          if (!nome) continue;
          
          const procedureId = procMap.get(nome.toLowerCase());
          
          if (!procedureId) { 
            results.notFound.push(nome); 
            continue; 
          }
          
          if (isNaN(preco) || preco < 0) { 
            results.errors.push(nome); 
            continue; 
          }

          await tx.procedurePrice.upsert({
            where: { clinicId_procedureId: { clinicId, procedureId } },
            create: { clinicId, procedureId, salePrice: preco, updatedBy: req.user.id },
            update: { salePrice: preco, updatedBy: req.user.id },
          });
          results.imported++;
        }
      });

      return res.json(results);
    } catch (error) {
      console.error('[PricingController.importPrices] Erro:', error);
      return res.status(500).json({ error: 'Erro ao importar preços' });
    }
  }
}
