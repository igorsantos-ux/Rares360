import { Request, Response } from 'express';
import { CashFlowService, GoalService, BillingService } from '../services/ReportingServices.js';
import { FinancialService } from '../services/FinancialService.js';

export class ReportingController {
    static async getDashboardKPIs(req: any, res: Response) {
        try {
            const clinicId = req.clinicId;
            const summary = await FinancialService.getSummary(clinicId);
            const flow = await CashFlowService.getMonthlyFlow(clinicId);

            res.json({ ...summary, ...flow });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getCashFlow(req: any, res: Response) {
        try {
            const data = await CashFlowService.getMonthlyFlow(req.clinicId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getDRE(req: any, res: Response) {
        try {
            const data = await CashFlowService.getDRE(req.clinicId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getBillingAnalytics(req: any, res: Response) {
        try {
            const data = await BillingService.getBillingAnalytics(req.clinicId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getGoals(req: any, res: Response) {
        try {
            const data = await GoalService.getGoals(req.clinicId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async postSmartGoal(req: any, res: Response) {
        try {
            const { targetProfit } = req.body;
            const data = await GoalService.calculateSmartGoal(req.clinicId, Number(targetProfit));
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
