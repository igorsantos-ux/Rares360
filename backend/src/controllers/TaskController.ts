import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService.js';

export class TaskController {
    static async getDailyTasks(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || req.headers['x-clinic-id'] as string;
            const result = await TaskService.getDailyTasks(clinicId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getCRMTasks(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || req.headers['x-clinic-id'] as string;
            const result = await TaskService.getCRMTasks(clinicId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async updateTaskStatus(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || req.headers['x-clinic-id'] as string;
            const { id } = req.params;
            const { status } = req.body;

            const result = await TaskService.updateTaskStatus(clinicId, id, status);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    static async completeTask(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || req.headers['x-clinic-id'] as string;
            const { id } = req.params;

            const result = await TaskService.completeTask(clinicId, id);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    static async getSummary(req: Request, res: Response) {
        try {
            const clinicId = (req as any).user?.clinicId || req.headers['x-clinic-id'] as string;
            const result = await TaskService.getSummary(clinicId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
