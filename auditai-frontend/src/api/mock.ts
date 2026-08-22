import type {
  DashboardStats, Invoice, Vendor, KnowledgeRule,
  Ledger, BankTransaction, AIConfig, SystemHealth,
  AuditTrailEntry, ActivityLogEntry
} from '../types';

export const mockStats: DashboardStats = {
  total_invoices: 1847,
  audited: 1523,
  exceptions: 94,
  pending: 230,
  processing: 47,
  total_liability: 28450000,
  adjusted_liability: 26190000,
  confidence_avg: 91.4,
  gst_variance: 4320000,
  savings: 2260000,
};

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-2024-0891',
    invoice_number: 'VND/2024/0891',
    vendor_gstin: '29ABCDE1234F1Z5',
    vendor_name: 'Apex Tech Solutions Pvt Ltd',
    date: '2024-11-14',
    amount: 480000,
    gst_amount: 86400,
    status: 'exception',
    severity: 'CRIT',
    confidence: 78.2,
    original_liability: 86400,
    adjusted_liability: 64800,
    audit_flags: [
      { rule_id: 'R-041', description: 'GST rate mismatch — applied 18% instead of mandated 12% for HSN 9983', severity: 'CRIT', confidence: 94.1 },
      { rule_id: 'R-017', description: 'Invoice date falls outside filing period — potential ITC reversal required', severity: 'HIGH', confidence: 88.7 },
    ],
    line_items: [
      { description: 'IT Consulting Services', hsn_code: '9983', quantity: 1, rate: 480000, amount: 480000, gst_rate: 18, gst_amount: 86400 },
    ],
  },
  {
    id: 'INV-2024-0887',
    invoice_number: 'MFG/NOV/0044',
    vendor_gstin: '27FGHIJ5678K2Z8',
    vendor_name: 'Bharat Manufacturing Co',
    date: '2024-11-12',
    amount: 2150000,
    gst_amount: 258000,
    status: 'exception',
    severity: 'HIGH',
    confidence: 83.5,
    original_liability: 258000,
    adjusted_liability: 193500,
    audit_flags: [
      { rule_id: 'R-022', description: 'Duplicate invoice number detected — cross-vendor GSTIN check', severity: 'HIGH', confidence: 91.2 },
    ],
    line_items: [
      { description: 'Industrial Components — Batch 44A', hsn_code: '8483', quantity: 500, rate: 4300, amount: 2150000, gst_rate: 12, gst_amount: 258000 },
    ],
  },
  {
    id: 'INV-2024-0883',
    invoice_number: 'SVC/2024/1102',
    vendor_gstin: '19KLMNO9012P3Z1',
    vendor_name: 'CloudServ India Ltd',
    date: '2024-11-10',
    amount: 125000,
    gst_amount: 22500,
    status: 'audited',
    severity: 'MED',
    confidence: 88.9,
    original_liability: 22500,
    adjusted_liability: 22500,
    audit_flags: [
      { rule_id: 'R-009', description: 'GSTIN validation delayed — awaiting GSTR-2B reconciliation', severity: 'MED', confidence: 72.3 },
    ],
  },
  {
    id: 'INV-2024-0879',
    invoice_number: 'LOG/NOV/0778',
    vendor_gstin: '06PQRST3456U4Z2',
    vendor_name: 'Swift Logistics Network',
    date: '2024-11-08',
    amount: 340000,
    gst_amount: 61200,
    status: 'audited',
    severity: null,
    confidence: 97.1,
    original_liability: 61200,
    adjusted_liability: 61200,
  },
  {
    id: 'INV-2024-0876',
    invoice_number: 'RET/2024/0023',
    vendor_gstin: '33UVWXY7890V5Z9',
    vendor_name: 'Prime Retail Distributors',
    date: '2024-11-07',
    amount: 780000,
    gst_amount: 140400,
    status: 'exception',
    severity: 'MED',
    confidence: 85.4,
    original_liability: 140400,
    adjusted_liability: 126360,
    audit_flags: [
      { rule_id: 'R-033', description: 'Partial credit note not reflected — ITC eligible amount variance of ₹14,040', severity: 'MED', confidence: 86.8 },
    ],
  },
  {
    id: 'INV-2024-0872',
    invoice_number: 'PHR/NOV/0091',
    vendor_gstin: '24ABCXY1234F2Z6',
    vendor_name: 'HealthBridge Pharma',
    date: '2024-11-05',
    amount: 920000,
    gst_amount: 46000,
    status: 'audited',
    severity: null,
    confidence: 98.3,
    original_liability: 46000,
    adjusted_liability: 46000,
  },
  {
    id: 'INV-2024-0869',
    invoice_number: 'CON/2024/0456',
    vendor_gstin: '07DEFGH5678I3Z4',
    vendor_name: 'BuildRight Contractors',
    date: '2024-11-03',
    amount: 5600000,
    gst_amount: 1008000,
    status: 'overridden',
    severity: 'HIGH',
    confidence: 79.8,
    original_liability: 1008000,
    adjusted_liability: 806400,
    audit_flags: [
      { rule_id: 'R-051', description: 'Works contract — mixed supply classification requires recomputation at 12%', severity: 'HIGH', confidence: 88.4 },
    ],
  },
  {
    id: 'INV-2024-0865',
    invoice_number: 'ENR/NOV/0017',
    vendor_gstin: '09IJKLM9012N4Z7',
    vendor_name: 'Greenfield Energy Pvt Ltd',
    date: '2024-11-01',
    amount: 3200000,
    gst_amount: 192000,
    status: 'pending',
    severity: null,
    confidence: 0,
    original_liability: 192000,
    adjusted_liability: 192000,
  },
];

