export class UploadController {
    static async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }
            // O multer salva o arquivo na pasta 'uploads' pre-definida na rota
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            return res.json({
                message: 'Arquivo enviado com sucesso',
                fileUrl: fileUrl,
                fileName: req.file.filename,
                originalName: req.file.originalname
            });
        }
        catch (error) {
            console.error('Erro no upload de arquivo:', error);
            return res.status(500).json({ message: 'Erro ao processar upload', error: error.message });
        }
    }
}
