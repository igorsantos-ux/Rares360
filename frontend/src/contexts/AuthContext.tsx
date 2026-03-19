import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN_GLOBAL' | 'CLINIC_ADMIN' | 'USER';
    clinicId?: string;
    hasSeenOnboarding?: boolean;
    clinic?: {
        name: string;
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
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
        const loadUser = async () => {
            if (token) {
                try {
                    const response = await authApi.me();
                    setUser(response.data);
                } catch (error) {
                    console.error('Failed to load user', error);
                    logout();
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('heath_finance_token', newToken);
        if (newUser.clinicId) {
            localStorage.setItem('heath_finance_clinic_id', newUser.clinicId);
        }
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('heath_finance_token');
        localStorage.removeItem('heath_finance_clinic_id');
        setToken(null);
        setUser(null);
    };

    const completeOnboarding = () => {
        if (user) {
            setUser({ ...user, hasSeenOnboarding: true });
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, completeOnboarding, loading }}>
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
