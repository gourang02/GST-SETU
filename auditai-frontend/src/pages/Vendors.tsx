import { useEffect, useState, useCallback } from 'react';
import type { Vendor, Invoice } from '../types';
import * as api from '../api/endpoints';
import { useNotifications } from '../contexts/NotificationContext';
import { StatusBadge } from '../components/SeverityBadge';
import { LoadingRows } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n));

function RiskBar({ score }: { score: number }) {
  const color = score > 60 ? '#A86A67' : score > 30 ? '#D5A15F' : '#71A09A';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 4, background: '#E3EDE1', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{score}</span>
    </div>
  );
}

function VendorPanel({ vendor, onClose, onUpdate }: { vendor: Vendor; onClose: () => void; onUpdate: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email: vendor.email, category: vendor.category });
  const { notify } = useNotifications();

  useEffect(() => {
    api.getVendorInvoices(vendor.gstin).then(setInvoices);
  }, [vendor.gstin]);

  const handleSave = async () => {
    try {
      await api.updateVendor(vendor.gstin, form);
      notify('success', `Vendor ${vendor.name} updated`);
      setEditing(false);
      onUpdate();
    } catch {
      notify('error', 'Update failed');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'flex-end', zIndex: 500 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, background: '#F1F4EC', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 40px rgba(0,0,0,0.15)' }}>
        <div style={{ background: '#366B4E', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F4EC' }}>{vendor.name}</div>
            <div style={{ fontSize: 11, color: '#B7C9B7', fontFamily: "'JetBrains Mono', monospace" }}>{vendor.gstin}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#B7C9B7', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Status', value: <StatusBadge status={vendor.status} /> },
              { label: 'Category', value: vendor.category },
              { label: 'Risk Score', value: <RiskBar score={vendor.risk_score} /> },
              { label: 'Invoices', value: `${vendor.invoice_count} invoices`, mono: true },
              { label: 'Last Audit', value: vendor.last_audit },
              { label: 'Total Amount', value: `₹${fmt(vendor.total_amount || 0)}`, mono: true },
            ].map(row => (
              <div key={row.label} style={{ background: '#E3EDE1', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#9BA69C', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                {typeof row.value === 'string'
                  ? <div style={{ fontSize: 13, color: '#344838', fontWeight: 600, fontFamily: (row as any).mono ? "'JetBrains Mono', monospace" : 'inherit' }}>{row.value}</div>
                  : row.value}
              </div>
            ))}
          </div>

          {/* Edit form */}
          {editing ? (
            <div style={{ background: '#E3EDE1', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#344838', marginBottom: 4 }}>Edit Vendor</div>
              {[
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'category', label: 'Category', type: 'text' },
              ].map(f => (
                <label key={f.key} style={{ fontSize: 11, color: '#9BA69C' }}>
                  {f.label}
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ display: 'block', marginTop: 4, width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #B7C9B7', background: '#F1F4EC', fontSize: 13, color: '#344838' }}
                  />
                </label>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} style={{ flex: 1, padding: '8px', borderRadius: 5, border: 'none', background: '#366B4E', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>Save</button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '8px', borderRadius: 5, border: '1px solid #B7C9B7', background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} style={{ padding: '9px', borderRadius: 6, border: '1px solid #B7C9B7', background: 'transparent', color: '#366B4E', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Edit Vendor</button>
          )}

          {/* Associated invoices */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#344838', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Invoices</div>
            {invoices.length === 0
              ? <div style={{ color: '#9BA69C', fontSize: 12, padding: '10px 0' }}>No invoices found</div>
              : invoices.map(inv => (
                <div key={inv.id} style={{ padding: '8px 12px', background: '#E3EDE1', borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#366B4E', fontFamily: "'JetBrains Mono', monospace" }}>{inv.id}</div>
                    <div style={{ fontSize: 10, color: '#9BA69C' }}>{inv.date} · ₹{fmt(inv.amount)}</div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddVendorModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ gstin: '', name: '', email: '', category: '' });
  const { notify } = useNotifications();

  const handleSubmit = async () => {
    try {
      await api.createVendor(form);
      notify('success', `Vendor ${form.name} created`);
      onSaved();
      onClose();
    } catch {
      notify('error', 'Failed to create vendor');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#F1F4EC', borderRadius: 10, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#344838', fontWeight: 700 }}>Add Vendor</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'gstin', label: 'GSTIN', placeholder: '29ABCDE1234F1Z5' },
            { key: 'name', label: 'Business Name', placeholder: 'Vendor Pvt Ltd' },
            { key: 'email', label: 'Email', placeholder: 'accounts@vendor.in' },
            { key: 'category', label: 'Category', placeholder: 'IT Services' },
          ].map(f => (
            <label key={f.key} style={{ fontSize: 12, color: '#9BA69C' }}>
              {f.label}
              <input
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', outline: 'none' }}
              />
            </label>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={handleSubmit} style={{ flex: 1, padding: '9px', borderRadius: 6, border: 'none', background: '#366B4E', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Create Vendor</button>
            <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 6, border: '1px solid #B7C9B7', background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.getVendors().then(setVendors).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.gstin.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #C8D8C8', background: '#F1F4EC', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9BA69C', fontSize: 13 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors, GSTIN…"
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', outline: 'none' }} />
        </div>
        <span style={{ fontSize: 12, color: '#9BA69C', marginLeft: 'auto' }}>{filtered.length} vendors</span>
        <button onClick={() => setShowAdd(true)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#366B4E', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Vendor
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? <LoadingRows rows={7} /> : filtered.length === 0 ? <EmptyState icon="⬡" title="No vendors found" /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#E3EDE1', zIndex: 1 }}>
              <tr>
                {['Vendor', 'GSTIN', 'Category', 'Risk', 'Invoices', 'Last Audit', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: '#9BA69C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #C8D8C8', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, idx) => (
                <tr key={v.gstin} style={{ borderBottom: '1px solid #E3EDE1', background: idx % 2 ? 'rgba(0,0,0,0.015)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setSelected(v)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(54,107,78,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = idx % 2 ? 'rgba(0,0,0,0.015)' : 'transparent'; }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: '#344838' }}>{v.name}</td>
                  <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#71A09A' }}>{v.gstin}</td>
                  <td style={{ padding: '9px 12px', color: '#9BA69C', fontSize: 12 }}>{v.category}</td>
                  <td style={{ padding: '9px 12px' }}><RiskBar score={v.risk_score} /></td>
                  <td style={{ padding: '9px 12px', color: '#344838' }}>{v.invoice_count}</td>
                  <td style={{ padding: '9px 12px', color: '#9BA69C', fontSize: 12 }}>{v.last_audit}</td>
                  <td style={{ padding: '9px 12px' }}><StatusBadge status={v.status} /></td>
                  <td style={{ padding: '9px 12px' }}>
                    <button onClick={e => { e.stopPropagation(); setSelected(v); }} style={{ fontSize: 11, color: '#71A09A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && <VendorPanel vendor={selected} onClose={() => setSelected(null)} onUpdate={load} />}
      {showAdd && <AddVendorModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}
