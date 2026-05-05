import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { calcInvestment } from '../utils/investmentCalculator.js';

const investmentSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.enum([
    'EQUIPAMENTO_LASER',
    'EQUIPAMENTO_TECNOLOGIA',
    'EQUIPAMENTO_ESTETICO',
    'REFORMA',
    'MARKETING',
    'TREINAMENTO',
    'CAPITAL_GIRO',
    'OUTRO'
  ]),
  valorTotal: z.coerce.number().min(0),
  entrada: z.coerce.number().min(0).default(0),
  parcelas: z.coerce.number().int().min(1).default(1),
  jurosMes: z.coerce.number().min(0).default(0),
  dataAquisicao: z.coerce.date(),
  vidaUtilAnos: z.coerce.number().int().min(1).default(5),
  valorResidualPct: z.coerce.number().min(0).max(1).default(0.1),
  ticketMedio: z.coerce.number().min(0),
  sessoesMetaMes: z.coerce.number().int().min(0),
  custoInsumoSessao: z.coerce.number().min(0).default(0),
  custoFixoMensal: z.coerce.number().min(0).default(0),
  taxasRepasse: z.coerce.number().min(0).max(1).default(0.4),
  notas: z.string().optional().nullable(),
});

const simulateSchema = z.object({
  valorTotal: z.coerce.number().min(0),
  entrada: z.coerce.number().min(0).default(0),
  parcelas: z.coerce.number().int().min(1).default(1),
  jurosMes: z.coerce.number().min(0).default(0),
  vidaUtilAnos: z.coerce.number().int().min(1).default(5),
  valorResidualPct: z.coerce.number().min(0).max(1).default(0.1),
  ticketMedio: z.coerce.number().min(0),
  sessoesMetaMes: z.coerce.number().int().min(0),
  custoInsumoSessao: z.coerce.number().min(0).default(0),
  custoFixoMensal: z.coerce.number().min(0).default(0),
  taxasRepasse: z.coerce.number().min(0).max(1).default(0.4),
});

export class InvestmentController {
  static async list(req: any, res: Response) {
    try {
      const clinicId = req.clinicId;

      const investments = await prisma.investment.findMany({
        where: { clinicId, ativo: true },
        orderBy: { dataAquisicao: 'desc' },
      });

      const data = investments.map((inv: any) => ({
        ...inv,
        resultado: calcInvestment({
          valorTotal: inv.valorTotal,
          entrada: inv.entrada,
          parcelas: inv.parcelas,
          jurosMes: inv.jurosMes,
          vidaUtilAnos: inv.vidaUtilAnos,
          valorResidualPct: inv.valorResidualPct,
          ticketMedio: inv.ticketMedio,
          sessoesMetaMes: inv.sessoesMetaMes,
          custoInsumoSessao: inv.custoInsumoSessao,
          custoFixoMensal: inv.custoFixoMensal,
          taxasRepasse: inv.taxasRepasse,
        }),
      }));

      // KPIs consolidados
      const totalInvestido = investments.reduce((s, i) => s + i.valorTotal, 0);
      const lucroTotal = data.reduce((s, d) => s + d.resultado.lucroMensal, 0);
      
      const investmentsWithPayback = data.filter(d => d.resultado.paybackMeses !== null);
      const paybackMedio = investmentsWithPayback.length > 0
        ? investmentsWithPayback.reduce((s, d) => s + (d.resultado.paybackMeses || 0), 0) / investmentsWithPayback.length
        : 0;

      return res.json({
        investments: data,
        summary: {
          totalInvestido,
          lucroMensalTotal: lucroTotal,
          paybackMedioMeses: Math.round(paybackMedio),
          lucrativo: data.filter(d => d.resultado.status === 'LUCRATIVO').length,
          atencao:   data.filter(d => d.resultado.status === 'ATENCAO').length,
          prejuizo:  data.filter(d => d.resultado.status === 'PREJUIZO').length,
        },
      });
    } catch (error: any) {
      console.error('[InvestmentController.list] Error:', error);
      res.status(500).json({ error: 'Erro ao listar investimentos', message: error.message });
    }
  }

