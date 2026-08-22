interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  dangerous = false, onConfirm, onCancel,
}: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#F1F4EC', borderRadius: 10, padding: 28, maxWidth: 440, width: '90%',
        border: '1px solid #C8D8C8', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16, color: '#344838', fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7f6b', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 18px', borderRadius: 6, border: '1px solid #B7C9B7',
            background: 'transparent', color: '#344838', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={{
            padding: '8px 18px', borderRadius: 6, border: 'none',
            background: dangerous ? '#A86A67' : '#366B4E',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
