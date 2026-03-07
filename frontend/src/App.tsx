import Sidebar from './components/Sidebar';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BillingPage from './pages/Billing';
import PatientsPage from './pages/Patients';
import ExpensesBilling from './pages/Analytics/ExpensesBilling';
import PayablesPage from './pages/Financial/Payables';
import ReceivablesPage from './pages/Financial/Receivables';
import DREPage from './pages/Financial/DRE';
import DFCPage from './pages/Financial/DFC';
import IncomePage from './pages/Financial/Income';
import Inventory from './pages/Inventory';
import CashFlow from './pages/CashFlow';
import Goals from './pages/Goals';
import DocumentsPage from './pages/Documents';

import ProtectedRoute from './components/ProtectedRoute';
import SaaSManagement from './pages/SaaSManagement';
import { useAuth } from './contexts/AuthContext';

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isPublicPage = ['/', '/about', '/login'].includes(location.pathname);

  // Só mostra Sidebar se for Staff/Admin de Clínica e o carregamento terminou
  const showSidebar = !isPublicPage && !loading && user && user.role?.toUpperCase() !== 'ADMIN_GLOBAL';

  // Loading global para rotas privadas durante a recuperação da sessão
  if (loading && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EAD6]">
        <div className="w-12 h-12 border-4 border-[#8A9A5B]/20 border-t-[#8A9A5B] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isPublicPage ? 'bg-white' : 'bg-[#F0EAD6]'}`}>
      {showSidebar && <Sidebar />}
      <main className={`flex-1 transition-all duration-300 ${isPublicPage ? 'ml-0' : (showSidebar ? 'ml-72 p-8 lg:p-12' : 'p-0')}`}>
        <div className={isPublicPage ? '' : (showSidebar ? 'max-w-7xl mx-auto' : '')}>
          <Routes>
            {/* Public Routes - Auto-redirect if logged in */}
            <Route path="/" element={
              user ? <Navigate to={user.role?.toUpperCase() === 'ADMIN_GLOBAL' ? "/saas-dashboard" : "/dashboard"} replace /> : <LandingPage />
            } />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={
              user ? <Navigate to={user.role?.toUpperCase() === 'ADMIN_GLOBAL' ? "/saas-dashboard" : "/dashboard"} replace /> : <LoginPage />
            } />

            {/* SaaS Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN_GLOBAL']} />}>
              <Route path="/saas-dashboard" element={<SaaSManagement />} />
            </Route>

            {/* Clinic Private Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CLINIC_ADMIN', 'USER']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/despesas-faturamento" element={<ExpensesBilling />} />
              <Route path="/cash-flow" element={<CashFlow />} />
              <Route path="/receivables" element={<ReceivablesPage />} />
              <Route path="/payables" element={<PayablesPage />} />
              <Route path="/income" element={<IncomePage />} />
              <Route path="/dre" element={<DREPage />} />
              <Route path="/dfc" element={<DFCPage />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/documents" element={<DocumentsPage />} />
            </Route>

            {/* Redirects */}
            <Route path="*" element={<Navigate to={user?.role?.toUpperCase() === 'ADMIN_GLOBAL' ? "/saas-dashboard" : "/dashboard"} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
