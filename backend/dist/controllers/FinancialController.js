import { FinancialService } from '../services/FinancialService.js';
export class FinancialController {
    static async getSummary(req, res) {
        try {
            const { startDate, endDate } = req.query;
            let start = startDate ? new Date(startDate) : undefined;
            let end = endDate ? new Date(endDate) : undefined;
            // Filtro padrão: Mês Atual
            if (!start && !end) {
                const now = new Date();
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            }
            const summary = await FinancialService.getSummary(req.clinicId, start, end);
            res.json(summary);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getBreakEven(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const breakEven = await FinancialService.getBreakEven(req.clinicId, start, end);
            res.json(breakEven);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getEvolution(req, res) {
        try {
            const evolution = await FinancialService.getEvolution(req.clinicId);
            res.json(evolution);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getDailyEvolution(req, res) {
        try {
            const daily = await FinancialService.getDailyEvolution(req.clinicId);
            res.json(daily);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createTransaction(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getTransactions(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const transactions = await FinancialService.getTransactions(req.clinicId, start, end);
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
