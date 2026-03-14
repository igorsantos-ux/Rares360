import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BillingPage from './pages/Billing';
import PatientsPage from './pages/Patients';
import ExpensesBilling from './pages/Analytics/ExpensesBilling';
import PayablesPage from './pages/Financial/Payables';
import PendenciaisPage from './pages/Financial/Pendenciais';
import DREPage from './pages/Financial/DRE';
import DFCPage from './pages/Financial/DFC';
import IncomePage from './pages/Financial/Income';
import Inventory from './pages/Inventory';
import CashFlow from './pages/CashFlow';
import Goals from './pages/Goals';
import DocumentsPage from './pages/Documents';
import Pricing from './pages/Pricing';

import ProtectedRoute from './components/ProtectedRoute';
import SaaSManagement from './pages/SaaSManagement';
import Automations from './pages/Automations';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isPublicPage = ['/', '/about', '/login'].includes(location.pathname);

  // Só mostra Header se for Staff/Admin de Clínica e o carregamento terminou
  const showHeader = !isPublicPage && !loading && user && user.role?.toUpperCase() !== 'ADMIN_GLOBAL';

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
      <Toaster position="top-right" />
      
      {/* Sidebar Fixa para Desktop */}
      {showHeader && (
        <div className="hidden lg:block w-72 shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {showHeader && <Header />}
        
        <main className={`flex-1 transition-all duration-300 ${isPublicPage ? 'p-0' : (showHeader ? 'p-8 lg:p-12' : 'p-0')}`}>
          <div className={isPublicPage ? '' : (showHeader ? 'max-w-7xl mx-auto' : '')}>
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
                <Route path="/pendenciais" element={<PendenciaisPage />} />
                <Route path="/payables" element={<PayablesPage />} />
                <Route path="/income" element={<IncomePage />} />
                <Route path="/dre" element={<DREPage />} />
                <Route path="/dfc" element={<DFCPage />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/automations" element={<Automations />} />
              </Route>

              {/* Redirects */}
              <Route path="*" element={<Navigate to={user?.role?.toUpperCase() === 'ADMIN_GLOBAL' ? "/saas-dashboard" : "/dashboard"} replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
