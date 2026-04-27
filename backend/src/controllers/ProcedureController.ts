import { Request, Response } from 'express';
import { ProcedureService } from '../services/ProcedureService.js';

export class ProcedureController {
    static async list(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const { page, limit, category, search } = req.query;
            const result = await ProcedureService.list(clinicId, {
                page: Number(page) || 1,
                limit: Number(limit) || 1000,
                category: category as string,
                search: search as string
            });

            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const item = await ProcedureService.create(clinicId, req.body);
            return res.status(201).json(item);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { id } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const item = await ProcedureService.update(id, clinicId, req.body);
            return res.json(item);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { id } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            await ProcedureService.delete(id, clinicId);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { id } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const item = await ProcedureService.getById(id, clinicId);
            if (!item) return res.status(404).json({ message: 'Procedimento não encontrado' });

            return res.json(item);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async listPending(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const result = await ProcedureService.listPending(clinicId);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async getByPatient(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { patientId } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const result = await ProcedureService.getByPatient(clinicId, patientId);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    static async execute(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || (req as any).clinicId;
            const { id } = req.params;
            if (!clinicId) return res.status(403).json({
                error: 'CLINIC_CONTEXT_REQUIRED',
                message: 'Contexto de clínica não identificado.'
            });

            const result = await ProcedureService.execute(id, clinicId);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}
