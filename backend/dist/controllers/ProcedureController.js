import { ProcedureExecutionService } from '../services/ProcedureExecutionService.js';
export class ProcedureController {
    static async execute(req, res) {
        try {
            const clinicId = req.headers['x-clinic-id'];
            const { id } = req.params;
            const result = await ProcedureExecutionService.execute(clinicId, id);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async listPending(req, res) {
        try {
            const clinicId = req.headers['x-clinic-id'];
            const result = await ProcedureExecutionService.listPending(clinicId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getByPatient(req, res) {
        try {
            const clinicId = req.headers['x-clinic-id'];
            const { patientId } = req.params;
            const result = await ProcedureExecutionService.getByPatient(clinicId, patientId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
