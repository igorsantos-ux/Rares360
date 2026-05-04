import { Request, Response } from 'express';
import { storageProvider } from '../lib/StorageService.js';

export class UploadController {
    static async uploadFile(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            const file = req.file;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `uploads/${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`;

            // Upload para o S3/R2
            const fileUrl = await storageProvider.upload(
                fileName,
                file.buffer,
                file.mimetype
            );

            return res.json({
                message: 'Arquivo enviado com sucesso para o storage remoto',
                fileUrl: fileUrl,
                fileName: fileName,
                originalName: file.originalname
            });

        } catch (error: any) {
            console.error('Erro no upload de arquivo para S3:', error);
            return res.status(500).json({ message: 'Erro ao processar upload para storage remoto', error: error.message });
        }
    }
}
