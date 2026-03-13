import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UploadController } from '../controllers/UploadController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
const router = Router();
// Garantir que a pasta exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });
router.use(authMiddleware);
// Rota de upload único
router.post('/', upload.single('file'), UploadController.uploadFile);
export default router;
