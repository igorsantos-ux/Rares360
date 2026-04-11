import { Request, Response } from 'express';
import { GoalService } from '../services/GoalService.js';

export class GoalController {
    static async getSummary(req: any, res: Response) {
        try {
            const stats = await GoalService.getStats(req.clinicId);
            res.json(stats);
        } catch (error: any) {
            console.error('[GoalController.getSummary] Error:', error);
            res.status(500).json({ error: 'Erro ao buscar resumo de metas', message: error.message });
        }
    }

    static async updateGoal(req: any, res: Response) {
        try {
            const { revenueTarget, workingDays, monthYear } = req.body;
            const updated = await GoalService.updateGoal(req.clinicId, {
                revenueTarget: revenueTarget ? Number(revenueTarget) : undefined,
                workingDays: workingDays ? Number(workingDays) : undefined,
                monthYear
            });
            res.json(updated);
        } catch (error: any) {
            console.error('[GoalController.updateGoal] Error:', error);
            res.status(500).json({ error: 'Erro ao atualizar meta', message: error.message });
        }
    }
}
