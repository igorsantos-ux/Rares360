import { ProcedureService } from '../services/ProcedureService.js';
export class ProcedureController {
    static async list(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            if (!clinicId)
                return res.status(401).json({ message: 'Clínica não identificada' });
            const { page, limit, category, search } = req.query;
            const result = await ProcedureService.list(clinicId, {
                page: Number(page) || 1,
                limit: Number(limit) || 1000,
                category: category,
                search: search
            });
            return res.json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async create(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            if (!clinicId)
                return res.status(401).json({ message: 'Clínica não identificada' });
            const item = await ProcedureService.create(clinicId, req.body);
            return res.status(201).json(item);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async update(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            const { id } = req.params;
            if (!clinicId)
                return res.status(401).json({ message: 'Clínica não identificada' });
            const item = await ProcedureService.update(id, clinicId, req.body);
            return res.json(item);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            const { id } = req.params;
            if (!clinicId)
                return res.status(401).json({ message: 'Clínica não identificada' });
            await ProcedureService.delete(id, clinicId);
            return res.status(204).send();
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async getById(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            const { id } = req.params;
            if (!clinicId)
                return res.status(401).json({ message: 'Clínica não identificada' });
            const item = await ProcedureService.getById(id, clinicId);
            if (!item)
                return res.status(404).json({ message: 'Procedimento não encontrado' });
            return res.json(item);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async listPending(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            if (!clinicId)
                return res.status(401).json({ message: 'Clínica não identificada' });
            const result = await ProcedureService.listPending(clinicId);
            return res.json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async getByPatient(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            const { patientId } = req.params;
            if (!clinicId)
                return res.status(401).json({ message: 'Clínica não identificada' });
            const result = await ProcedureService.getByPatient(clinicId, patientId);
            return res.json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    static async execute(req, res) {
        try {
            const clinicId = req.user?.clinicId;
            const { id } = req.params;
            if (!clinicId)
                return res.status(401).json({ message: 'Clínica não identificada' });
            const result = await ProcedureService.execute(id, clinicId);
            return res.json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