export const mockVendors: Vendor[] = [
  { gstin: '29ABCDE1234F1Z5', name: 'Apex Tech Solutions Pvt Ltd', email: 'accounts@apextech.in', category: 'IT Services', risk_score: 78, invoice_count: 47, last_audit: '2024-11-14', status: 'flagged', total_amount: 12400000 },
  { gstin: '27FGHIJ5678K2Z8', name: 'Bharat Manufacturing Co', email: 'finance@bharatmfg.com', category: 'Manufacturing', risk_score: 61, invoice_count: 124, last_audit: '2024-11-12', status: 'flagged', total_amount: 84500000 },
  { gstin: '19KLMNO9012P3Z1', name: 'CloudServ India Ltd', email: 'billing@cloudserv.in', category: 'Cloud/SaaS', risk_score: 32, invoice_count: 36, last_audit: '2024-11-10', status: 'active', total_amount: 4800000 },
  { gstin: '06PQRST3456U4Z2', name: 'Swift Logistics Network', email: 'gst@swiftlog.com', category: 'Logistics', risk_score: 14, invoice_count: 89, last_audit: '2024-11-08', status: 'active', total_amount: 31200000 },
  { gstin: '33UVWXY7890V5Z9', name: 'Prime Retail Distributors', email: 'accounts@primerd.in', category: 'Retail', risk_score: 45, invoice_count: 211, last_audit: '2024-11-07', status: 'active', total_amount: 67800000 },
  { gstin: '24ABCXY1234F2Z6', name: 'HealthBridge Pharma', email: 'finance@healthbridge.in', category: 'Pharma', risk_score: 8, invoice_count: 58, last_audit: '2024-11-05', status: 'active', total_amount: 22100000 },
  { gstin: '07DEFGH5678I3Z4', name: 'BuildRight Contractors', email: 'gst@buildright.com', category: 'Construction', risk_score: 67, invoice_count: 29, last_audit: '2024-11-03', status: 'flagged', total_amount: 156000000 },
];

export const mockRules: KnowledgeRule[] = [
  { id: 'R-041', name: 'GST Rate Mismatch — HSN Classification', description: 'Detects misapplied GST rates based on HSN code classification tables from CBIC', severity: 'CRIT', active: true, created_at: '2024-09-01', match_count: 47 },
  { id: 'R-022', name: 'Duplicate Invoice Detection', description: 'Cross-references invoice numbers across vendors to detect duplicate submissions', severity: 'HIGH', active: true, created_at: '2024-08-15', match_count: 23 },
  { id: 'R-033', name: 'Credit Note Reconciliation', description: 'Validates that credit notes are properly reflected in ITC claimed amounts', severity: 'MED', active: true, created_at: '2024-08-20', match_count: 38 },
  { id: 'R-017', name: 'Filing Period Compliance', description: 'Checks invoice dates against applicable GST filing periods and deadlines', severity: 'HIGH', active: true, created_at: '2024-09-10', match_count: 19 },
  { id: 'R-009', name: 'GSTIN Active Status Verification', description: 'Validates vendor GSTIN against live GST portal data and flags inactive registrations', severity: 'MED', active: true, created_at: '2024-07-01', match_count: 12 },
  { id: 'R-051', name: 'Works Contract Mixed Supply', description: 'Identifies works contract invoices requiring mixed supply GST computation', severity: 'HIGH', active: true, created_at: '2024-10-01', match_count: 8 },
  { id: 'R-006', name: 'Place of Supply Validation', description: 'Verifies IGST vs CGST/SGST applicability based on place of supply rules', severity: 'CRIT', active: false, created_at: '2024-06-15', match_count: 31 },
];

export const mockLedgers: Ledger[] = [
  { id: 'L-001', name: 'GST Input Tax Credit', type: 'Asset', account_code: '1401', balance: 8450000, currency: 'INR', last_updated: '2024-11-14' },
  { id: 'L-002', name: 'GST Output Tax Liability', type: 'Liability', account_code: '2201', balance: 12680000, currency: 'INR', last_updated: '2024-11-14' },
  { id: 'L-003', name: 'Accounts Payable — Trade', type: 'Liability', account_code: '2101', balance: 34200000, currency: 'INR', last_updated: '2024-11-13' },
  { id: 'L-004', name: 'Accounts Receivable', type: 'Asset', account_code: '1301', balance: 28900000, currency: 'INR', last_updated: '2024-11-12' },
  { id: 'L-005', name: 'TDS Payable', type: 'Liability', account_code: '2301', balance: 1240000, currency: 'INR', last_updated: '2024-11-11' },
];