  static async create(req: any, res: Response) {
    try {
      const clinicId = req.clinicId;
      console.log('[InvestmentController.create] Body recebido:', JSON.stringify(req.body, null, 2));

      const parsed = investmentSchema.safeParse(req.body);

      if (!parsed.success) {
        console.warn('[InvestmentController.create] Erro de validação Zod:', JSON.stringify(parsed.error.errors, null, 2));
        return res.status(400).json({
          error: 'Dados inválidos',
          detalhes: parsed.error.errors,
          fieldErrors: parsed.error.flatten().fieldErrors
        });
      }

      const investment = await prisma.investment.create({
        data: {
          ...parsed.data,
          clinicId,
        },
      });

      return res.status(201).json(investment);
    } catch (error: any) {
      console.error('[InvestmentController.create] Error:', error);
      res.status(500).json({ error: 'Erro ao cadastrar investimento', message: error.message });
    }
  }

  static async getById(req: any, res: Response) {
    try {
      const { id } = req.params;
      const clinicId = req.clinicId;

      const investment = await prisma.investment.findFirst({
        where: { id, clinicId, ativo: true },
      });

      if (!investment) {
        return res.status(404).json({ error: 'Investimento não encontrado' });
      }

      const resultado = calcInvestment({
        valorTotal: investment.valorTotal,
        entrada: investment.entrada,
        parcelas: investment.parcelas,
        jurosMes: investment.jurosMes,
        vidaUtilAnos: investment.vidaUtilAnos,
        valorResidualPct: investment.valorResidualPct,
        ticketMedio: investment.ticketMedio,
        sessoesMetaMes: investment.sessoesMetaMes,
        custoInsumoSessao: investment.custoInsumoSessao,
        custoFixoMensal: investment.custoFixoMensal,
        taxasRepasse: investment.taxasRepasse,
      });

      return res.json({
        ...investment,
        resultado,
      });
    } catch (error: any) {
      console.error('[InvestmentController.getById] Error:', error);
      res.status(500).json({ error: 'Erro ao buscar detalhe do investimento', message: error.message });
    }
  }

  static async update(req: any, res: Response) {
    try {
      const { id } = req.params;
      const clinicId = req.clinicId;
      console.log('[InvestmentController.update] Body recebido:', JSON.stringify(req.body, null, 2));

      const parsed = investmentSchema.partial().safeParse(req.body);

      if (!parsed.success) {
        console.warn('[InvestmentController.update] Erro de validação Zod:', JSON.stringify(parsed.error.errors, null, 2));
        return res.status(400).json({
          error: 'Dados inválidos',
          detalhes: parsed.error.errors,
          fieldErrors: parsed.error.flatten().fieldErrors
        });
      }

      const investment = await prisma.investment.updateMany({
        where: { id, clinicId },
        data: parsed.data as any,
      });

      if (investment.count === 0) {
        return res.status(404).json({ error: 'Investimento não encontrado' });
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error('[InvestmentController.update] Error:', error);
      res.status(500).json({ error: 'Erro ao atualizar investimento', message: error.message });
    }
  }

  static async delete(req: any, res: Response) {
    try {
      const { id } = req.params;
      const clinicId = req.clinicId;

      const investment = await prisma.investment.updateMany({
        where: { id, clinicId },
        data: { ativo: false },
      });

      if (investment.count === 0) {
        return res.status(404).json({ error: 'Investimento não encontrado' });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error('[InvestmentController.delete] Error:', error);
      res.status(500).json({ error: 'Erro ao excluir investimento', message: error.message });
    }
  }

  static async simulate(req: any, res: Response) {
    try {
      console.log('[InvestmentController.simulate] Body recebido:', JSON.stringify(req.body, null, 2));
      const parsed = simulateSchema.safeParse(req.body);

      if (!parsed.success) {
        console.warn('[InvestmentController.simulate] Erro de validação Zod:', JSON.stringify(parsed.error.errors, null, 2));
        return res.status(400).json({
          error: 'Dados inválidos',
          detalhes: parsed.error.errors,
          campos: parsed.error.errors.map(e => ({
            campo: e.path.join('.'),
            mensagem: e.message,
            recebido: (e as any).received ?? 'ausente'
          }))
        });
      }

      const resultado = calcInvestment(parsed.data);
      return res.json(resultado);
    } catch (error: any) {
      console.error('[InvestmentController.simulate] Error:', error);
      res.status(500).json({ error: 'Erro ao simular investimento', message: error.message });
    }
  }
}
