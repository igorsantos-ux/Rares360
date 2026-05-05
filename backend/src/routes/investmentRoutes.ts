import { Router } from 'express';
import { InvestmentController } from '../controllers/InvestmentController.js';

const router = Router();

router.get('/', InvestmentController.list);
router.post('/', InvestmentController.create);
router.get('/:id', InvestmentController.getById);
router.put('/:id', InvestmentController.update);
router.delete('/:id', InvestmentController.delete);
router.post('/simulate', InvestmentController.simulate);

export default router;
