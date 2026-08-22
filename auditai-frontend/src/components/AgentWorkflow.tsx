interface AgentNode {
  id: string;
  label: string;
  description: string;
  status: 'idle' | 'active' | 'complete' | 'error';
  count?: number;
}

interface Props {
  extractorCount?: number;
  reconcilerCount?: number;
  filerCount?: number;
  activeStage?: 'extractor' | 'reconciler' | 'filer' | null;
}

const statusColors = {
  idle: { bg: '#B7C9B7', dot: '#9BA69C', text: '#6b7f6b' },
  active: { bg: 'rgba(54,107,78,0.15)', dot: '#71A09A', text: '#366B4E' },
  complete: { bg: 'rgba(54,107,78,0.1)', dot: '#366B4E', text: '#344838' },
  error: { bg: 'rgba(168,106,103,0.15)', dot: '#A86A67', text: '#A86A67' },
};

function AgentNode({ label, description, status, count }: AgentNode) {
  const c = statusColors[status];
  return (
    <div style={{
      background: '#F1F4EC',
      border: `1px solid ${status === 'active' ? '#71A09A' : '#C8D8C8'}`,
      borderRadius: 8,
      padding: '12px 14px',
      flex: 1,
      position: 'relative',
      boxShadow: status === 'active' ? '0 0 0 2px rgba(113,160,154,0.3)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: c.dot,
            boxShadow: status === 'active' ? `0 0 8px ${c.dot}` : 'none',
            animation: status === 'active' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#344838' }}>{label}</span>
        </div>
        {count !== undefined && (
          <span style={{
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            background: c.bg, color: c.text, padding: '1px 7px', borderRadius: 4, fontWeight: 600,
          }}>{count}</span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#9BA69C', lineHeight: 1.4 }}>{description}</p>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          fontSize: 10, color: c.text, background: c.bg,
          padding: '1px 6px', borderRadius: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{status}</span>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingTop: 8, flexShrink: 0, color: '#B7C9B7', fontSize: 18 }}>
      →
    </div>
  );
}

export default function AgentWorkflow({ extractorCount = 12, reconcilerCount = 8, filerCount = 3, activeStage }: Props) {
  return (
    <div style={{
      background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 8, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#344838', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          AI Audit Pipeline
        </span>
        <span style={{ fontSize: 10, color: '#9BA69C', fontFamily: "'JetBrains Mono', monospace" }}>
          Real-time agent status
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AgentNode
          id="extractor"
          label="Extractor"
          description="OCR & structured data extraction from invoice PDFs/images"
          status={activeStage === 'extractor' ? 'active' : 'complete'}
          count={extractorCount}
        />
        <Arrow />
        <AgentNode
          id="reconciler"
          label="Reconciler"
          description="GST rule validation, GSTR-2B cross-reference & exception flagging"
          status={activeStage === 'reconciler' ? 'active' : activeStage === 'filer' ? 'complete' : 'idle'}
          count={reconcilerCount}
        />
        <Arrow />
        <AgentNode
          id="filer"
          label="Filer"
          description="ITC computation, liability adjustment & compliance filing"
          status={activeStage === 'filer' ? 'active' : 'idle'}
          count={filerCount}
        />
      </div>
    </div>
  );
}
