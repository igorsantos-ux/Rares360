import { Router } from 'express';
import { SetorController } from '../controllers/SetorController.js';

const router = Router();

router.get('/', SetorController.list);
router.post('/', SetorController.create);
router.put('/:id', SetorController.update);
router.delete('/:id', SetorController.delete);

export default router;
