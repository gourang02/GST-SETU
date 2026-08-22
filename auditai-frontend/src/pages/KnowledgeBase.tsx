import { useEffect, useState, useCallback } from 'react';
import type { KnowledgeRule, Severity } from '../types';
import * as api from '../api/endpoints';
import { useNotifications } from '../contexts/NotificationContext';
import SeverityBadge from '../components/SeverityBadge';
import { LoadingRows } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';

function AddRuleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', severity: 'MED' as Severity });
  const { notify } = useNotifications();

  const handleSubmit = async () => {
    if (!form.name || !form.description) { notify('error', 'Name and description are required'); return; }
    try {
      await api.createRule({ ...form, active: true });
      notify('success', `Rule "${form.name}" created`);
      onSaved();
      onClose();
    } catch {
      notify('error', 'Failed to create rule');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#F1F4EC', borderRadius: 10, padding: 28, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#344838', fontWeight: 700 }}>Add Audit Rule</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 12, color: '#9BA69C' }}>
            Rule Name
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="GST Rate Mismatch — HSN Code"
              style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', outline: 'none' }} />
          </label>
          <label style={{ fontSize: 12, color: '#9BA69C' }}>
            Description
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe what this rule detects…"
              style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', outline: 'none', resize: 'vertical' }} />
          </label>
          <label style={{ fontSize: 12, color: '#9BA69C' }}>
            Severity
            <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value as Severity }))}
              style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', cursor: 'pointer' }}>
              {(['LOW', 'MED', 'HIGH', 'CRIT'] as Severity[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={handleSubmit} style={{ flex: 1, padding: '9px', borderRadius: 6, border: 'none', background: '#366B4E', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Create Rule</button>
            <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 6, border: '1px solid #B7C9B7', background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const [rules, setRules] = useState<KnowledgeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { notify } = useNotifications();

  const load = useCallback(() => {
    setLoading(true);
    api.getRules().then(setRules).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRule(id);
      notify('success', 'Rule deleted');
      setDeleteTarget(null);
      load();
    } catch {
      notify('error', 'Delete failed');
      setDeleteTarget(null);
    }
  };

  const sevOrder: Record<Severity, number> = { CRIT: 0, HIGH: 1, MED: 2, LOW: 3 };
  const rulesList = Array.isArray(rules) ? rules : [];
  const sorted = [...rulesList].sort((a, b) => (sevOrder[a?.severity] ?? 99) - (sevOrder[b?.severity] ?? 99));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #C8D8C8', background: '#F1F4EC', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#344838' }}>Audit Rule Library</div>
          <div style={{ fontSize: 11, color: '#9BA69C' }}>{rulesList.length} rules · {rulesList.filter(r => r?.active).length} active</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 6, border: 'none', background: '#366B4E', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Rule
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? <LoadingRows rows={6} /> : sorted.length === 0 ? <EmptyState icon="⚖" title="No rules defined" description="Add audit rules to start flagging GST exceptions" action={{ label: '+ Add Rule', onClick: () => setShowAdd(true) }} /> : (
          sorted.map(rule => (
            <div key={rule.id} style={{
              background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
              opacity: rule.active ? 1 : 0.55,
            }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <SeverityBadge severity={rule.severity} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#344838' }}>{rule.name}</span>
                  <span style={{ fontSize: 10, color: '#9BA69C', fontFamily: "'JetBrains Mono', monospace" }}>{rule.id}</span>
                  {!rule.active && <span style={{ fontSize: 10, color: '#9BA69C', background: '#E3EDE1', padding: '1px 6px', borderRadius: 3 }}>DISABLED</span>}
                </div>
                <div style={{ fontSize: 12, color: '#6b7f6b', lineHeight: 1.5, marginBottom: 6 }}>{rule.description}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#9BA69C' }}>
                  <span>Added {rule.created_at}</span>
                  {rule.match_count !== undefined && <span>· {rule.match_count} matches</span>}
                </div>
              </div>
              <button onClick={() => setDeleteTarget(rule.id)} style={{ color: '#A86A67', background: 'rgba(168,106,103,0.1)', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
      {showAdd && <AddRuleModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {deleteTarget && (
        <ConfirmationDialog
          title="Delete Rule"
          message={`Delete rule ${deleteTarget}? Existing flags referencing this rule will remain but no new flags will be raised.`}
          confirmLabel="Delete Rule"
          dangerous
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
