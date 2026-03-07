import { Request, Response } from 'express';
import { MedicalService, InventoryService } from '../services/CoreServices.js';

export class CoreController {
    static async getProductivity(req: any, res: Response) {
        try {
            const data = await MedicalService.getProductivity(req.clinicId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getStock(req: any, res: Response) {
        try {
            const data = await InventoryService.getStockStatus(req.clinicId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async createStock(req: any, res: Response) {
        try {
            const { name, quantity, minQuantity, price, category } = req.body;
            const data = await InventoryService.createStockItem({
                name,
                quantity: Number(quantity),
                minQuantity: Number(minQuantity),
                price: Number(price),
                category,
                clinicId: req.clinicId
            });
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async createDoctor(req: any, res: Response) {
        try {
            const { name, specialty, commission } = req.body;
            const data = await MedicalService.createDoctor({
                name,
                specialty,
                commission: Number(commission),
                clinicId: req.clinicId
            });
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
