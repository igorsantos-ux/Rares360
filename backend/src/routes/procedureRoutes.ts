import { Router } from 'express';
import { ProcedureController } from '../controllers/ProcedureController.js';

const router = Router();

// Catálogo de Procedimentos (CRUD e Precificação)
router.get('/', ProcedureController.list);
router.post('/', ProcedureController.create);
router.get('/:id', ProcedureController.getById);
router.put('/:id', ProcedureController.update);
router.delete('/:id', ProcedureController.delete);

// Execução Clínica (Legado)
router.get('/pending', ProcedureController.listPending);
router.get('/patient/:patientId', ProcedureController.getByPatient);
router.post('/:id/execute', ProcedureController.execute);

// ═══ Categorias de Procedimento ═══
router.get('/categorias', ProcedureController.listCategorias);
router.post('/categorias', ProcedureController.createCategoria);
router.put('/categorias/:id', ProcedureController.updateCategoria);
router.delete('/categorias/:id', ProcedureController.deleteCategoria);

// ═══ Insumos vinculados ═══
router.get('/:procedureId/insumos', ProcedureController.listInsumos);
router.post('/:procedureId/insumos', ProcedureController.addInsumo);
router.put('/insumos/:insumoId', ProcedureController.updateInsumo);
router.delete('/insumos/:insumoId', ProcedureController.removeInsumo);

// ═══ Cálculo de margem ═══
router.get('/:procedureId/margem', ProcedureController.calcularMargem);

export default router;
