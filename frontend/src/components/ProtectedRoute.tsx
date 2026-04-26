import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminContext } from '../hooks/useAdminContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const { isAdminAccess } = useAdminContext();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F0EAD6]">
                <div className="w-12 h-12 border-4 border-[#8A9A5B]/30 border-t-[#8A9A5B] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.mustChangePassword) {
        return <Navigate to="/auth/force-change-password" replace />;
    }

    // Se estiver em modo AdminAccess, bloqueia o painel SaaS
    const location = window.location.pathname;
    if (isAdminAccess && location === '/saas-dashboard') {
        return <Navigate to="/dashboard" replace />;
    }

    if (allowedRoles) {
        if (!allowedRoles.includes(user.role)) {
            // Se for um ADMIN_GLOBAL tentando acessar rotas que não tem,
            // valida se ele está com uma sessão contextual ativa.
            if (user.role === 'ADMIN_GLOBAL' && isAdminAccess) {
                // Se ele está no adminAccess e a rota requer roles como OWNER/ADMIN etc
                // Não barra. Permite passar.
            } else {
                return <Navigate to={user.role?.toUpperCase() === 'ADMIN_GLOBAL' ? "/saas-dashboard" : "/dashboard"} replace />;
            }
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
