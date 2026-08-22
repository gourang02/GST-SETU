interface Props { message?: string; rows?: number; }

export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid #B7C9B7`, borderTopColor: '#366B4E',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function LoadingRows({ rows = 5 }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 36, borderRadius: 4, background: '#C8D8C8',
          opacity: 1 - i * 0.1, animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

export function LoadingCenter({ message = 'Loading…' }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 60 }}>
      <LoadingSpinner size={28} />
      <span style={{ color: '#9BA69C', fontSize: 13 }}>{message}</span>
    </div>
  );
}
