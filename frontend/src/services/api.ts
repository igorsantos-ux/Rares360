import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor para injetar o token JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('heath_finance_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (data: any) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
};

export const saasApi = {
    getClinics: () => api.get('/saas/clinics'),
    createClinic: (data: any) => api.post('/saas/clinics', data),
    getUsers: () => api.get('/saas/users'),
    createUser: (data: any) => api.post('/saas/users', data),
    getBilling: () => api.get('/saas/billing'),
    updateClinic: (id: string, data: any) => api.patch(`/saas/clinics/${id}`, data),
    getInvoicePDFUrl: (clinicId: string) => `${api.defaults.baseURL}/saas/billing/${clinicId}/pdf`,
    getInvoiceXMLUrl: (clinicId: string) => `${api.defaults.baseURL}/saas/billing/${clinicId}/xml`,
};

export const financialApi = {
    getSummary: () => api.get('/financial/summary'),
    getBreakEven: () => api.get('/financial/break-even'),
    getEvolution: () => api.get('/financial/evolution'),
    createTransaction: (data: any) => api.post('/financial/transactions', data),
};

export const coreApi = {
    getPatients: () => api.get('/core/patients'),
    getDoctors: () => api.get('/core/doctors'),
    getStock: () => api.get('/core/stock'),
    getProductivity: () => api.get('/core/productivity'),
    createDoctor: (data: any) => api.post('/core/doctors', data),
};

export const reportingApi = {
    getDashboardKPIs: () => api.get('/reporting/dashboard-kpis'),
    getCashFlow: () => api.get('/reporting/cash-flow'),
    getDRE: () => api.get('/reporting/dre'),
    getBillingAnalytics: () => api.get('/reporting/billing-analytics'),
    getGoals: () => api.get('/reporting/goals'),
    postSmartGoal: (targetProfit: number) => api.post('/reporting/smart-goal', { targetProfit }),
};

export const historyApi = {
    getSummary: () => api.get('/history/summary'),
    getWeekly: (month: number) => api.get(`/history/weekly?month=${month}`),
    getProcedures: () => api.get('/history/procedures'),
};

export const analyticsApi = {
    getInsights: () => api.get('/analytics/insights'),
};

export default api;
