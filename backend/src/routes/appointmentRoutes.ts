import { Router } from 'express';
import { AppointmentController } from '../controllers/AppointmentController.js';

const router = Router();

router.get('/', AppointmentController.list);
router.post('/', AppointmentController.create);
router.put('/:id', AppointmentController.update);
router.delete('/:id', AppointmentController.delete);
router.get('/resources', AppointmentController.getResources);

export default router;
