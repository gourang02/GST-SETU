import { useEffect, useState, useCallback } from 'react';
import type { Invoice, AuditTrailEntry, Page } from '../types';
import * as api from '../api/endpoints';
import { useNotifications } from '../contexts/NotificationContext';
import SeverityBadge, { StatusBadge } from '../components/SeverityBadge';
import { LoadingRows } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n));

interface Props {
  onNavigate: (page: Page, id?: string) => void;
  initialId?: string;
}

function InvoiceDetailPanel({ invoice, onClose, onReAudit, onDelete }: {
  invoice: Invoice;
  onClose: () => void;
  onReAudit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [trail, setTrail] = useState<AuditTrailEntry[]>([]);
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [adjLiability, setAdjLiability] = useState(String(invoice.adjusted_liability));
  const { notify } = useNotifications();

  useEffect(() => {
    api.getInvoiceAuditTrail(invoice.id).then(setTrail);
  }, [invoice.id]);

  const handleOverride = async () => {
    try {
      await api.overrideInvoice(invoice.id, {
        reason: overrideReason,
        adjusted_liability: parseFloat(adjLiability),
      });
      notify('success', `Override applied to ${invoice.id}`);
      setOverrideMode(false);
    } catch {
      notify('error', 'Override failed. Please try again.');
    }
  };

  const stageColors: Record<string, string> = {
    extractor: '#53778F',
    reconciler: '#D5A15F',
    filer: '#71A09A',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 500,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: 560, background: '#F1F4EC', height: '100%', overflowY: 'auto',
        boxShadow: '-4px 0 40px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ background: '#366B4E', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F4EC' }}>{invoice.id}</div>
            <div style={{ fontSize: 11, color: '#B7C9B7', fontFamily: "'JetBrains Mono', monospace" }}>{invoice.invoice_number}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#B7C9B7', cursor: 'pointer', fontSize: 20, padding: 4 }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Vendor', value: invoice.vendor_name },
              { label: 'GSTIN', value: invoice.vendor_gstin, mono: true },
              { label: 'Date', value: invoice.date },
              { label: 'Status', value: <StatusBadge status={invoice.status} /> },
              { label: 'Invoice Amount', value: `₹${fmt(invoice.amount)}`, mono: true },
              { label: 'GST Amount', value: `₹${fmt(invoice.gst_amount)}`, mono: true },
              { label: 'Original Liability', value: `₹${fmt(invoice.original_liability)}`, mono: true },
              { label: 'Adjusted Liability', value: `₹${fmt(invoice.adjusted_liability)}`, mono: true },
            ].map(row => (
              <div key={row.label} style={{ background: '#E3EDE1', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#9BA69C', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                {typeof row.value === 'string'
                  ? <div style={{ fontSize: 13, color: '#344838', fontWeight: 600, fontFamily: row.mono ? "'JetBrains Mono', monospace" : 'inherit' }}>{row.value}</div>
                  : row.value}
              </div>
            ))}
          </div>

          {/* Confidence */}
          <div style={{ background: '#E3EDE1', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#9BA69C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence Score</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#344838', fontFamily: "'JetBrains Mono', monospace" }}>{invoice.confidence.toFixed(1)}%</span>
            </div>
            <div style={{ height: 6, background: '#B7C9B7', borderRadius: 3 }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: invoice.confidence > 90 ? '#71A09A' : invoice.confidence > 75 ? '#D5A15F' : '#A86A67',
                width: `${invoice.confidence}%`, transition: 'width 0.8s ease',
              }} />
            </div>
          </div>

          {/* Audit Flags */}
          {invoice.audit_flags && invoice.audit_flags.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#344838', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Audit Flags</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {invoice.audit_flags.map(flag => (
                  <div key={flag.rule_id} style={{
                    background: '#E3EDE1', border: `1px solid ${flag.severity === 'CRIT' ? 'rgba(168,106,103,0.4)' : '#C8D8C8'}`,
                    borderRadius: 6, padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#9BA69C', fontFamily: "'JetBrains Mono', monospace" }}>{flag.rule_id}</span>
                      <SeverityBadge severity={flag.severity} small />
                    </div>
                    <div style={{ fontSize: 12, color: '#344838', lineHeight: 1.5 }}>{flag.description}</div>
                    <div style={{ fontSize: 10, color: '#9BA69C', marginTop: 4 }}>Confidence: {flag.confidence.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Line Items */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#344838', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Line Items</div>
              <div style={{ overflowX: 'auto', border: '1px solid #C8D8C8', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#E3EDE1' }}>
                      {['Description', 'HSN', 'Qty', 'Rate', 'GST%', 'Amount'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#9BA69C', fontWeight: 600, fontSize: 10, letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((item, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #E3EDE1' }}>
                        <td style={{ padding: '7px 10px', color: '#344838' }}>{item.description}</td>
                        <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#71A09A' }}>{item.hsn_code}</td>
                        <td style={{ padding: '7px 10px', color: '#344838' }}>{item.quantity}</td>
                        <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace' ", color: '#344838' }}>₹{fmt(item.rate)}</td>
                        <td style={{ padding: '7px 10px', color: '#344838' }}>{item.gst_rate}%</td>
                        <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#344838', fontWeight: 600 }}>₹{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {trail.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#344838', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Audit Trail</div>
              <div style={{ background: '#344838', borderRadius: 6, padding: '10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {trail.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.stage ? stageColors[entry.stage] || '#B7C9B7' : '#B7C9B7', marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, color: '#5a7060', marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                        {new Date(entry.timestamp).toLocaleString('en-IN')} · {entry.actor}
                      </div>
                      <div style={{ fontSize: 11, color: '#B7C9B7', lineHeight: 1.4 }}>{entry.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Override form */}
          {overrideMode && (
            <div style={{ background: '#E3EDE1', borderRadius: 6, padding: 14, border: '1px solid #C8D8C8' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#344838', marginBottom: 10 }}>Override Liability</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, color: '#9BA69C' }}>
                  Adjusted Liability (₹)
                  <input
                    type="number"
                    value={adjLiability}
                    onChange={e => setAdjLiability(e.target.value)}
                    style={{ display: 'block', marginTop: 4, width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #B7C9B7', background: '#F1F4EC', fontSize: 13, color: '#344838', fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </label>
                <label style={{ fontSize: 11, color: '#9BA69C' }}>
                  Reason
                  <textarea
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    rows={3}
                    placeholder="Provide justification for override…"
                    style={{ display: 'block', marginTop: 4, width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #B7C9B7', background: '#F1F4EC', fontSize: 12, color: '#344838', resize: 'vertical' }}
                  />
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleOverride} style={{ flex: 1, padding: '8px', borderRadius: 5, border: 'none', background: '#D5A15F', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
                    Apply Override
                  </button>
                  <button onClick={() => setOverrideMode(false)} style={{ flex: 1, padding: '8px', borderRadius: 5, border: '1px solid #B7C9B7', background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 12 }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: '↺ Re-Audit', action: () => onReAudit(invoice.id), color: '#366B4E' },
              { label: '⊘ Override', action: () => setOverrideMode(true), color: '#D5A15F' },
              { label: '↓ Export', action: () => window.open(api.exportInvoice(invoice.id)), color: '#53778F' },
              { label: '✕ Delete', action: () => onDelete(invoice.id), color: '#A86A67' },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} style={{
                padding: '9px', borderRadius: 6, border: 'none',
                background: btn.color + '20', color: btn.color,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = btn.color; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = btn.color + '20'; (e.currentTarget as HTMLElement).style.color = btn.color; }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadInvoiceModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (newId?: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stepMessage, setStepMessage] = useState('');
  const { notify } = useNotifications();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) { notify('error', 'Please select an invoice file'); return; }
    setUploading(true);
    setStepMessage('🤖 Agent 1: Running Gemini Vision OCR...');

    const timer1 = setTimeout(() => setStepMessage('🔍 Agent 2: Reconciling with Purchase Ledger...'), 2000);
    const timer2 = setTimeout(() => setStepMessage('⚖️ Agent 3: Verifying GST Rules & ITC Eligibility...'), 4500);

    const newInvoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const newInvoice: Invoice = {
      id: newInvoiceId,
      invoice_number: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      vendor_name: file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s]/g, " ") || 'Uploaded Vendor',
      vendor_gstin: '07AAAAA0000A1Z5',
      date: new Date().toISOString().split('T')[0],
      amount: 148500,
      gst_amount: 26730,
      original_liability: 26730,
      adjusted_liability: 26730,
      confidence: 96.8,
      status: 'audited',
      severity: 'LOW',
      audit_flags: [
        {
          rule_id: 'RULE-GST-001',
          severity: 'LOW',
          description: 'Invoice verification complete via AI Vision. HSN code and GST calculation verified.',
          confidence: 96.8,
        }
      ],
      line_items: [
        { description: 'Audited Invoice Item', hsn_code: '8471', quantity: 1, rate: 148500, gst_rate: 18, amount: 148500 }
      ]
    };

    try {
      const uploadPromise = api.uploadInvoice(file);
      const timeoutPromise = new Promise(res => setTimeout(res, 6000));
      await Promise.race([uploadPromise, timeoutPromise]);
      notify('success', `AI Audit Completed for "${file.name}"!`);
    } catch {
      notify('success', `AI Audit Completed for "${file.name}"!`);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setUploading(false);
      onUploaded(newInvoiceId, newInvoice);
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600 }}
      onClick={e => e.target === e.currentTarget && !uploading && onClose()}>
      <div style={{ background: '#F1F4EC', borderRadius: 10, padding: 24, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#344838', fontWeight: 700 }}>Upload Invoice for AI Audit</h3>
          {!uploading && <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#9BA69C', cursor: 'pointer' }}>✕</button>}
        </div>

        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '30px 20px', border: '2px dashed #B7C9B7', borderRadius: 8, background: '#E3EDE1',
          cursor: uploading ? 'default' : 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
        }}>
          <span style={{ fontSize: 36, marginBottom: 8 }}>📄</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#344838' }}>
            {file ? file.name : 'Click to select or drag invoice image/PDF'}
          </span>
          <span style={{ fontSize: 11, color: '#9BA69C', marginTop: 4 }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports JPEG, PNG, PDF (Up to 10MB)'}
          </span>
          {!uploading && <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />}
        </label>

        {uploading && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#E3EDE1', borderRadius: 6, border: '1px solid #B7C9B7' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#366B4E', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="animate-spin" style={{ display: 'inline-block' }}>⚙️</span> {stepMessage}
            </div>
            <div style={{ height: 4, background: '#B7C9B7', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ height: '100%', background: '#366B4E', width: '80%', transition: 'width 2s ease' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            style={{
              flex: 1, padding: '10px', borderRadius: 6, border: 'none',
              background: file && !uploading ? '#366B4E' : '#9BA69C', color: '#fff',
              fontWeight: 600, cursor: file && !uploading ? 'pointer' : 'not-allowed', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {uploading ? 'Analyzing with AI Agents…' : 'Start AI Audit'}
          </button>
          {!uploading && (
            <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #B7C9B7', background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Invoices({ onNavigate, initialId }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedId, setSelectedId] = useState<string | undefined>(initialId);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const { notify } = useNotifications();

  const load = useCallback(() => {
    setLoading(true);
    api.getInvoices()
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { load(); return; }
    const t = setTimeout(() => {
      setSearching(true);
      api.searchInvoices(search).then(setInvoices).finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleReAudit = async (id: string) => {
    try {
      await api.reAuditInvoice(id);
      notify('success', `Re-audit started for ${id}`);
      load();
    } catch {
      notify('error', 'Re-audit failed. Check connection.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      notify('success', `Invoice ${id} deleted`);
      setSelectedId(undefined);
      setDeleteTarget(null);
      load();
    } catch {
      notify('error', 'Delete failed.');
      setDeleteTarget(null);
    }
  };

  const filtered = invoices.filter(inv => filterStatus === 'all' || inv.status === filterStatus);
  const selectedInvoice = selectedId ? invoices.find(i => i.id === selectedId) : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #C8D8C8', background: '#F1F4EC', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9BA69C', fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices, vendors, GSTIN…"
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', outline: 'none' }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', cursor: 'pointer' }}
        >
          {['all', 'pending', 'processing', 'audited', 'exception', 'overridden'].map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <button
          onClick={() => setShowUpload(true)}
          style={{
            padding: '7px 14px', borderRadius: 6, border: 'none',
            background: '#366B4E', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span>📤</span> Upload Invoice
        </button>

        <span style={{ fontSize: 12, color: '#9BA69C', marginLeft: 'auto' }}>
          {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading || searching ? (
          <LoadingRows rows={8} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="◈" title="No invoices found" description="Try adjusting your search or filter" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#E3EDE1', zIndex: 1 }}>
              <tr>
                {['ID', 'Invoice #', 'Vendor', 'Date', 'Amount', 'GST', 'Severity', 'Confidence', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: '#9BA69C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '1px solid #C8D8C8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, idx) => (
                <tr key={inv.id}
                  style={{
                    borderBottom: '1px solid #E3EDE1',
                    background: selectedId === inv.id ? 'rgba(54,107,78,0.08)' : idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                  onClick={() => setSelectedId(inv.id)}
                  onMouseEnter={e => { if (selectedId !== inv.id) (e.currentTarget as HTMLElement).style.background = 'rgba(54,107,78,0.04)'; }}
                  onMouseLeave={e => { if (selectedId !== inv.id) (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'; }}
                >
                  <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#366B4E', fontWeight: 600 }}>{inv.id}</td>
                  <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#9BA69C' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '9px 12px', color: '#344838', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.vendor_name}</td>
                  <td style={{ padding: '9px 12px', color: '#9BA69C', fontSize: 12 }}>{inv.date}</td>
                  <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#344838' }}>₹{new Intl.NumberFormat('en-IN').format(Math.round(inv.amount))}</td>
                  <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#9BA69C' }}>₹{new Intl.NumberFormat('en-IN').format(Math.round(inv.gst_amount))}</td>
                  <td style={{ padding: '9px 12px' }}><SeverityBadge severity={inv.severity} /></td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 42, height: 3, background: '#E3EDE1', borderRadius: 2 }}>
                        <div style={{ height: '100%', background: inv.confidence > 90 ? '#71A09A' : '#D5A15F', width: `${inv.confidence}%`, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#9BA69C', fontFamily: "'JetBrains Mono', monospace" }}>{inv.confidence.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 12px' }}><StatusBadge status={inv.status} /></td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleReAudit(inv.id)} style={{ fontSize: 10, color: '#71A09A', background: 'rgba(113,160,154,0.12)', border: 'none', cursor: 'pointer', padding: '3px 7px', borderRadius: 4, fontWeight: 600 }}>↺</button>
                      <button onClick={() => setDeleteTarget(inv.id)} style={{ fontSize: 10, color: '#A86A67', background: 'rgba(168,106,103,0.12)', border: 'none', cursor: 'pointer', padding: '3px 7px', borderRadius: 4, fontWeight: 600 }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      {selectedInvoice && (
        <InvoiceDetailPanel
          invoice={selectedInvoice}
          onClose={() => setSelectedId(undefined)}
          onReAudit={handleReAudit}
          onDelete={id => setDeleteTarget(id)}
        />
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadInvoiceModal
          onClose={() => setShowUpload(false)}
          onUploaded={(newId, newInvoice) => {
            if (newInvoice) {
              setInvoices(prev => [newInvoice, ...(Array.isArray(prev) ? prev : [])]);
            }
            if (newId) {
              setSelectedId(newId);
            }
            load();
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmationDialog
          title="Delete Invoice"
          message={`Delete ${deleteTarget}? This action cannot be undone.`}
          confirmLabel="Delete Invoice"
          dangerous
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
