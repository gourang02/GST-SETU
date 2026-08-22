import { useEffect, useState, useCallback } from 'react';
import type { BankTransaction } from '../types';
import * as api from '../api/endpoints';
import { useNotifications } from '../contexts/NotificationContext';
import { LoadingRows } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

function AddTxnModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ date: '', description: '', amount: '', type: 'debit', reference: '' });
  const { notify } = useNotifications();

  const handleSubmit = async () => {
    if (!form.date || !form.description || !form.amount) { notify('error', 'Date, description, and amount are required'); return; }
    try {
      await api.createBankTransaction({ ...form, amount: parseFloat(form.amount), reconciled: false } as any);
      notify('success', 'Transaction added');
      onSaved();
      onClose();
    } catch {
      notify('error', 'Failed to add transaction');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#F1F4EC', borderRadius: 10, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#344838', fontWeight: 700 }}>Add Transaction</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'description', label: 'Description', type: 'text', placeholder: 'Payment — Vendor Name' },
            { key: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '0' },
            { key: 'reference', label: 'Reference / UTR', type: 'text', placeholder: 'NEFT/24318/00441' },
          ].map(f => (
            <label key={f.key} style={{ fontSize: 12, color: '#9BA69C' }}>
              {f.label}
              <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={(f as any).placeholder || ''}
                style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', outline: 'none' }} />
            </label>
          ))}
          <label style={{ fontSize: 12, color: '#9BA69C' }}>
            Type
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838' }}>
              <option value="debit">Debit (Payment)</option>
              <option value="credit">Credit (Receipt)</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={handleSubmit} style={{ flex: 1, padding: '9px', borderRadius: 6, border: 'none', background: '#366B4E', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Add Transaction</button>
            <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 6, border: '1px solid #B7C9B7', background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BankTransactions() {
  const [txns, setTxns] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'reconciled' | 'unreconciled'>('all');

  const load = useCallback(() => {
    setLoading(true);
    api.getBankTransactions().then(setTxns).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = txns.filter(t =>
    filter === 'all' ? true : filter === 'reconciled' ? t.reconciled : !t.reconciled
  );

  const totalCredit = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const unreconciled = txns.filter(t => !t.reconciled).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #C8D8C8', background: '#F1F4EC', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#344838' }}>Bank Transactions</div>
          <div style={{ fontSize: 11, color: '#9BA69C' }}>{txns.length} transactions · {unreconciled} unreconciled</div>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 12, color: '#344838', cursor: 'pointer' }}>
          <option value="all">All Transactions</option>
          <option value="reconciled">Reconciled</option>
          <option value="unreconciled">Unreconciled</option>
        </select>
        <button onClick={() => setShowAdd(true)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#366B4E', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add
        </button>
      </div>

      {/* Summary */}
      {!loading && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #C8D8C8', display: 'flex', gap: 10 }}>
          {[
            { label: 'Total Credits', value: totalCredit, color: '#366B4E' },
            { label: 'Total Debits', value: totalDebit, color: '#A86A67' },
            { label: 'Net Flow', value: totalCredit - totalDebit, color: (totalCredit - totalDebit) >= 0 ? '#71A09A' : '#A86A67' },
            { label: 'Unreconciled', value: unreconciled, color: '#D5A15F', count: true },
          ].map(s => (
            <div key={s.label} style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 6, padding: '8px 12px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#9BA69C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {s.count ? s.value : `₹${fmt(s.value)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? <LoadingRows rows={5} /> : filtered.length === 0 ? <EmptyState icon="⊕" title="No transactions" action={{ label: '+ Add Transaction', onClick: () => setShowAdd(true) }} /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 16 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#E3EDE1', zIndex: 1 }}>
              <tr>
                {['Date', 'Description', 'Reference', 'Type', 'Amount', 'Invoice', 'Reconciled'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: '#9BA69C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #C8D8C8', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #E3EDE1', background: idx % 2 ? 'rgba(0,0,0,0.015)' : 'transparent' }}>
                  <td style={{ padding: '9px 12px', color: '#9BA69C', fontSize: 12 }}>{t.date}</td>
                  <td style={{ padding: '9px 12px', color: '#344838', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                  <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#71A09A' }}>{t.reference}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: t.type === 'credit' ? 'rgba(54,107,78,0.12)' : 'rgba(168,106,103,0.12)',
                      color: t.type === 'credit' ? '#366B4E' : '#A86A67',
                      textTransform: 'uppercase',
                    }}>{t.type}</span>
                  </td>
                  <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: t.type === 'credit' ? '#366B4E' : '#344838' }}>
                    {t.type === 'debit' ? '−' : '+'}₹{fmt(t.amount)}
                  </td>
                  <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#71A09A' }}>{t.invoice_id || '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: t.reconciled ? 'rgba(54,107,78,0.1)' : 'rgba(213,161,95,0.12)',
                      color: t.reconciled ? '#366B4E' : '#D5A15F',
                    }}>{t.reconciled ? 'Reconciled' : 'Pending'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddTxnModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}
