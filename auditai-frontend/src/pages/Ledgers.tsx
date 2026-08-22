import { useEffect, useState, useCallback } from 'react';
import type { Ledger } from '../types';
import * as api from '../api/endpoints';
import { useNotifications } from '../contexts/NotificationContext';
import { LoadingRows } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

function AddLedgerModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', type: 'Asset', account_code: '', balance: '' });
  const { notify } = useNotifications();

  const handleSubmit = async () => {
    if (!form.name || !form.account_code) { notify('error', 'Name and account code are required'); return; }
    try {
      await api.createLedger({ ...form, balance: parseFloat(form.balance) || 0, currency: 'INR' });
      notify('success', `Ledger "${form.name}" created`);
      onSaved();
      onClose();
    } catch {
      notify('error', 'Failed to create ledger');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#F1F4EC', borderRadius: 10, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#344838', fontWeight: 700 }}>Add Ledger</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'name', label: 'Ledger Name', placeholder: 'GST Input Tax Credit' },
            { key: 'account_code', label: 'Account Code', placeholder: '1401' },
            { key: 'balance', label: 'Opening Balance (₹)', placeholder: '0' },
          ].map(f => (
            <label key={f.key} style={{ fontSize: 12, color: '#9BA69C' }}>
              {f.label}
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', outline: 'none' }} />
            </label>
          ))}
          <label style={{ fontSize: 12, color: '#9BA69C' }}>
            Type
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838' }}>
              {['Asset', 'Liability', 'Equity', 'Income', 'Expense'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={handleSubmit} style={{ flex: 1, padding: '9px', borderRadius: 6, border: 'none', background: '#366B4E', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Create</button>
            <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 6, border: '1px solid #B7C9B7', background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Ledgers() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getLedgers().then(setLedgers).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const assets = ledgers.filter(l => l.type === 'Asset');
  const liabilities = ledgers.filter(l => l.type === 'Liability');
  const totalAssets = assets.reduce((s, l) => s + l.balance, 0);
  const totalLiab = liabilities.reduce((s, l) => s + l.balance, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #C8D8C8', background: '#F1F4EC', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#344838' }}>Ledger Accounts</div>
          <div style={{ fontSize: 11, color: '#9BA69C' }}>{ledgers.length} accounts · INR</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 6, border: 'none', background: '#366B4E', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Ledger
        </button>
      </div>

      {/* Summary */}
      {!loading && ledgers.length > 0 && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #C8D8C8', display: 'flex', gap: 12 }}>
          {[
            { label: 'Total Assets', value: totalAssets, color: '#366B4E' },
            { label: 'Total Liabilities', value: totalLiab, color: '#A86A67' },
            { label: 'Net Position', value: totalAssets - totalLiab, color: (totalAssets - totalLiab) >= 0 ? '#71A09A' : '#A86A67' },
          ].map(s => (
            <div key={s.label} style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 6, padding: '10px 14px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#9BA69C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>₹{fmt(s.value)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? <LoadingRows rows={5} /> : ledgers.length === 0 ? <EmptyState icon="≡" title="No ledgers yet" action={{ label: '+ Add Ledger', onClick: () => setShowAdd(true) }} /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 16 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#E3EDE1', zIndex: 1 }}>
              <tr>
                {['Code', 'Ledger Name', 'Type', 'Balance (INR)', 'Last Updated'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: '#9BA69C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #C8D8C8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledgers.map((l, idx) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #E3EDE1', background: idx % 2 ? 'rgba(0,0,0,0.015)' : 'transparent' }}>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#71A09A' }}>{l.account_code}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#344838' }}>{l.name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: l.type === 'Asset' ? 'rgba(54,107,78,0.12)' : l.type === 'Liability' ? 'rgba(168,106,103,0.12)' : 'rgba(83,119,143,0.12)',
                      color: l.type === 'Asset' ? '#366B4E' : l.type === 'Liability' ? '#A86A67' : '#53778F',
                    }}>{l.type}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: l.type === 'Liability' ? '#A86A67' : '#344838' }}>
                    ₹{fmt(l.balance)}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#9BA69C', fontSize: 12 }}>{l.last_updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddLedgerModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}
