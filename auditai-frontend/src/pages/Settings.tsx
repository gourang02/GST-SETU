import { useEffect, useState } from 'react';
import type { AIConfig } from '../types';
import * as api from '../api/endpoints';
import { useNotifications } from '../contexts/NotificationContext';
import { LoadingCenter } from '../components/LoadingState';

const MODELS = ['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5-20251001', 'claude-fable-5'];

export default function Settings() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [draft, setDraft] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify } = useNotifications();

  useEffect(() => {
    api.getAIConfig().then(c => { setConfig(c); setDraft(c); }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await api.updateAIConfig(draft);
      setConfig(updated);
      setDraft(updated);
      notify('success', 'AI configuration saved');
    } catch {
      notify('error', 'Save failed. Check your permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => { if (config) setDraft({ ...config }); };

  if (loading) return <LoadingCenter message="Loading AI configuration…" />;
  if (!draft) return null;

  const changed = JSON.stringify(draft) !== JSON.stringify(config);

  return (
    <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#344838' }}>AI Engine Configuration</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#9BA69C' }}>Configure the AI audit engine parameters. Changes affect all future audit runs.</p>
          </div>
          {changed && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReset} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #B7C9B7', background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 12 }}>
                Reset
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: saving ? '#B7C9B7' : '#366B4E', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <section style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#344838', marginBottom: 14 }}>Model</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {MODELS.map(m => (
              <button key={m} onClick={() => setDraft(p => p ? { ...p, model: m } : p)}
                style={{
                  padding: '10px 14px', borderRadius: 6, textAlign: 'left',
                  border: draft.model === m ? '2px solid #366B4E' : '1px solid #C8D8C8',
                  background: draft.model === m ? 'rgba(54,107,78,0.08)' : '#E3EDE1',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#344838', fontFamily: "'JetBrains Mono', monospace" }}>{m}</div>
                {draft.model === m && <div style={{ fontSize: 10, color: '#71A09A', marginTop: 2, fontWeight: 600 }}>← Active</div>}
              </button>
            ))}
          </div>
        </section>

        {/* Thresholds */}
        <section style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#344838', marginBottom: 14 }}>Thresholds</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'confidence_threshold', label: 'Confidence Threshold', min: 50, max: 100, step: 1, unit: '%', desc: 'Minimum confidence score required before auto-filing an invoice' },
              { key: 'flag_threshold', label: 'Flag Threshold', min: 40, max: 95, step: 1, unit: '%', desc: 'Confidence above which anomalies are promoted to audit flags' },
              { key: 'crit_threshold', label: 'CRIT Escalation Threshold', min: 75, max: 100, step: 1, unit: '%', desc: 'Confidence above which flags are escalated to CRIT severity' },
              { key: 'temperature', label: 'Model Temperature', min: 0, max: 1, step: 0.05, unit: '', desc: 'Lower = more deterministic; higher = more exploratory reasoning' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#344838' }}>{f.label}</label>
                  <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: '#366B4E', fontWeight: 700 }}>
                    {(draft as any)[f.key]}{f.unit}
                  </span>
                </div>
                <input type="range" min={f.min} max={f.max} step={f.step}
                  value={(draft as any)[f.key]}
                  onChange={e => setDraft(p => p ? { ...p, [f.key]: parseFloat(e.target.value) } : p)}
                  style={{ width: '100%', accentColor: '#366B4E', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 11, color: '#9BA69C', marginTop: 2 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Toggles */}
        <section style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#344838', marginBottom: 14 }}>Behaviour</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'auto_audit', label: 'Auto-audit on Upload', desc: 'Automatically trigger AI audit when a new invoice is uploaded' },
              { key: 'gst_validation_strict', label: 'Strict GST Validation', desc: 'Apply conservative CBIC interpretations during HSN classification' },
            ].map(t => (
              <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#344838' }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#9BA69C', marginTop: 2 }}>{t.desc}</div>
                </div>
                <button
                  onClick={() => setDraft(p => p ? { ...p, [t.key]: !(p as any)[t.key] } : p)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: (draft as any)[t.key] ? '#366B4E' : '#B7C9B7',
                    position: 'relative', transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: (draft as any)[t.key] ? 23 : 3,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Max Retries */}
        <section style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#344838', marginBottom: 10 }}>Max Retries</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setDraft(p => p ? { ...p, max_retries: n } : p)}
                style={{
                  width: 40, height: 40, borderRadius: 6, border: 'none',
                  background: draft.max_retries === n ? '#366B4E' : '#E3EDE1',
                  color: draft.max_retries === n ? '#fff' : '#344838',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700,
                }}>{n}</button>
            ))}
            <span style={{ fontSize: 12, color: '#9BA69C', marginLeft: 4 }}>retries before escalating to human review</span>
          </div>
        </section>

        {changed && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(213,161,95,0.12)', borderRadius: 6, border: '1px solid rgba(213,161,95,0.4)' }}>
            <span style={{ fontSize: 12, color: '#D5A15F', fontWeight: 600 }}>⚠ Unsaved changes — click Save Changes to apply</span>
          </div>
        )}
      </div>
    </div>
  );
}
