import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService.js';

export class AnalyticsController {
    static async getInsights(req: any, res: Response) {
        try {
            const insights = await AnalyticsService.getDashboardInsights(req.clinicId);
            res.json(insights);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar insights' });
        }
    }
}
