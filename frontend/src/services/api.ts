import axios from 'axios';

const getBaseURL = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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

// Interceptor para injetar o token JWT e o clinicId
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('heath_finance_token');
    const clinicId = localStorage.getItem('heath_finance_clinic_id');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (clinicId) {
        config.headers['x-clinic-id'] = clinicId;
    }

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
    completeOnboarding: () => api.patch('auth/onboarding'),
};

export const saasApi = {
    getClinics: () => api.get('saas/clinics'),
    createClinic: (data: any) => api.post('saas/clinics', data),
    getUsers: () => api.get('saas/users'),
    createUser: (data: any) => api.post('saas/users', data),
    getBilling: () => api.get('saas/billing'),
    generateMonthlyInvoices: () => api.post('saas/billing/generate'),
    getClinicInvoices: (clinicId: string) => api.get(`saas/billing/${clinicId}/invoices`),
    updateClinic: (id: string, data: any) => api.patch(`saas/clinics/${id}`, data),
    deleteClinic: (id: string) => api.delete(`saas/clinics/${id}`),
    updateUser: (id: string, data: any) => api.patch(`saas/users/${id}`, data),
    deleteUser: (id: string) => api.delete(`saas/users/${id}`),
    uploadLogo: (formData: FormData) => api.post('saas/clinics/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    downloadInvoicePDF: (clinicId: string) => api.get(`saas/billing/${clinicId}/pdf`, { responseType: 'blob' }),
    getInvoicePDFUrl: (clinicId: string) => `${api.defaults.baseURL}/saas/billing/${clinicId}/pdf`,
    getInvoiceXMLUrl: (clinicId: string) => `${api.defaults.baseURL}/saas/billing/${clinicId}/xml`,
};

export const financialApi = {
    getSummary: (params?: { startDate?: string; endDate?: string }) => api.get('financial/summary', { params }),
    getBreakEven: (params?: { startDate?: string; endDate?: string }) => api.get('financial/break-even', { params }),
    getEvolution: (params?: { startDate?: string; endDate?: string }) => api.get('financial/evolution', { params }),
    getDailyEvolution: (params?: { startDate?: string; endDate?: string }) => api.get('financial/daily-evolution', { params }),
    getTransactions: (params?: { startDate?: string; endDate?: string }) => api.get('financial/transactions', { params }),
    createTransaction: (data: any) => api.post('financial/transactions', data),
};

export const payablesApi = {
    getPayables: (params?: { page?: number; limit?: number; filter?: string; search?: string; startDate?: string; endDate?: string }) => 
        api.get('contas-a-pagar', { params }),
    createPayable: (data: any) => api.post('contas-a-pagar', data),
    updatePayableStatus: (id: string, status: string) => api.patch(`contas-a-pagar/${id}/status`, { status }),
    deletePayable: (id: string) => api.delete(`contas-a-pagar/${id}`),
    deletePayableSeries: (id: string) => api.delete(`contas-a-pagar/series/${id}`),
    uploadFile: (formData: FormData) => api.post('upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const receivablesApi = {
    getReceivables: (params?: { page?: number; limit?: number; filter?: string; search?: string; startDate?: string; endDate?: string }) => 
        api.get('pendenciais', { params }),
    createReceivable: (data: any) => api.post('pendenciais', data),
    updateReceivableStatus: (id: string, status: string) => api.patch(`pendenciais/${id}/status`, { status }),
    deleteReceivable: (id: string) => api.delete(`pendenciais/${id}`),
};

export const coreApi = {
    getPatients: () => api.get('core/patients'),
    getPatientById: (id: string) => api.get(`core/patients/${id}`),
    createPatient: (data: any) => api.post('core/patients', data),
    updatePatient: (id: string, data: any) => api.patch(`core/patients/${id}`, data),
    deletePatient: (id: string) => api.delete(`core/patients/${id}`),
    getDoctors: () => api.get('core/doctors'),
    createDoctor: (data: any) => api.post('core/doctors', data),
    updateDoctor: (id: string, data: any) => api.patch(`core/doctors/${id}`, data),
    deleteDoctor: (id: string) => api.delete(`core/doctors/${id}`),
    getStock: () => api.get('core/stock'),
    getProductivity: () => api.get('core/productivity'),
    createStockItem: (data: any) => api.post('core/stock', data),
    registerStockMovement: (data: any) => api.post('core/stock/movement', data),
    getStockHistory: () => api.get('core/stock/history'),
};

export const pepApi = {
    // Evoluções
    getEvolutions: (patientId: string) => api.get(`pep/evolutions?patientId=${patientId}`),
    createEvolution: (data: any) => api.post('pep/evolutions', data),
    updateEvolution: (id: string, data: any) => api.patch(`pep/evolutions/${id}`, data),
    lockEvolution: (id: string) => api.post(`pep/evolutions/${id}/lock`),

    // Prescrições
    getPrescriptions: (patientId: string) => api.get(`pep/prescriptions?patientId=${patientId}`),
    createPrescription: (data: any) => api.post('pep/prescriptions', data),
    markPrescriptionPrinted: (id: string) => api.patch(`pep/prescriptions/${id}/print`),

    // Uso de Insumos
    getInventoryUsage: (patientId: string) => api.get(`pep/inventory-usage?patientId=${patientId}`),
    registerInventoryUsage: (data: any) => api.post('pep/inventory-usage', data),

    // Propostas
    getProposals: (patientId: string) => api.get(`pep/proposals?patientId=${patientId}`),
    createProposal: (data: any) => api.post('pep/proposals', data),
    updateProposalStatus: (id: string, status: string) => api.patch(`pep/proposals/${id}/status`, { status }),
};

export const reportingApi = {
    getDashboard: () => api.get('reporting/dashboard'),
    getDashboardKPIs: () => api.get('reporting/dashboard-kpis'),
    getCashFlow: (params?: { startDate?: string; endDate?: string }) => api.get('reporting/cash-flow', { params }),
    getDRE: (params?: { startDate?: string; endDate?: string }) => api.get('reporting/dre', { params }),
    getBillingAnalytics: (params?: { startDate?: string; endDate?: string; groupBy?: string }) => {
        const query = new URLSearchParams();
        if (params?.startDate) query.append('startDate', params.startDate);
        if (params?.endDate) query.append('endDate', params.endDate);
        if (params?.groupBy) query.append('groupBy', params.groupBy);
        return api.get(`reporting/billing-analytics?${query.toString()}`);
    },
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

export const pricingApi = {
    createSimulation: (data: any) => api.post('pricing', data),
    getSimulations: () => api.get('pricing'),
    getDiagnosis: (params?: { startDate?: string; endDate?: string }) => api.get('pricing/diagnosis', { params }),
    upsertProcedure: (data: any) => api.post('pricing/procedure', data),
    deleteProcedure: (id: string) => api.delete(`pricing/procedure/${id}`),
};

export const complianceApi = {
    getDocuments: () => api.get('compliance'),
    updateDocument: (id: string, data: any) => api.patch(`compliance/${id}`, data),
    deleteDocument: (id: string) => api.delete(`compliance/${id}`),
};

export const proceduresApi = {
    getPending: () => api.get('procedures/pending'),
    getByPatient: (patientId: string) => api.get(`procedures/patient/${patientId}`),
    execute: (id: string) => api.post(`procedures/${id}/execute`),
};

export const tasksApi = {
    getDaily: () => api.get('tasks/daily'),
    getSummary: () => api.get('tasks/summary'),
    complete: (id: string) => api.patch(`tasks/${id}/complete`),
};

export const leadsApi = {
    createLead: (data: any) => api.post('leads', data),
    getLeads: () => api.get('leads'),
    updateStatus: (id: string, status: string) => api.patch(`leads/${id}/status`, { status }),
    updateNotes: (id: string, notes: string) => api.patch(`leads/${id}/notes`, { notes }),
};

export const appointmentsApi = {
    getAppointments: (params?: any) => api.get('appointments', { params }),
    createAppointment: (data: any) => api.post('appointments', data),
    updateAppointment: (id: string, data: any) => api.put(`appointments/${id}`, data),
    deleteAppointment: (id: string) => api.delete(`appointments/${id}`),
    getResources: () => api.get('appointments/resources'),
};

export const goalsApi = {
    getSummary: () => api.get('goals/summary'),
    getList: (monthYear: string) => api.get(`goals/list/${monthYear}`),
    save: (data: any) => api.post('goals/save', data),
    delete: (id: string) => api.delete(`goals/${id}`),
};

export const clinicApi = {
    getMe: () => api.get('clinic/me'),
    getAll: () => api.get('clinic/all'),
    updateMe: (data: any) => api.patch('clinic/me', data),
    uploadLogo: (formData: FormData) => api.post('saas/clinics/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default api;
