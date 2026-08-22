import { http } from './client';
import type {
  User, DashboardStats, Invoice, AuditTrailEntry,
  Vendor, KnowledgeRule, Ledger, BankTransaction,
  AIConfig, SystemHealth,
} from '../types';
import * as mock from './mock';

// Wrap API calls with mock fallback for development
async function withMock<T>(apiFn: () => Promise<T>, mockData: T): Promise<T> {
  try {
    const data = await apiFn();
    if (Array.isArray(mockData) && !Array.isArray(data)) {
      return mockData;
    }
    return data ?? mockData;
  } catch {
    return mockData;
  }
}

// Auth
export const login = (email: string, password: string) =>
  http.post<{ access_token: string; username: string; role: string }>('/auth/login', {
    username: email,
    password,
  }).then(res => ({
    ...res,
    user: {
      id: res.username,
      name: res.username,
      email: res.username,
      role: 'admin' as const,
    },
  }));

export const getMe = () => {
  const token = localStorage.getItem('auth_token') || '';
  return withMock(
    () => http.get<{ username: string; role: string }>(`/auth/me?token=${encodeURIComponent(token)}`).then(res => ({
      id: res.username,
      name: res.username,
      email: res.username,
      role: 'admin' as const,
    })),
    { id: 'u-001', name: 'Priya Sharma', email: 'priya@example.com', role: 'admin' as const },
  );
};

// Dashboard
export const getDashboardStats = () =>
  withMock(() => http.get<DashboardStats>('/dashboard/stats'), mock.mockStats);

// System Health
export const getHealth = () =>
  withMock(() => http.get<SystemHealth>('/health'), mock.mockHealth);

// Invoices
export const getInvoices = () =>
  withMock(() => http.get<Invoice[]>('/invoices'), mock.mockInvoices);

export const searchInvoices = (q: string) =>
  withMock(
    () => http.get<Invoice[]>(`/invoices/search?q=${encodeURIComponent(q)}`),
    mock.mockInvoices.filter(inv =>
      inv.vendor_name.toLowerCase().includes(q.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(q.toLowerCase()) ||
      inv.id.toLowerCase().includes(q.toLowerCase())
    )
  );

export const getInvoice = (id: string) =>
  withMock(
    () => http.get<Invoice>(`/invoices/${id}`),
    mock.mockInvoices.find(i => i.id === id) || mock.mockInvoices[0]
  );

export const getInvoiceAuditTrail = (id: string) =>
  withMock(() => http.get<AuditTrailEntry[]>(`/invoices/${id}/audit-trail`), mock.mockAuditTrail);

export const auditInvoice = (invoiceId: string) =>
  http.post('/audit-invoice', { invoice_id: invoiceId });

export const uploadInvoice = (file: File) =>
  http.upload('/audit-invoice', file);

export const reAuditInvoice = (id: string) =>
  http.post(`/invoices/${id}/re-audit`);

export const overrideInvoice = (id: string, data: { reason: string; adjusted_liability: number }) =>
  http.patch(`/invoices/${id}/override`, data);

export const deleteInvoice = (id: string) =>
  http.delete(`/invoices/${id}`);

export const exportInvoice = (id: string) =>
  `${(import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8000'}/invoices/${id}/export`;

// Vendors
export const getVendors = () =>
  withMock(() => http.get<Vendor[]>('/vendors'), mock.mockVendors);

export const getVendor = (gstin: string) =>
  withMock(
    () => http.get<Vendor>(`/vendors/${gstin}`),
    mock.mockVendors.find(v => v.gstin === gstin) || mock.mockVendors[0]
  );

export const createVendor = (data: Partial<Vendor>) =>
  http.post<Vendor>('/vendors', data);

export const updateVendor = (gstin: string, data: Partial<Vendor>) =>
  http.patch<Vendor>(`/vendors/${gstin}`, data);

export const getVendorInvoices = (gstin: string) =>
  withMock(
    () => http.get<Invoice[]>(`/vendors/${gstin}/invoices`),
    mock.mockInvoices.filter(i => i.vendor_gstin === gstin)
  );

// Knowledge Base
export const getRules = () =>
  withMock(() => http.get<KnowledgeRule[]>('/knowledge-base/rules'), mock.mockRules);

export const createRule = (data: Partial<KnowledgeRule>) =>
  http.post<KnowledgeRule>('/knowledge-base/rules', data);

export const deleteRule = (id: string) =>
  http.delete(`/knowledge-base/rules/${id}`);

// Ledgers
export const getLedgers = () =>
  withMock(() => http.get<Ledger[]>('/ledgers'), mock.mockLedgers);

export const createLedger = (data: Partial<Ledger>) =>
  http.post<Ledger>('/ledgers', data);

// Bank Transactions
export const getBankTransactions = () =>
  withMock(() => http.get<BankTransaction[]>('/bank-transactions'), mock.mockTransactions);

export const createBankTransaction = (data: Partial<BankTransaction>) =>
  http.post<BankTransaction>('/bank-transactions', data);

// Reports
export const getReportsExportUrl = () =>
  `${(import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:8000'}/reports/export`;

// AI Config
export const getAIConfig = () =>
  withMock(() => http.get<AIConfig>('/settings/ai-config'), mock.mockAIConfig);

export const updateAIConfig = (data: Partial<AIConfig>) =>
  http.patch<AIConfig>('/settings/ai-config', data);
