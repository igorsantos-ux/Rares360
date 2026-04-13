import { Router } from 'express';
import { UserManagementController } from '../controllers/UserManagementController.js';
import { authMiddleware, roleMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Apenas OWNER ou ADMIN podem gerenciar equipe
router.use(authMiddleware);
router.use(roleMiddleware(['OWNER', 'ADMIN']));
router.use(tenantMiddleware);

router.get('/users', UserManagementController.listUsers);
router.post('/users', UserManagementController.createUser);
router.put('/users/:id', UserManagementController.updateUser);
router.delete('/users/:id', UserManagementController.deleteUser);

export default router;
