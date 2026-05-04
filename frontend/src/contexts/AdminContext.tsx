import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

interface AdminContextType extends AdminAccessContextData {
    exitAdminAccess: () => Promise<void>;
    refreshContext: () => void;
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

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Função auxiliar para carregar o contexto de forma síncrona
const getInitialContext = (): AdminAccessContextData => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return EMPTY_CONTEXT;

    try {
        const decoded: any = jwtDecode(token);
        const adminAccess = decoded?.adminAccessContext;

        if (adminAccess) {
            return {
                ...EMPTY_CONTEXT,
                isAdminAccess: true,
                clinicId: adminAccess.clinicId,
                clinicName: adminAccess.clinicName,
                accessStartedAt: new Date(adminAccess.accessStartedAt),
                adminName: adminAccess.adminName,
                adminEmail: adminAccess.adminEmail,
            };
        }
    } catch (e) {
        console.error('Erro ao decodificar token inicial', e);
    }
    return EMPTY_CONTEXT;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [context, setContext] = useState<AdminAccessContextData>(getInitialContext);

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
            setContext(EMPTY_CONTEXT);
        }
    }, []);

    // Efeito para Polling e Storage Event
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === TOKEN_KEY || e.key === null) {
                updateContext();
            }
        };

        const intervalId = setInterval(updateContext, 2000);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(intervalId);
        };
    }, [updateContext]);

    // Efeito para o Timer da Sessão
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
                setContext(EMPTY_CONTEXT);
                window.location.href = res.data.redirectTo || '/saas-dashboard';
            } else {
                setContext(EMPTY_CONTEXT);
                window.location.href = '/saas-dashboard';
            }
        } catch (error) {
            setContext(EMPTY_CONTEXT);
            window.location.href = '/saas-dashboard';
        }
    };

    return (
        <AdminContext.Provider value={{
            ...context,
            exitAdminAccess,
            refreshContext: updateContext
        }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
