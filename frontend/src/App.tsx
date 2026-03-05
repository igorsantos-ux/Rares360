import Sidebar from './components/Sidebar';
import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 ml-72 p-8 lg:p-12 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
