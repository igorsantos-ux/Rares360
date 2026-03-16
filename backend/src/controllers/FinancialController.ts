import type { Request, Response } from 'express';
import { FinancialService } from '../services/FinancialService.js';

export class FinancialController {
    static async getSummary(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const summary = await FinancialService.getSummary(req.clinicId, start, end);
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getBreakEven(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const breakEven = await FinancialService.getBreakEven(req.clinicId, start, end);
            res.json(breakEven);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getEvolution(req: any, res: Response) {
        try {
            const evolution = await FinancialService.getEvolution(req.clinicId);
            res.json(evolution);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async createTransaction(req: any, res: Response) {
        try {
            const { amount, type, category, description, doctorId } = req.body;
            const data = await FinancialService.createTransaction({
                amount: Number(amount),
                type,
                category,
                description,
                doctorId,
                clinicId: req.clinicId
            });
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getTransactions(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const transactions = await FinancialService.getTransactions(req.clinicId, start, end);
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
