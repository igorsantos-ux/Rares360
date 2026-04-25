import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export interface AdminAccessContextData {
    isAdminAccess: boolean;
    clinicId: string | null;
    clinicName: string | null;
    accessStartedAt: Date | null;
    adminName: string;
    adminEmail: string;
    sessionDuration: string;
}

export function useAdminContext() {
    const [context, setContext] = useState<AdminAccessContextData>({
        isAdminAccess: false,
        clinicId: null,
        clinicName: null,
        accessStartedAt: null,
        adminName: '',
        adminEmail: '',
        sessionDuration: '0min'
    });

    useEffect(() => {
        const updateContext = () => {
            const token = localStorage.getItem('token');
            if (!token) return;

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
                    setContext({
                        isAdminAccess: false,
                        clinicId: null,
                        clinicName: null,
                        accessStartedAt: null,
                        adminName: '',
                        adminEmail: '',
                        sessionDuration: '0min'
                    });
                }
            } catch (error) {
                console.error('Erro ao decodificar token', error);
            }
        };

        updateContext();
        window.addEventListener('storage', updateContext);

        return () => {
            window.removeEventListener('storage', updateContext);
        };
    }, []);

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

        updateTimer(); // Initial call
        const intervalId = setInterval(updateTimer, 60000); // 1 minuto

        return () => clearInterval(intervalId);
    }, [context.isAdminAccess, context.accessStartedAt]);

    const exitAdminAccess = async () => {
        try {
            const res = await api.post('/api/admin/clinic-exit');
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                window.location.href = res.data.redirectTo || '/saas-dashboard';
            }
        } catch (error) {
            console.error('Falha ao encerrar acesso admin:', error);
            // Fallback em caso de erro de rede ou sessão já expirada no servidor
            window.location.href = '/saas-dashboard';
        }
    };

    return {
        ...context,
        exitAdminAccess
    };
}
