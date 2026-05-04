import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UploadController } from '../controllers/UploadController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(authMiddleware);

// Rota de upload único
router.post('/', upload.single('file'), UploadController.uploadFile);

export default router;
