import type { Severity } from '../types';

const config: Record<Severity, { bg: string; color: string; label: string }> = {
  LOW:  { bg: 'rgba(113,160,154,0.15)', color: '#71A09A', label: 'LOW' },
  MED:  { bg: 'rgba(83,119,143,0.15)',  color: '#53778F', label: 'MED' },
  HIGH: { bg: 'rgba(213,161,95,0.18)',  color: '#D5A15F', label: 'HIGH' },
  CRIT: { bg: 'rgba(168,106,103,0.18)', color: '#A86A67', label: 'CRIT' },
};

interface Props { severity: Severity | null; small?: boolean; }

export default function SeverityBadge({ severity, small = false }: Props) {
  if (!severity) return <span style={{ color: '#9BA69C', fontSize: small ? 10 : 11 }}>—</span>;
  const c = config[severity];
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: small ? '1px 6px' : '2px 8px',
      borderRadius: 4,
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.05em',
    }}>
      {c.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string }> = {
    pending:    { bg: 'rgba(155,166,156,0.2)', color: '#9BA69C' },
    processing: { bg: 'rgba(83,119,143,0.15)', color: '#53778F' },
    audited:    { bg: 'rgba(54,107,78,0.15)',  color: '#366B4E' },
    exception:  { bg: 'rgba(168,106,103,0.15)', color: '#A86A67' },
    overridden: { bg: 'rgba(213,161,95,0.15)',  color: '#D5A15F' },
    active:     { bg: 'rgba(54,107,78,0.15)',  color: '#366B4E' },
    flagged:    { bg: 'rgba(213,161,95,0.15)',  color: '#D5A15F' },
    suspended:  { bg: 'rgba(168,106,103,0.15)', color: '#A86A67' },
    healthy:    { bg: 'rgba(54,107,78,0.15)',  color: '#366B4E' },
    degraded:   { bg: 'rgba(213,161,95,0.15)',  color: '#D5A15F' },
    down:       { bg: 'rgba(168,106,103,0.15)', color: '#A86A67' },
  };
  const c = config[status] || { bg: 'rgba(155,166,156,0.2)', color: '#9BA69C' };
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}
