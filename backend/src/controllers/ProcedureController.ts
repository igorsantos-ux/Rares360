import { Request, Response } from 'express';
import { ProcedureExecutionService } from '../services/ProcedureExecutionService.js';

export class ProcedureController {
    static async execute(req: Request, res: Response) {
        try {
            const clinicId = req.headers['x-clinic-id'] as string;
            const { id } = req.params;

            const result = await ProcedureExecutionService.execute(clinicId, id);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    static async listPending(req: Request, res: Response) {
        try {
            const clinicId = req.headers['x-clinic-id'] as string;
            const result = await ProcedureExecutionService.listPending(clinicId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getByPatient(req: Request, res: Response) {
        try {
            const clinicId = req.headers['x-clinic-id'] as string;
            const { patientId } = req.params;
            const result = await ProcedureExecutionService.getByPatient(clinicId, patientId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
