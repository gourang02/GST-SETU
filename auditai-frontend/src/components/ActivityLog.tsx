import type { ActivityLogEntry } from '../types';

const severityConfig = {
  info:    { color: '#53778F', bg: 'rgba(83,119,143,0.1)', symbol: 'ℹ' },
  success: { color: '#366B4E', bg: 'rgba(54,107,78,0.1)', symbol: '✓' },
  warning: { color: '#D5A15F', bg: 'rgba(213,161,95,0.12)', symbol: '△' },
  error:   { color: '#A86A67', bg: 'rgba(168,106,103,0.12)', symbol: '⚠' },
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface Props {
  logs: ActivityLogEntry[];
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  maxHeight?: number;
}

export default function ActivityLog({ logs, wsStatus, maxHeight = 280 }: Props) {
  const wsColor = wsStatus === 'connected' ? '#71A09A' : wsStatus === 'connecting' ? '#D5A15F' : '#9BA69C';

  return (
    <div style={{ background: '#344838', borderRadius: 8, overflow: 'hidden', border: '1px solid #2a3d30' }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#B7C9B7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Audit Log Stream
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', background: wsColor,
            animation: wsStatus === 'connected' ? 'blink 1.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 10, color: '#71A09A', fontFamily: "'JetBrains Mono', monospace" }}>
            {wsStatus === 'connected' ? 'LIVE' : wsStatus.toUpperCase()}
          </span>
        </div>
      </div>
      <div style={{
        maxHeight, overflowY: 'auto', padding: '8px 0',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {logs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#5a7060', fontSize: 12 }}>
            No activity yet
          </div>
        ) : (
          logs.map(log => {
            const s = severityConfig[log.severity || 'info'];
            return (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '6px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ color: s.color, fontSize: 11, flexShrink: 0, marginTop: 1 }}>{s.symbol}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: '#5a7060', marginBottom: 2 }}>
                    {formatTime(log.timestamp)}
                    {log.stage && <span style={{ color: '#71A09A', marginLeft: 8 }}>[{log.stage}]</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#B7C9B7', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {log.event}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
