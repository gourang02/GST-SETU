export type Severity = 'LOW' | 'MED' | 'HIGH' | 'CRIT';
export type InvoiceStatus = 'pending' | 'audited' | 'exception' | 'overridden' | 'processing';
export type VendorStatus = 'active' | 'flagged' | 'suspended';
export type UserRole = 'admin' | 'auditor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface DashboardStats {
  total_invoices: number;
  audited: number;
  exceptions: number;
  pending: number;
  processing: number;
  total_liability: number;
  adjusted_liability: number;
  confidence_avg: number;
  gst_variance: number;
  savings: number;
}

export interface LineItem {
  description: string;
  hsn_code: string;
  quantity: number;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
}

export interface AuditFlag {
  rule_id: string;
  description: string;
  severity: Severity;
  confidence: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor_gstin: string;
  vendor_name: string;
  date: string;
  amount: number;
  gst_amount: number;
  status: InvoiceStatus;
  severity: Severity | null;
  confidence: number;
  original_liability: number;
  adjusted_liability: number;
  line_items?: LineItem[];
  audit_flags?: AuditFlag[];
  notes?: string;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  stage?: 'extractor' | 'reconciler' | 'filer';
}

export interface Vendor {
  gstin: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  category: string;
  risk_score: number;
  invoice_count: number;
  last_audit: string;
  status: VendorStatus;
  total_amount?: number;
}

export interface KnowledgeRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  active: boolean;
  created_at: string;
  match_count?: number;
}

export interface Ledger {
  id: string;
  name: string;
  type: string;
  account_code: string;
  balance: number;
  currency: string;
  last_updated: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference: string;
  reconciled: boolean;
  invoice_id?: string;
}

export interface AIConfig {
  model: string;
  confidence_threshold: number;
  auto_audit: boolean;
  max_retries: number;
  temperature: number;
  gst_validation_strict: boolean;
  flag_threshold: number;
  crit_threshold: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  event: string;
  invoice_id?: string;
  vendor?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  stage?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  version: string;
  services: {
    database: string;
    ai_engine: string;
    gst_api: string;
  };
}

export type Page =
  | 'dashboard'
  | 'invoices'
  | 'invoice-detail'
  | 'vendors'
  | 'vendor-detail'
  | 'knowledge-base'
  | 'ledgers'
  | 'bank-transactions'
  | 'reports'
  | 'settings';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
