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

import { queryClient } from '../lib/queryClient';

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            console.warn('Sessão expirada. Redirecionando para login...');
            // Limpa o cache do React Query para parar pollings
            queryClient.clear();
            // Remove tokens do storage
            localStorage.removeItem('heath_finance_token');
            localStorage.removeItem('heath_finance_clinic_id');
            // Redireciona via window para garantir reset de estado
            window.location.href = '/login';
        }

        console.error('❌ API Error:', {
            url: error.config?.url,
            status: status,
            message: error.message
        });

        return Promise.reject(error);
    }
);

export const authApi = {
    login: (data: any) => api.post('auth/login', data),
    me: () => api.get('auth/me'),
    completeOnboarding: () => api.patch('auth/onboarding'),
    updatePassword: (data: any, config?: any) => api.post('auth/update-password', data, config),
    logout: () => api.post('auth/logout'),
};

export const saasApi = {
    getClinics: () => api.get('saas/clinics'),
    createClinic: (data: any) => api.post('saas/clinics', data),
    getUsers: () => api.get('saas/users'),
    createUser: (data: any) => api.post('saas/users', data),
    getBilling: () => api.get('saas/billing'),
    generateMonthlyInvoices: () => api.post('saas/billing/generate'),
    getClinicInvoices: (clinicId: string) => api.get(`saas/billing/${clinicId}/invoices`),
    impersonateClinic: (clinicId: string) => api.post(`saas/impersonate/${clinicId}`),
    adminClinicAccess: (clinicId: string) => api.post(`saas/admin/clinic-access`, { clinicId }),
    adminClinicExit: () => api.post(`saas/admin/clinic-exit`),
    getAuditLogs: () => api.get('saas/audit-logs'),
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
    getPatients: (params?: any) => api.get('core/patients', { params }),
    getPatientById: (id: string) => api.get(`core/patients/${id}`),
    getPatientDashboard: (id: string) => api.get(`core/patients/${id}/dashboard`),
    getPatientHistory: (id: string) => api.get(`core/patients/${id}/history`),
    createPatient: (data: any) => api.post('core/patients', data),
    updatePatient: (id: string, data: any) => api.patch(`core/patients/${id}`, data),
    deletePatient: (id: string) => api.delete(`core/patients/${id}`),
    getDoctors: () => api.get('core/doctors'),
    createDoctor: (data: any) => api.post('core/doctors', data),
    updateDoctor: (id: string, data: any) => api.patch(`core/doctors/${id}`, data),
    deleteDoctor: (id: string) => api.delete(`core/doctors/${id}`),

    logSensitiveView: (data: { entity: string, entityId: string, targetField: string }) => api.post('audit/sensitive', data),

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
    updateProposalStatus: (id: string, status: string, data: any = {}) => api.patch(`pep/proposals/${id}/status`, { status, ...data }),
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
    getDrillDown: (params: { type: string; value: string; startDate?: string; endDate?: string }) =>
        api.get('reporting/drill-down', { params }),
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
    listSimulations: () => api.get('pricing'),
    saveSimulation: (data: any) => api.post('pricing', data),
    getDiagnosis: (params?: { startDate?: string, endDate?: string }) => api.get('pricing/diagnosis', { params }),
    upsertProcedure: (data: any) => api.post('pricing/procedure', data),
    deleteProcedure: (id: string) => api.delete(`pricing/procedure/${id}`),
    simularIntegrado: (data: { procedimentoId: string, tempoMinutos: number, valorVenda?: number }) => api.post('pricing/simular-integrado', data),
};

export const complianceApi = {
    getDocuments: () => api.get('compliance'),
    updateDocument: (id: string, data: any) => api.patch(`compliance/${id}`, data),
    deleteDocument: (id: string) => api.delete(`compliance/${id}`),
};

export const proceduresApi = {
    list: (params: any) => api.get('procedures', { params }),
    getById: (id: string) => api.get(`procedures/${id}`),
    create: (data: any) => api.post('procedures', data),
    update: (id: string, data: any) => api.put(`procedures/${id}`, data),
    delete: (id: string) => api.delete(`procedures/${id}`),
    listPending: () => api.get('procedures/pending'),
    getByPatient: (patientId: string) => api.get(`procedures/patient/${patientId}`),
    execute: (id: string) => api.post(`procedures/${id}/execute`),
};

export const tasksApi = {
    getDaily: () => api.get('tasks/daily'),
    getSummary: () => api.get('tasks/summary'),
    getCRM: () => api.get('tasks/crm'),
    updateStatus: (id: string, status: string) => api.patch(`tasks/${id}/status`, { status }),
    complete: (id: string) => api.patch(`tasks/${id}/complete`),
};

