import { Response, NextFunction } from 'express';

/**
 * Middleware para garantir que uma clínica foi selecionada no contexto da requisição.
 * Suporta ADMIN_GLOBAL passando via header x-clinic-id ou sessão normal.
 */
export const requireClinicContext = (req: any, res: Response, next: NextFunction) => {
  const clinicId =
    req.headers['x-clinic-id'] ||       // ADMIN_GLOBAL passando via header
    req.user?.adminAccessContext?.clinicId || // Contexto de impersonate/admin
    req.user?.activeClinicId ||           // sessão normal
    req.user?.clinicId;                   // CLINIC_ADMIN

  if (!clinicId) {
    // Retornar 400 claro em vez de 401 (que dispara o retry do interceptor)
    return res.status(400).json({
      error: 'CLINIC_CONTEXT_REQUIRED',
      message: 'Selecione uma clínica antes de acessar este recurso.',
    });
  }

  req.clinicContext = { clinicId };
  req.clinicId = clinicId; // Garantir compatibilidade com outros middlewares
  next();
};