export const mockTransactions: BankTransaction[] = [
  { id: 'TXN-2024-4421', date: '2024-11-14', description: 'Payment — Apex Tech Solutions Pvt Ltd', amount: 566400, type: 'debit', reference: 'NEFT/24318/00441', reconciled: false, invoice_id: 'INV-2024-0891' },
  { id: 'TXN-2024-4418', date: '2024-11-13', description: 'Payment — Swift Logistics Network', amount: 401200, type: 'debit', reference: 'RTGS/24317/08821', reconciled: true, invoice_id: 'INV-2024-0879' },
  { id: 'TXN-2024-4415', date: '2024-11-12', description: 'Receipt — Client Advance: Greenfield Energy', amount: 1600000, type: 'credit', reference: 'NEFT/24316/05512', reconciled: true },
  { id: 'TXN-2024-4412', date: '2024-11-11', description: 'Payment — Bharat Manufacturing Co', amount: 2408000, type: 'debit', reference: 'RTGS/24315/02211', reconciled: false, invoice_id: 'INV-2024-0887' },
  { id: 'TXN-2024-4409', date: '2024-11-10', description: 'GST Payment — Nov 2024 (CGST)', amount: 2840000, type: 'debit', reference: 'GSTIN/NOV/CGST', reconciled: true },
];

export const mockAuditTrail: AuditTrailEntry[] = [
  { id: 'AT-001', timestamp: '2024-11-14T14:32:11Z', action: 'EXTRACTION_COMPLETE', actor: 'AI Extractor v2.1', details: '14 line items parsed, GSTIN validated against live GST portal', stage: 'extractor' },
  { id: 'AT-002', timestamp: '2024-11-14T14:32:18Z', action: 'RECONCILIATION_START', actor: 'AI Reconciler v1.8', details: 'Beginning cross-reference with GSTR-2B portal data', stage: 'reconciler' },
  { id: 'AT-003', timestamp: '2024-11-14T14:32:44Z', action: 'FLAG_RAISED', actor: 'Rule Engine', details: 'R-041: GST rate mismatch detected — HSN 9983 requires 12%, billed at 18% (Δ ₹21,600)', stage: 'reconciler' },
  { id: 'AT-004', timestamp: '2024-11-14T14:32:45Z', action: 'FLAG_RAISED', actor: 'Rule Engine', details: 'R-017: Invoice date 2024-11-14 outside filing quarter — ITC reversal may apply', stage: 'reconciler' },
  { id: 'AT-005', timestamp: '2024-11-14T14:33:02Z', action: 'FILER_HOLD', actor: 'AI Filer v1.5', details: 'Filing suspended — 2 CRIT/HIGH flags require resolution before ITC claim', stage: 'filer' },
  { id: 'AT-006', timestamp: '2024-11-14T14:35:00Z', action: 'REVIEWED', actor: 'Priya Sharma', details: 'Exception reviewed — vendor contacted for corrected invoice. Override pending CFO approval.' },
];

export const mockActivity: ActivityLogEntry[] = [
  { id: 'A-001', timestamp: '2024-11-14T14:33:02Z', event: 'FILER_HOLD on INV-2024-0891 — 2 critical flags', invoice_id: 'INV-2024-0891', severity: 'error', stage: 'Filer' },
  { id: 'A-002', timestamp: '2024-11-14T14:21:14Z', event: 'INV-2024-0887 reconciliation complete — 1 HIGH flag (duplicate invoice)', invoice_id: 'INV-2024-0887', severity: 'warning', stage: 'Reconciler' },
  { id: 'A-003', timestamp: '2024-11-14T14:08:47Z', event: 'INV-2024-0879 filed successfully — confidence 97.1%', invoice_id: 'INV-2024-0879', severity: 'success', stage: 'Filer' },
  { id: 'A-004', timestamp: '2024-11-14T13:55:31Z', event: 'Batch extraction started — 12 invoices queued from Swift Logistics', severity: 'info', stage: 'Extractor' },
  { id: 'A-005', timestamp: '2024-11-14T13:44:09Z', event: 'INV-2024-0869 queued for AI audit — Greenfield Energy Pvt Ltd', invoice_id: 'INV-2024-0869', severity: 'info', stage: 'Extractor' },
  { id: 'A-006', timestamp: '2024-11-14T13:32:18Z', event: 'Override approved — INV-2024-0869 — BuildRight Contractors (CFO: R. Mehta)', severity: 'success', stage: 'Filer' },
];

export const mockAIConfig: AIConfig = {
  model: 'claude-sonnet-5',
  confidence_threshold: 85,
  auto_audit: true,
  max_retries: 3,
  temperature: 0.1,
  gst_validation_strict: true,
  flag_threshold: 70,
  crit_threshold: 90,
};

export const mockHealth: SystemHealth = {
  status: 'healthy',
  uptime: 99.91,
  version: '2.4.1',
  services: { database: 'healthy', ai_engine: 'healthy', gst_api: 'healthy' },
};