export const leadsApi = {
    createLead: (data: any) => api.post('leads', data),
    getLeads: () => api.get('leads'),
    updateStatus: (id: string, status: string) => api.patch(`leads/${id}/status`, { status }),
    updateNotes: (id: string, notes: string) => api.patch(`leads/${id}/notes`, { notes }),
    updateLead: (id: string, data: any) => api.patch(`leads/${id}`, data),
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

export const managementApi = {
    getUsers: () => api.get('management/users'),
    createUser: (data: any) => api.post('management/users', data),
    updateUser: (id: string, data: any) => api.put(`management/users/${id}`, data),
    deleteUser: (id: string) => api.delete(`management/users/${id}`),
};

export const clinicApi = {
    getMe: () => api.get('clinic/me'),
    getAll: () => api.get('clinic/all'),
    updateMe: (data: any) => api.patch('clinic/me', data),
    uploadLogo: (formData: FormData) => api.post('saas/clinics/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const importApi = {
    getBatches: () => api.get('import'),
    rollbackBatch: (id: string) => api.delete(`import/${id}`),
    importFinance: (formData: FormData) => api.post('import/finance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    importPatients: (formData: FormData) => api.post('import/patients', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    importPayables: (formData: FormData) => api.post('import/payables', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    importInventory: (formData: FormData) => api.post('import/inventory', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    importStockMovements: (formData: FormData) => api.post('import/stock-movements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export const inventoryApi = {
    getPGE: () => api.get('inventory/pge'),
};

// ═══ MÓDULO DE FATURAMENTO V2 ═══

export const formaPagamentoApi = {
    list: () => api.get('forma-pagamento'),
    create: (data: any) => api.post('forma-pagamento', data),
    update: (id: string, data: any) => api.put(`forma-pagamento/${id}`, data),
    delete: (id: string) => api.delete(`forma-pagamento/${id}`),
    calcular: (data: { formaId: string; valor: number; parcelas?: number }) =>
        api.post('forma-pagamento/calcular', data),
};

export const categoriaProcedimentoApi = {
    list: () => api.get('procedures/categorias'),
    create: (data: any) => api.post('procedures/categorias', data),
    update: (id: string, data: any) => api.put(`procedures/categorias/${id}`, data),
    delete: (id: string) => api.delete(`procedures/categorias/${id}`),
};

export const procedimentoInsumosApi = {
    list: (procedureId: string) => api.get(`procedures/${procedureId}/insumos`),
    add: (procedureId: string, data: any) => api.post(`procedures/${procedureId}/insumos`, data),
    update: (insumoId: string, data: any) => api.put(`procedures/insumos/${insumoId}`, data),
    remove: (insumoId: string) => api.delete(`procedures/insumos/${insumoId}`),
    margem: (procedureId: string) => api.get(`procedures/${procedureId}/margem`),
};

export const orcamentoApi = {
    list: (params?: any) => api.get('orcamentos', { params }),
    getById: (id: string) => api.get(`orcamentos/${id}`),
    create: (data: any) => api.post('orcamentos', data),
    update: (id: string, data: any) => api.put(`orcamentos/${id}`, data),
    enviar: (id: string) => api.post(`orcamentos/${id}/enviar`),
    aprovar: (id: string) => api.post(`orcamentos/${id}/aprovar`),
    rejeitar: (id: string) => api.post(`orcamentos/${id}/rejeitar`),
    kpis: () => api.get('orcamentos/kpis'),
};

export const contaPacienteApi = {
    list: (params?: any) => api.get('contas-paciente', { params }),
    getById: (id: string) => api.get(`contas-paciente/${id}`),
    pagarParcela: (contaId: string, parcelaId: string) =>
        api.post(`contas-paciente/${contaId}/parcelas/${parcelaId}/pagar`),
    kpis: () => api.get('contas-paciente/kpis'),
};

export const execucaoApi = {
    list: (params?: any) => api.get('execucao', { params }),
    executar: (data: any) => api.post('execucao/executar', data),
};

export const termoApi = {
    listTermos: () => api.get('termos'),
    createTermo: (data: any) => api.post('termos', data),
    listDocumentos: (pacienteId: string) => api.get(`termos/paciente/${pacienteId}`),
    createDocumento: (pacienteId: string, data: any) => api.post(`termos/paciente/${pacienteId}`, data),
};

export const inteligenciaComprasApi = {
    getPrioridade: (params?: any) => api.get('inteligencia-compras/prioridade', { params }),
    exportar: (data: any) => api.post('inteligencia-compras/exportar', data),
};

export const setoresApi = {
    list: () => api.get('setores'),
    create: (data: any) => api.post('setores', data),
    update: (id: string, data: any) => api.put(`setores/${id}`, data),
    delete: (id: string) => api.delete(`setores/${id}`),
};

export const configuracoesApi = {
    getGlobais: () => api.get('configuracoes/globais'),
    updateGlobais: (data: any) => api.put('configuracoes/globais', data),
    getImpostosEmissao: () => api.get('configuracoes/impostos-emissao'),
    saveImpostosEmissao: (data: { impostos: any[] }) => api.post('configuracoes/impostos-emissao', data),
    getRegrasRepasse: () => api.get('configuracoes/regras-repasse'),
    createRegraRepasse: (data: any) => api.post('configuracoes/regras-repasse', data),
    deleteRegraRepasse: (id: string) => api.delete(`configuracoes/regras-repasse/${id}`),
    getRegrasComissao: () => api.get('configuracoes/regras-comissao'),
    createRegraComissao: (data: any) => api.post('configuracoes/regras-comissao', data),
    deleteRegraComissao: (id: string) => api.delete(`configuracoes/regras-comissao/${id}`),
};

export default api;

