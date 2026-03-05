import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const financialApi = {
    getSummary: () => api.get('/financial/summary'),
    getBreakEven: () => api.get('/financial/break-even'),
    getEvolution: () => api.get('/financial/evolution'),
    createTransaction: (data: any) => api.post('/financial/transactions', data),
};

export const coreApi = {
    getProductivity: () => api.get('/core/productivity'),
    createDoctor: (data: any) => api.post('/core/doctors', data),
    getStock: () => api.get('/core/stock'),
    createStockItem: (data: any) => api.post('/core/stock', data),
};

export const reportingApi = {
    getCashFlow: () => api.get('/reporting/cash-flow'),
    getGoals: () => api.get('/reporting/goals'),
    postSmartGoal: (targetProfit: number) => api.post('/reporting/smart-goal', { targetProfit }),
};

export const analyticsApi = {
    getInsights: () => api.get('/analytics/insights'),
};

export const historyApi = {
    getSummary: () => api.get('/history/summary'),
    getProcedures: () => api.get('/history/procedures'),
    getWeekly: (month: number) => api.get(`/history/weekly?month=${month}`),
};

export default api;
