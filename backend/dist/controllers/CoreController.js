import { MedicalService, InventoryService } from '../services/CoreServices.js';
import { z } from 'zod';
const stockSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    category: z.string().min(1, "Categoria é obrigatória"),
    unit: z.string().min(1, "Unidade é obrigatória"),
    quantity: z.coerce.number().min(0, "Quantidade deve ser positiva"),
    minQuantity: z.coerce.number().min(0, "Mínimo deve ser positivo"),
    unitCost: z.coerce.number().min(0, "Custo deve ser positivo"),
    supplier: z.string().optional().nullable(),
    expirationDate: z.string().optional().nullable(),
    batch: z.string().optional().nullable(),
});
export class CoreController {
    static async getProductivity(req, res) {
        try {
            const data = await MedicalService.getProductivity(req.clinicId);
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getStock(req, res) {
        try {
            const data = await InventoryService.getStockStatus(req.clinicId);
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createStock(req, res) {
        try {
            const validation = stockSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Validação falhou',
                    details: validation.error.flatten().fieldErrors
                });
            }
            const data = await InventoryService.createStockItem({
                ...validation.data,
                clinicId: req.clinicId
            });
            res.status(201).json(data);
        }
        catch (error) {
            console.error('Erro ao criar item de estoque:', error);
            res.status(500).json({ error: 'Erro interno ao salvar item' });
        }
    }
    static async createDoctor(req, res) {
        try {
            const { name, specialty, commission } = req.body;
            const data = await MedicalService.createDoctor({
                name,
                specialty,
                commission: Number(commission),
                clinicId: req.clinicId
            });
            res.status(201).json(data);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async registerMovement(req, res) {
        try {
            const { itemId, type, quantity, reason } = req.body;
            if (!itemId || !type || !quantity) {
                return res.status(400).json({ error: 'ItemId, type e quantity são obrigatórios' });
            }
            const data = await InventoryService.registerMovement({
                itemId,
                type,
                quantity: Number(quantity),
                reason,
                clinicId: req.clinicId,
                userId: req.userId
            });
            res.status(201).json(data);
        }
        catch (error) {
            console.error('Erro ao registrar movimentação:', error);
            res.status(400).json({ error: error.message || 'Erro ao processar movimentação' });
        }
    }
    static async getStockHistory(req, res) {
        try {
            const data = await InventoryService.getMovementHistory(req.clinicId);
            res.json(data);
        }
        catch (error) {
            console.error('Erro ao buscar histórico:', error);
            res.status(500).json({ error: 'Erro ao carregar histórico' });
        }
    }
}
