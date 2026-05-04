import { Request, Response } from 'express';
import { CompraInteligenciaService } from '../services/CompraInteligenciaService.js';
import { createAuditLog } from '../lib/auditLogger.js';

export class InteligenciaComprasController {
    
    // ═══ GET PRIORIDADE (COM CACHE) ═══
    static async getPrioridade(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const setorId = req.query.setorId as string | undefined;
            const minScore = req.query.minScore ? Number(req.query.minScore) : undefined;

            const resultado = await CompraInteligenciaService.calcularPrioridades(clinicId, setorId, minScore);

            return res.json(resultado);
        } catch (error: any) {
            console.error('[INTELIGENCIA_COMPRAS] Erro ao calcular prioridade:', error);
            return res.status(500).json({ error: 'Erro ao calcular prioridade de compras' });
        }
    }

    // ═══ POST EXPORTAR ═══
    static async exportar(req: Request, res: Response) {
        try {
            const clinicId = (req as any).clinicId;
            const userId = (req as any).userId;
            const { formato, setorIds } = req.body;

            if (!['PDF', 'EXCEL'].includes(formato)) {
                return res.status(400).json({ error: 'Formato inválido. Use PDF ou EXCEL.' });
            }

            // TODO: Aqui integraríamos puppeteer/exceljs. Por enquanto retorna placeholder.
            // Para manter o escopo, retornaremos uma confirmação que o front pode usar.
            
            await createAuditLog({
                action: 'EXPORT', userId, req, clinicId,
                entity: 'InteligenciaCompras', entityId: 'bulk',
                newValues: { formato, setorIds }
            });

            return res.json({ 
                message: `Relatório em ${formato} solicitado com sucesso.`,
                url: `/exports/compras-${Date.now()}.${formato === 'PDF' ? 'pdf' : 'xlsx'}` // placeholder
            });
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao exportar relatório' });
        }
    }
}
