import { Request, Response } from 'express';
import { HistoryService } from '../services/HistoryService.js';

export class HistoryController {
    static async getYearlySummary(req: any, res: Response) {
        try {
            const summary = await HistoryService.getYearlySummary(2026, req.clinicId);
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar resumo anual' });
        }
    }

    static async getDetailedProcedures(req: any, res: Response) {
        try {
            const procedures = await HistoryService.getDetailedProcedures(req.clinicId);
            res.json(procedures);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar procedimentos detalhados' });
        }
    }

    static async getWeeklyAnalysis(req: any, res: Response) {
        try {
            const { month } = req.query;
            const analysis = await HistoryService.getWeeklyAnalysis(Number(month || 2), req.clinicId); // Default para Março (2)
            res.json(analysis);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar análise semanal' });
        }
    }
}
