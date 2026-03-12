import axios from 'axios';

const getBaseURL = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove barras duplicadas no final
    url = url.replace(/\/+$/, '');
    // Garante que termine com /api
    if (!url.endsWith('/api')) {
        url = `${url}/api`;
    }
    return url;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Interceptor para injetar o token JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('heath_finance_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Log para depuração (remover em produção se necessário)
    console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.baseURL}/${config.url}`);
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('❌ API Error:', {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (data: any) => api.post('auth/login', data),
    me: () => api.get('auth/me'),
};

export const saasApi = {
    getClinics: () => api.get('saas/clinics'),
    createClinic: (data: any) => api.post('saas/clinics', data),
    getUsers: () => api.get('saas/users'),
    createUser: (data: any) => api.post('saas/users', data),
    getBilling: () => api.get('saas/billing'),
    updateClinic: (id: string, data: any) => api.patch(`saas/clinics/${id}`, data),
    deleteClinic: (id: string) => api.delete(`saas/clinics/${id}`),
    updateUser: (id: string, data: any) => api.patch(`saas/users/${id}`, data),
    uploadLogo: (formData: FormData) => api.post('saas/clinics/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getInvoicePDFUrl: (clinicId: string) => `${api.defaults.baseURL}/saas/billing/${clinicId}/pdf`,
    getInvoiceXMLUrl: (clinicId: string) => `${api.defaults.baseURL}/saas/billing/${clinicId}/xml`,
};

export const financialApi = {
    getSummary: () => api.get('financial/summary'),
    getBreakEven: () => api.get('financial/break-even'),
    getEvolution: () => api.get('financial/evolution'),
    getTransactions: () => api.get('financial/transactions'),
    createTransaction: (data: any) => api.post('financial/transactions', data),
};

export const payablesApi = {
    getPayables: (params?: { page?: number; limit?: number; filter?: string; search?: string }) => 
        api.get('contas-a-pagar', { params }),
    createPayable: (data: any) => api.post('contas-a-pagar', data),
};

export const coreApi = {
    getPatients: () => api.get('core/patients'),
    getDoctors: () => api.get('core/doctors'),
    getStock: () => api.get('core/stock'),
    getProductivity: () => api.get('core/productivity'),
    createDoctor: (data: any) => api.post('core/doctors', data),
};

export const reportingApi = {
    getDashboardKPIs: () => api.get('reporting/dashboard-kpis'),
    getCashFlow: () => api.get('reporting/cash-flow'),
    getDRE: () => api.get('reporting/dre'),
    getBillingAnalytics: () => api.get('reporting/billing-analytics'),
    getGoals: () => api.get('reporting/goals'),
    postSmartGoal: (targetProfit: number) => api.post('reporting/smart-goal', { targetProfit }),
};

export const historyApi = {
    getSummary: () => api.get('history/summary'),
    getWeekly: (month: number) => api.get(`history/weekly?month=${month}`),
    getProcedures: () => api.get('history/procedures'),
};

export const analyticsApi = {
    getInsights: () => api.get('analytics/insights'),
};

export const integrationApi = {
    getIntegrations: () => api.get('integrations'),
    saveIntegration: (data: any) => api.post('integrations/save', data),
    testConnection: (data: any) => api.post('integrations/test', data),
    sync: (module?: string) => api.post(`integrations/sync${module ? `?module=${module}` : ''}`),
};

export default api;
