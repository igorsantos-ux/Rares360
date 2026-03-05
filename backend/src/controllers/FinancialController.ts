import type { Request, Response } from 'express';
import { FinancialService } from '../services/FinancialService.js';

export class FinancialController {
    static async getSummary(req: Request, res: Response) {
        try {
            const summary = await FinancialService.getSummary();
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getBreakEven(req: Request, res: Response) {
        try {
            const breakEven = await FinancialService.getBreakEven();
            res.json(breakEven);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getEvolution(req: Request, res: Response) {
        try {
            const evolution = await FinancialService.getEvolution();
            res.json(evolution);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async createTransaction(req: Request, res: Response) {
        try {
            const { amount, type, category, description, doctorId } = req.body;
            const data = await FinancialService.createTransaction({
                amount: Number(amount),
                type,
                category,
                description,
                doctorId
            });
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
