interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  trend?: { direction: 'up' | 'down'; value: string; good?: boolean };
}

export default function StatsCard({ label, value, sub, accent = '#366B4E', trend }: Props) {
  return (
    <div style={{
      background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 11, color: '#9BA69C', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {sub && <span style={{ fontSize: 11, color: '#9BA69C' }}>{sub}</span>}
        {trend && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: (trend.direction === 'up') === (trend.good !== false) ? '#71A09A' : '#A86A67',
            background: (trend.direction === 'up') === (trend.good !== false)
              ? 'rgba(113,160,154,0.15)' : 'rgba(168,106,103,0.15)',
            padding: '1px 5px', borderRadius: 3,
          }}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
