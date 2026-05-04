import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN_GLOBAL' | 'CLINIC_ADMIN' | 'USER' | 'OWNER' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
    permissions?: any;
    clinicId?: string;
    hasSeenOnboarding?: boolean;
    clinic?: {
        name: string;
    };
    mustChangePassword?: boolean;
    lastLoginAt?: Date | string | null;
    isFirstAccess?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User, refreshToken?: string) => void;
    logout: () => void;
    completeOnboarding: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('heath_finance_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const channel = new BroadcastChannel('rares360_auth');
        channel.onmessage = (event) => {
            if (event.data?.type === 'LOGOUT') {
                logout(false);
            }
        };
        return () => channel.close();
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const response = await authApi.me();
                    setUser(response.data);
                } catch (error: any) {
                    console.error('Failed to load user', error);
                    // Não desloga se for apenas um erro de 403 (troca de senha necessária)
                    if (error.response?.status !== 403) {
                        logout(false);
                    }
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);


    const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
        localStorage.setItem('heath_finance_token', newToken);
        if (newRefreshToken) {
            localStorage.setItem('heath_finance_refresh_token', newRefreshToken);
        }
        if (newUser.clinicId) {
            localStorage.setItem('heath_finance_clinic_id', newUser.clinicId);
        }
        setToken(newToken);
        setUser(newUser);
    };

    const logout = (broadcast = true) => {
        localStorage.removeItem('heath_finance_token');
        localStorage.removeItem('heath_finance_refresh_token');
        localStorage.removeItem('heath_finance_clinic_id');
        localStorage.removeItem('heath_finance_active_clinic_id');
        setToken(null);
        setUser(null);
        if (broadcast) {
            const channel = new BroadcastChannel('rares360_auth');
            channel.postMessage({ type: 'LOGOUT' });
            channel.close();
        }
    };

    const completeOnboarding = () => {
        if (user) {
            setUser({ ...user, hasSeenOnboarding: true });
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            completeOnboarding,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
