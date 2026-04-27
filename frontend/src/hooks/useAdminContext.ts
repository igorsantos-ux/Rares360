import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { saasApi } from '../services/api';

const TOKEN_KEY = 'heath_finance_token';

export interface AdminAccessContextData {
    isAdminAccess: boolean;
    clinicId: string | null;
    clinicName: string | null;
    accessStartedAt: Date | null;
    adminName: string;
    adminEmail: string;
    sessionDuration: string;
}

const EMPTY_CONTEXT: AdminAccessContextData = {
    isAdminAccess: false,
    clinicId: null,
    clinicName: null,
    accessStartedAt: null,
    adminName: '',
    adminEmail: '',
    sessionDuration: '0min'
};

export function useAdminContext() {
    const [context, setContext] = useState<AdminAccessContextData>(EMPTY_CONTEXT);

    const updateContext = useCallback(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setContext(EMPTY_CONTEXT);
            return;
        }

        try {
            const decoded: any = jwtDecode(token);
            const adminAccess = decoded?.adminAccessContext;

            if (adminAccess) {
                const startedAtDate = new Date(adminAccess.accessStartedAt);

                setContext(prev => ({
                    ...prev,
                    isAdminAccess: true,
                    clinicId: adminAccess.clinicId,
                    clinicName: adminAccess.clinicName,
                    accessStartedAt: startedAtDate,
                    adminName: adminAccess.adminName,
                    adminEmail: adminAccess.adminEmail,
                }));
            } else {
                setContext(EMPTY_CONTEXT);
            }
        } catch (error) {
            console.error('Erro ao decodificar token', error);
            setContext(EMPTY_CONTEXT);
        }
    }, []);

    useEffect(() => {
        updateContext();

        // Reavaliar quando o storage muda (logout em outra aba, etc.)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === TOKEN_KEY || e.key === null) {
                updateContext();
            }
        };

        // Polling para detectar mudanças no token na mesma aba
        // (storage event não dispara na mesma aba que fez a mudança)
        const intervalId = setInterval(updateContext, 2000);

        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(intervalId);
        };
    }, [updateContext]);

    useEffect(() => {
        if (!context.isAdminAccess || !context.accessStartedAt) return;

        const updateTimer = () => {
            const now = new Date();
            const diffMs = now.getTime() - context.accessStartedAt!.getTime();
            const diffMinutes = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;

            let durationStr = `${diffMinutes}min`;
            if (hours > 0) {
                durationStr = `${hours}h ${minutes}min`;
            }

            setContext(prev => ({
                ...prev,
                sessionDuration: durationStr
            }));
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 60000);

        return () => clearInterval(intervalId);
    }, [context.isAdminAccess, context.accessStartedAt]);

    const exitAdminAccess = async () => {
        try {
            const res = await saasApi.adminClinicExit();
            if (res.data.token) {
                localStorage.setItem(TOKEN_KEY, res.data.token);
                // Limpar estado imediatamente
                setContext(EMPTY_CONTEXT);
                window.location.href = res.data.redirectTo || '/saas-dashboard';
            } else {
                // Token não retornado — limpar e redirecionar
                setContext(EMPTY_CONTEXT);
                window.location.href = '/saas-dashboard';
            }
        } catch (error) {
            console.error('Falha ao encerrar acesso admin:', error);
            // Fallback: limpar estado de impersonação e redirecionar
            setContext(EMPTY_CONTEXT);
            window.location.href = '/saas-dashboard';
        }
    };

    return {
        ...context,
        exitAdminAccess
    };
}
