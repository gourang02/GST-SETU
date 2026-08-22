interface Props { icon?: string; title: string; description?: string; action?: { label: string; onClick: () => void }; }

export default function EmptyState({ icon = '○', title, description, action }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 60, textAlign: 'center' }}>
      <span style={{ fontSize: 36, color: '#B7C9B7' }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#344838' }}>{title}</p>
        {description && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9BA69C' }}>{description}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} style={{
          marginTop: 4, padding: '7px 16px', borderRadius: 6, border: 'none',
          background: '#366B4E', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
