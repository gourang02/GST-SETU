import { useState } from 'react';
import * as api from '../api/endpoints';
import { useNotifications } from '../contexts/NotificationContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const reports = [
  { id: 'gst-summary', label: 'GST Liability Summary', description: 'Monthly GST input/output summary with ITC computation and net liability', icon: '▦' },
  { id: 'audit-exceptions', label: 'Audit Exceptions Report', description: 'All flagged invoices grouped by severity with recommended actions', icon: '⚠' },
  { id: 'vendor-risk', label: 'Vendor Risk Analysis', description: 'Risk scoring and compliance history for all registered vendors', icon: '⬡' },
  { id: 'itc-reconciliation', label: 'ITC Reconciliation', description: 'GSTR-2B vs books reconciliation showing matched and unmatched ITC claims', icon: '⊕' },
  { id: 'liability-delta', label: 'Liability Δ Report', description: 'Original vs AI-adjusted liability comparison across all audited invoices', icon: '△' },
  { id: 'full-audit-trail', label: 'Full Audit Trail Export', description: 'Complete chronological audit log with agent actions and user overrides', icon: '≡' },
];

export default function Reports() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { notify } = useNotifications();

  const handleExport = async (reportId: string) => {
    setDownloading(reportId);
    try {
      const url = api.getReportsExportUrl();
      window.open(`${url}?type=${reportId}`, '_blank');
      notify('success', 'Report export initiated');
    } catch {
      notify('error', 'Export failed. Check your connection.');
    } finally {
      setTimeout(() => setDownloading(null), 1500);
    }
  };

  const monthlyAuditData = [
    { month: 'Jul', audited: 86, flagged: 14 },
    { month: 'Aug', audited: 112, flagged: 19 },
    { month: 'Sep', audited: 128, flagged: 16 },
    { month: 'Oct', audited: 142, flagged: 23 },
    { month: 'Nov', audited: 158, flagged: 18 },
  ];

  return (
    <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#344838' }}>Reports & Exports</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#9BA69C' }}>Generate and download compliance reports for the current audit period.</p>
      </div>

      <div style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#344838', marginBottom: 2 }}>Audit volume</div>
        <div style={{ fontSize: 11, color: '#9BA69C', marginBottom: 10 }}>Audited vs flagged invoices by month</div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyAuditData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #C8D8C8', fontSize: 11 }} />
              <Bar dataKey="audited" fill="#366B4E" radius={[3, 3, 0, 0]} />
              <Bar dataKey="flagged" fill="#D5A15F" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {reports.map(r => (
          <div key={r.id} style={{
            background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 20,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8, background: '#E3EDE1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#71A09A', flexShrink: 0,
              }}>
                {r.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#344838', marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: '#9BA69C', lineHeight: 1.5 }}>{r.description}</div>
              </div>
            </div>
            <button
              onClick={() => handleExport(r.id)}
              disabled={downloading === r.id}
              style={{
                width: '100%', padding: '9px', borderRadius: 6, border: 'none',
                background: downloading === r.id ? '#B7C9B7' : '#366B4E',
                color: '#fff', fontWeight: 600, cursor: downloading === r.id ? 'wait' : 'pointer',
                fontSize: 13, transition: 'background 0.15s ease',
              }}
            >
              {downloading === r.id ? 'Generating…' : '↓ Export PDF'}
            </button>
          </div>
        ))}
      </div>

      {/* Period selector */}
      <div style={{ marginTop: 24, background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#344838', marginBottom: 12 }}>Export Settings</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Period', options: ['Oct–Dec 2024 (Q3)', 'Jul–Sep 2024 (Q2)', 'Apr–Jun 2024 (Q1)', 'FY 2024–25'] },
            { label: 'Format', options: ['PDF', 'Excel (XLSX)', 'CSV'] },
            { label: 'Scope', options: ['All Vendors', 'Flagged Only', 'CRIT + HIGH'] },
          ].map(f => (
            <label key={f.label} style={{ fontSize: 12, color: '#9BA69C', flex: 1, minWidth: 180 }}>
              {f.label}
              <select style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #B7C9B7', background: '#E3EDE1', fontSize: 13, color: '#344838', cursor: 'pointer' }}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
