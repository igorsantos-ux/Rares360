import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();

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

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={user.role?.toUpperCase() === 'ADMIN_GLOBAL' ? "/saas-dashboard" : "/dashboard"} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
