import type { Request, Response } from 'express';
import { FinancialService } from '../services/FinancialService.js';

export class FinancialController {
    static async getSummary(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            
            let start = startDate ? new Date(startDate as string) : undefined;
            let end = endDate ? new Date(endDate as string) : undefined;

            // Filtro padrão: Mês Atual
            if (!start && !end) {
                const now = new Date();
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            }

            const summary = await FinancialService.getSummary(req.clinicId, start, end);
            res.json(summary);
        } catch (error: any) {
            console.error('[FinancialController] Error:', error);
            res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message,
                code: error.code 
            });
        }
    }

    static async getBreakEven(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const breakEven = await FinancialService.getBreakEven(req.clinicId, start, end);
            res.json(breakEven);
        } catch (error: any) {
            console.error('[FinancialController] Error:', error);
            res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message,
                code: error.code 
            });
        }
    }

    static async getEvolution(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const evolution = await FinancialService.getEvolution(req.clinicId, start, end);
            res.json(evolution);
        } catch (error: any) {
            console.error('[FinancialController] Error:', error);
            res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message,
                code: error.code 
            });
        }
    }

    static async getDailyEvolution(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const daily = await FinancialService.getDailyEvolution(req.clinicId, start, end);
            res.json(daily);
        } catch (error: any) {
            console.error('[FinancialController] Error:', error);
            res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message,
                code: error.code 
            });
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
        } catch (error: any) {
            console.error('[FinancialController] Error:', error);
            res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message,
                code: error.code 
            });
        }
    }

    static async getTransactions(req: any, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;
            const transactions = await FinancialService.getTransactions(req.clinicId, start, end);
            res.json(transactions);
        } catch (error: any) {
            console.error('[FinancialController] Error:', error);
            res.status(500).json({ 
                error: 'Internal server error', 
                message: error.message,
                code: error.code 
            });
        }
    }
}
