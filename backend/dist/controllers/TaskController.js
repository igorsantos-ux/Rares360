import { TaskService } from '../services/TaskService.js';
export class TaskController {
    static async getDailyTasks(req, res) {
        try {
            const clinicId = req.user?.clinicId || req.headers['x-clinic-id'];
            const result = await TaskService.getDailyTasks(clinicId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getCRMTasks(req, res) {
        try {
            const clinicId = req.user?.clinicId || req.headers['x-clinic-id'];
            const result = await TaskService.getCRMTasks(clinicId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async updateTaskStatus(req, res) {
        try {
            const clinicId = req.user?.clinicId || req.headers['x-clinic-id'];
            const { id } = req.params;
            const { status } = req.body;
            const result = await TaskService.updateTaskStatus(clinicId, id, status);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async completeTask(req, res) {
        try {
            const clinicId = req.user?.clinicId || req.headers['x-clinic-id'];
            const { id } = req.params;
            const result = await TaskService.completeTask(clinicId, id);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async getSummary(req, res) {
        try {
            const clinicId = req.user?.clinicId || req.headers['x-clinic-id'];
            const result = await TaskService.getSummary(clinicId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
