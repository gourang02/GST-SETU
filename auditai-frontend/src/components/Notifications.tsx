import { useNotifications } from '../contexts/NotificationContext';

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors = {
  success: { bg: '#344838', border: '#366B4E', icon: '#71A09A' },
  error: { bg: '#3a1e1e', border: '#A86A67', icon: '#A86A67' },
  warning: { bg: '#3a2e1a', border: '#D5A15F', icon: '#D5A15F' },
  info: { bg: '#1e2a3a', border: '#53778F', icon: '#53778F' },
};

export default function Notifications() {
  const { notifications, dismiss } = useNotifications();

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: 360 }}>
      {notifications.map(n => {
        const c = colors[n.type];
        return (
          <div
            key={n.id}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              animation: 'slideIn 0.2s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ color: c.icon, fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>
              {icons[n.type]}
            </span>
            <span style={{ color: '#F1F4EC', fontSize: 13, flex: 1, lineHeight: 1.4 }}>{n.message}</span>
            <button
              onClick={() => dismiss(n.id)}
              style={{ color: '#9BA69C', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}
