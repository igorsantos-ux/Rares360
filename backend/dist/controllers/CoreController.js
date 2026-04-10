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
const doctorSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    specialty: z.string().min(1, "Especialidade é obrigatória"),
    commission: z.coerce.number().min(0).optional(),
    crm: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    isActive: z.boolean().optional().default(true),
    // Novos campos
    cpf: z.string().optional().nullable(),
    birthDate: z.string().optional().nullable(),
    email: z.string().optional().nullable().or(z.literal('')),
    crmUf: z.string().optional().nullable(),
    rqe: z.string().optional().nullable(),
    consultationValue: z.coerce.number().optional().nullable(),
    repasseType: z.string().optional().nullable(),
    repasseValue: z.coerce.number().optional().nullable(),
    pixKey: z.string().optional().nullable(),
    defaultDuration: z.coerce.number().optional().nullable(),
    availability: z.any().optional().nullable(),
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
    static async listDoctors(req, res) {
        try {
            const data = await MedicalService.listDoctors(req.clinicId);
            res.json(data);
        }
        catch (error) {
            console.error('Erro ao listar médicos:', error);
            res.status(500).json({ error: 'Erro interno ao buscar médicos' });
        }
    }
    static async createDoctor(req, res) {
        try {
            const validation = doctorSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Validação falhou',
                    details: validation.error.flatten().fieldErrors
                });
            }
            const data = await MedicalService.createDoctor({
                ...validation.data,
                commission: validation.data.commission || 0,
                crm: validation.data.crm ?? undefined,
                phone: validation.data.phone ?? undefined,
                cpf: validation.data.cpf ?? undefined,
                email: validation.data.email ?? undefined,
                crmUf: validation.data.crmUf ?? undefined,
                rqe: validation.data.rqe ?? undefined,
                pixKey: validation.data.pixKey ?? undefined,
                birthDate: validation.data.birthDate ?? undefined,
                clinicId: req.clinicId
            });
            res.status(201).json(data);
        }
        catch (error) {
            console.error('Erro ao criar médico:', error);
            res.status(500).json({ error: 'Erro interno ao salvar médico' });
        }
    }
    static async updateDoctor(req, res) {
        try {
            const { id } = req.params;
            const validation = doctorSchema.partial().safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Validação falhou', details: validation.error.flatten().fieldErrors });
            }
            const updateData = {
                ...validation.data,
                crm: validation.data.crm === null ? undefined : (validation.data.crm ?? undefined),
                phone: validation.data.phone === null ? undefined : (validation.data.phone ?? undefined),
                cpf: validation.data.cpf === null ? undefined : (validation.data.cpf ?? undefined),
                email: validation.data.email === null ? undefined : (validation.data.email ?? undefined),
                crmUf: validation.data.crmUf === null ? undefined : (validation.data.crmUf ?? undefined),
                rqe: validation.data.rqe === null ? undefined : (validation.data.rqe ?? undefined),
                pixKey: validation.data.pixKey === null ? undefined : (validation.data.pixKey ?? undefined),
            };
            const data = await MedicalService.updateDoctor(id, req.clinicId, updateData);
            res.json(data);
        }
        catch (error) {
            console.error('Erro ao atualizar médico:', error);
            res.status(500).json({ error: 'Erro interno ao atualizar médico' });
        }
    }
    static async deleteDoctor(req, res) {
        try {
            const { id } = req.params;
            await MedicalService.deleteDoctor(id, req.clinicId);
            res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao deletar médico:', error);
            res.status(500).json({ error: 'Erro interno ao deletar médico' });
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
