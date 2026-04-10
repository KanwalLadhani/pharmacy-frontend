import axios from 'axios';

export const api = axios.create({
  // Updated this line to point to your live Azure backend
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request Interceptor: Attach JWT token ---
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('medistore_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor: Handle 401 (token expired / invalid) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('medistore_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const inventoryService = {
  getAll: (page = 0, size = 50) => api.get(`/medicines?page=${page}&size=${size}`),
  getById: (id) => api.get(`/medicines/${id}`),
  add: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
  search: (query, page = 0, size = 50) => api.get(`/medicines/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`),
  filter: (type) => api.get(`/medicines/filter?type=${encodeURIComponent(type)}`),
  getAlternates: (id) => api.get(`/medicines/${id}/alternates`),
  getLowStock: () => api.get('/medicines/low-stock'),
};

export const billingService = {
  createInvoice: (data) => api.post('/billing/invoice', data),
  getInvoices: (page = 0, size = 15) => api.get(`/billing/history?page=${page}&size=${size}`),
  getInvoiceByNumber: (invNum) => api.get(`/billing/invoices/${encodeURIComponent(invNum)}`),
  getSalesSummary: (start, end) => api.get(`/billing/sales/summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  returnInvoice: (invNum) => api.post(`/billing/invoices/${encodeURIComponent(invNum)}/return`),
  partialReturn: (data) => api.post('/billing/invoices/partial-return', data),
  getProfitReport: (date) => api.get(`/billing/profit-report?date=${date}`),
  clearSales: () => api.delete('/billing/sales/clear'),
};

export const userService = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;