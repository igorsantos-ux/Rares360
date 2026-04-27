import { GoalService } from '../services/GoalService.js';
export class GoalController {
    static async getSummary(req, res) {
        try {
            const stats = await GoalService.getStats(req.clinicId);
            res.json(stats);
        }
        catch (error) {
            console.error('[GoalController.getSummary] Error:', error);
            res.status(500).json({ error: 'Erro ao buscar resumo de metas', message: error.message });
        }
    }
    static async getMonthlyList(req, res) {
        try {
            const { monthYear } = req.params;
            const goals = await GoalService.getMonthlyGoals(req.clinicId, monthYear);
            res.json(goals);
        }
        catch (error) {
            console.error('[GoalController.getMonthlyList] Error:', error);
            res.status(500).json({ error: 'Erro ao listar metas', message: error.message });
        }
    }
    static async saveGoal(req, res) {
        try {
            const { id, name, type, targetValue, workingDays, monthYear, isPrimary } = req.body;
            const saved = await GoalService.saveGoal(req.clinicId, {
                id,
                name,
                type: type,
                targetValue: Number(targetValue),
                workingDays: workingDays ? Number(workingDays) : undefined,
                monthYear,
                isPrimary: Boolean(isPrimary)
            });
            res.json(saved);
        }
        catch (error) {
            console.error('[GoalController.saveGoal] Error details:', error);
            res.status(500).json({
                error: 'Erro ao salvar meta',
                message: error.message,
                details: error
            });
        }
    }
    static async deleteGoal(req, res) {
        try {
            const { id } = req.params;
            await GoalService.deleteGoal(req.clinicId, id);
            res.status(204).send();
        }
        catch (error) {
            console.error('[GoalController.deleteGoal] Error:', error);
            res.status(500).json({ error: 'Erro ao excluir meta', message: error.message });
        }
    }
}
