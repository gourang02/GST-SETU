import { useEffect, useState } from 'react';
import type { DashboardStats, Invoice, Page } from '../types';
import * as api from '../api/endpoints';
import { useAuditLogWebSocket } from '../hooks/useWebSocket';
import StatsCard from '../components/StatsCard';
import AgentWorkflow from '../components/AgentWorkflow';
import ActivityLog from '../components/ActivityLog';
import SeverityBadge, { StatusBadge } from '../components/SeverityBadge';
import { LoadingCenter } from '../components/LoadingState';

const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n));
const fmtCr = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${fmt(n)}`;
};

interface Props {
  onNavigate: (page: Page, id?: string) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { logs, status: wsStatus } = useAuditLogWebSocket();

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getInvoices()])
      .then(([s, inv]) => { setStats(s); setInvoices(inv); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter message="Loading dashboard…" />;

  const exceptions = invoices.filter(i => i.status === 'exception' || i.severity === 'CRIT' || i.severity === 'HIGH');

  return (
    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', height: '100%' }}>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        <StatsCard label="Total Invoices" value={fmt(stats?.total_invoices || 0)} sub="this period" />
        <StatsCard label="Audited" value={fmt(stats?.audited || 0)} accent="#366B4E" sub={`${Math.round((stats?.audited || 0) / (stats?.total_invoices || 1) * 100)}% complete`} />
        <StatsCard label="Exceptions" value={fmt(stats?.exceptions || 0)} accent="#A86A67" trend={{ direction: 'down', value: '12%', good: true }} />
        <StatsCard label="Pending" value={fmt(stats?.pending || 0)} accent="#D5A15F" />
        <StatsCard label="Total Liability" value={fmtCr(stats?.total_liability || 0)} accent="#344838" />
        <StatsCard label="GST Saved" value={fmtCr(stats?.savings || 0)} accent="#71A09A" trend={{ direction: 'up', value: '8.4%', good: true }} />
      </div>

      {/* Middle Row: Agent workflow + Liability */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
        <AgentWorkflow extractorCount={stats?.processing || 12} reconcilerCount={8} filerCount={3} activeStage="reconciler" />

        {/* Liability comparison */}
        <div style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#344838', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Liability Δ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Original', value: stats?.total_liability || 0, color: '#9BA69C' },
              { label: 'Adjusted', value: stats?.adjusted_liability || 0, color: '#366B4E' },
              { label: 'Variance', value: (stats?.total_liability || 0) - (stats?.adjusted_liability || 0), color: '#71A09A' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#9BA69C' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtCr(row.value)}
                  </span>
                </div>
                {row.label !== 'Variance' && (
                  <div style={{ height: 4, background: '#E3EDE1', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: row.color,
                      width: row.label === 'Adjusted'
                        ? `${Math.round((row.value / (stats?.total_liability || 1)) * 100)}%`
                        : '100%',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '8px 10px', background: 'rgba(113,160,154,0.12)', borderRadius: 6, border: '1px solid rgba(113,160,154,0.3)' }}>
            <div style={{ fontSize: 10, color: '#9BA69C', marginBottom: 2 }}>Confidence Avg.</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#366B4E', fontFamily: "'JetBrains Mono', monospace" }}>
              {stats?.confidence_avg?.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Exceptions + Activity Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 12, flex: 1 }}>

        {/* Exceptions table */}
        <div style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #C8D8C8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#344838', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Audit Exceptions
            </span>
            <button
              onClick={() => onNavigate('invoices')}
              style={{ fontSize: 11, color: '#71A09A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              View All →
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#E3EDE1' }}>
                  {['Invoice', 'Vendor', 'Amount', 'Severity', 'Confidence', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: '#9BA69C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exceptions.slice(0, 6).map((inv, idx) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #E3EDE1', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#366B4E' }}>
                      <button onClick={() => onNavigate('invoice-detail', inv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#366B4E', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}>
                        {inv.id}
                      </button>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#344838', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.vendor_name}</td>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#344838' }}>₹{fmt(inv.amount)}</td>
                    <td style={{ padding: '8px 12px' }}><SeverityBadge severity={inv.severity} /></td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, height: 3, background: '#E3EDE1', borderRadius: 2 }}>
                          <div style={{ height: '100%', background: inv.confidence > 90 ? '#71A09A' : inv.confidence > 75 ? '#D5A15F' : '#A86A67', width: `${inv.confidence}%`, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#9BA69C', fontFamily: "'JetBrains Mono', monospace" }}>{inv.confidence.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}><StatusBadge status={inv.status} /></td>
                    <td style={{ padding: '8px 12px' }}>
                      <button onClick={() => onNavigate('invoice-detail', inv.id)} style={{ fontSize: 11, color: '#71A09A', background: 'none', border: 'none', cursor: 'pointer' }}>Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity log */}
        <ActivityLog logs={logs} wsStatus={wsStatus} maxHeight={320} />
      </div>
    </div>
  );
}
