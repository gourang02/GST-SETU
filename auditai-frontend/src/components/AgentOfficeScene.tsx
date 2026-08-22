import { useState, useEffect } from 'react';

/* ─── Stage definition ─── */
type Stage = 0 | 1 | 2 | 3 | 4; // 0=idle, 1=agent1, 2=agent2, 3=agent3, 4=done

interface AgentOfficeSceneProps {
  stage: Stage;
  fileName?: string;
}

/* ─── Pixel character (CSS only) ─── */
function PixelPerson({ color, facing, typing }: { color: string; facing?: 'front' | 'back'; typing?: boolean }) {
  const isFront = facing === 'front';
  return (
    <div className="pixel-person" style={{ position: 'relative', width: 32, height: 48 }}>
      {/* Head */}
      <div style={{
        width: 18, height: 18, borderRadius: isFront ? '50% 50% 45% 45%' : '45% 45% 50% 50%',
        background: '#F5D0A9', border: '2px solid #D4A574',
        position: 'absolute', top: 0, left: 7,
      }}>
        {/* Hair */}
        <div style={{
          position: 'absolute', top: isFront ? -2 : -1, left: -2, right: -2, height: 8,
          background: '#4A3728', borderRadius: '6px 6px 0 0',
        }} />
        {isFront && (
          <>
            {/* Eyes */}
            <div style={{ position: 'absolute', top: 8, left: 3, width: 3, height: 3, background: '#2C1810', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: 8, left: 10, width: 3, height: 3, background: '#2C1810', borderRadius: '50%' }} />
          </>
        )}
      </div>
      {/* Body */}
      <div style={{
        width: 22, height: 18, background: color, borderRadius: '4px 4px 2px 2px',
        position: 'absolute', top: 18, left: 5, border: `2px solid ${color}88`,
      }} />
      {/* Arms */}
      <div className={typing ? 'typing-arms' : ''} style={{
        position: 'absolute', top: 22, left: 0, width: 6, height: 12,
        background: color, borderRadius: 3, border: `1px solid ${color}88`,
        transformOrigin: 'top center',
      }} />
      <div className={typing ? 'typing-arms-r' : ''} style={{
        position: 'absolute', top: 22, right: 0, width: 6, height: 12,
        background: color, borderRadius: 3, border: `1px solid ${color}88`,
        transformOrigin: 'top center',
      }} />
      {/* Legs */}
      <div style={{ position: 'absolute', bottom: 0, left: 8, width: 6, height: 10, background: '#3D4F5F', borderRadius: '0 0 3px 3px' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 8, width: 6, height: 10, background: '#3D4F5F', borderRadius: '0 0 3px 3px' }} />
    </div>
  );
}

/* ─── Desk with monitor ─── */
function Desk({ children, monitor, screenColor }: { children: React.ReactNode; monitor?: boolean; screenColor?: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {children}
      {/* Desk surface */}
      <div style={{
        width: 80, height: 24, background: 'linear-gradient(135deg, #8B6914 0%, #A0782C 50%, #8B6914 100%)',
        borderRadius: '3px 3px 0 0', border: '2px solid #6B4E0F', position: 'relative',
        boxShadow: '0 4px 0 #5A3E0A',
        marginTop: -4,
      }}>
        {monitor && (
          <div style={{
            position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
            width: 36, height: 28, background: '#2C2C2C', borderRadius: 3,
            border: '2px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 30, height: 20, borderRadius: 2,
              background: screenColor || '#1a3a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', fontSize: 6, color: '#4ade80', fontFamily: 'monospace',
            }}>
              <div className="screen-text">{'>'}_</div>
            </div>
            {/* Monitor stand */}
            <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 8, height: 6, background: '#2C2C2C' }} />
          </div>
        )}
        {/* Items on desk */}
        <div style={{ position: 'absolute', top: 2, right: 4, width: 10, height: 6, background: '#E8E0D0', borderRadius: 1, border: '1px solid #C8B89C' }} />
        <div style={{ position: 'absolute', top: 3, left: 4, width: 6, height: 8, background: '#4A7A5A', borderRadius: 1, border: '1px solid #3A6A4A' }} />
      </div>
      {/* Desk legs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: 72 }}>
        <div style={{ width: 4, height: 16, background: '#6B4E0F', borderRadius: '0 0 2px 2px' }} />
        <div style={{ width: 4, height: 16, background: '#6B4E0F', borderRadius: '0 0 2px 2px' }} />
      </div>
    </div>
  );
}

/* ─── Speech Bubble ─── */
function SpeechBubble({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div className={`speech-bubble ${visible ? 'speech-visible' : 'speech-hidden'}`} style={{
      position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
      background: '#fff', border: '2px solid #344838', borderRadius: 8,
      padding: '4px 10px', fontSize: 10, fontWeight: 600, color: '#344838',
      whiteSpace: 'nowrap', zIndex: 10, fontFamily: "'DM Sans', sans-serif",
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      opacity: visible ? 1 : 0, transition: 'all 0.4s ease',
    }}>
      {text}
      {/* Tail */}
      <div style={{
        position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
        borderTop: '7px solid #344838',
      }} />
      <div style={{
        position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
        borderTop: '6px solid #fff',
      }} />
    </div>
  );
}

/* ─── Agent Name Tag ─── */
function AgentTag({ name, icon, active }: { name: string; icon: string; active: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: active ? '#366B4E' : '#344838',
      color: '#fff', padding: '3px 8px', borderRadius: 10,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.03em',
      boxShadow: active ? '0 0 12px rgba(54,107,78,0.5)' : 'none',
      transition: 'all 0.4s ease',
    }}>
      <span style={{ fontSize: 10 }}>{icon}</span> {name}
    </div>
  );
}

/* ─── Main Office Scene ─── */
export default function AgentOfficeScene({ stage, fileName }: AgentOfficeSceneProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const orchestratorMsg = stage === 0 ? 'Awaiting invoice…'
    : stage === 1 ? `Dispatching to Agent 1${dots}`
    : stage === 2 ? `Awaiting Agent 2${dots}`
    : stage === 3 ? `Awaiting Agent 3${dots}`
    : '✅ Audit Complete!';

  const agent1Msg = stage === 0 ? 'Idle.'
    : stage === 1 ? `Scanning invoice${dots}`
    : stage >= 2 ? '✅ Extracted!' : 'Idle.';

  const agent2Msg = stage <= 1 ? 'Idle.'
    : stage === 2 ? `Running query${dots}`
    : stage >= 3 ? '✅ Reconciled!' : 'Idle.';

  const agent3Msg = stage <= 2 ? 'Idle.'
    : stage === 3 ? `Checking rules${dots}`
    : stage === 4 ? '✅ Compliant!' : 'Idle.';

  return (
    <div className="office-scene" style={{
      background: 'linear-gradient(180deg, #7A9A7E 0%, #8BAA8E 30%, #9CB99E 100%)',
      borderRadius: 10, padding: '16px 10px 10px', position: 'relative',
      border: '3px solid #5A7A5E', overflow: 'hidden',
      imageRendering: 'pixelated',
    }}>
      {/* Room background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px), repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px)',
      }} />

      {/* Wall with shelf */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(180deg, #C4A882 0%, #D4B892 100%)',
        borderBottom: '4px solid #8B6914',
      }}>
        {/* Shelf */}
        <div style={{
          position: 'absolute', top: 8, left: 12, width: 50, height: 4,
          background: '#8B6914', borderRadius: 2, boxShadow: '0 2px 0 #6B4E0F',
        }}>
          <div style={{ position: 'absolute', top: -8, left: 4, width: 8, height: 8, background: '#2E7D32', borderRadius: 2 }} />
          <div style={{ position: 'absolute', top: -10, left: 16, width: 6, height: 10, background: '#1565C0', borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: -8, left: 26, width: 6, height: 8, background: '#C62828', borderRadius: 1 }} />
        </div>
        {/* Clock */}
        <div style={{
          position: 'absolute', top: 6, right: 14, width: 16, height: 16,
          background: '#fff', borderRadius: '50%', border: '2px solid #6B4E0F',
        }}>
          <div style={{ position: 'absolute', top: 6, left: 7, width: 2, height: 5, background: '#333', transformOrigin: 'bottom center', transform: 'rotate(30deg)' }} />
          <div style={{ position: 'absolute', top: 4, left: 7, width: 2, height: 4, background: '#333', transformOrigin: 'bottom center', transform: 'rotate(-60deg)' }} />
        </div>
        {/* Window */}
        <div style={{
          position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
          width: 40, height: 24, background: '#87CEEB', borderRadius: 3,
          border: '3px solid #8B6914', boxShadow: 'inset 0 0 10px rgba(255,255,255,0.3)',
        }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', width: 2, height: '100%', background: '#8B6914' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 2, background: '#8B6914' }} />
        </div>
      </div>

      {/* Floor tile pattern */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
        background: 'repeating-conic-gradient(#8FAF8F 0% 25%, #82A282 0% 50%) 0 0 / 24px 24px',
        opacity: 0.6,
      }} />

      {/* ─── Orchestrator (top center) ─── */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 6, zIndex: 5, marginTop: 28 }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SpeechBubble text={orchestratorMsg} visible={stage >= 0} />
          <AgentTag name="Orchestrator" icon="👩‍💼" active={stage > 0 && stage < 4} />
          <div style={{ marginTop: 4 }}>
            <Desk monitor screenColor={stage > 0 ? '#0a2a4a' : '#1a3a1a'}>
              <PixelPerson color="#2C3E6B" facing="front" typing={stage > 0 && stage < 4} />
            </Desk>
          </div>
        </div>
      </div>

      {/* ─── Three Agents (bottom row) ─── */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
        position: 'relative', zIndex: 5, marginTop: 4, paddingBottom: 6,
      }}>
        {/* Agent 1 - Vision OCR */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SpeechBubble text={agent1Msg} visible />
          <AgentTag name="Agent 1" icon="🔍" active={stage === 1} />
          <div style={{ marginTop: 4 }}>
            <Desk monitor screenColor={stage === 1 ? '#1a4a1a' : stage > 1 ? '#0a3a0a' : '#1a1a1a'}>
              <PixelPerson color="#2E7D32" facing="back" typing={stage === 1} />
            </Desk>
          </div>
          <div style={{ fontSize: 7, color: '#E3EDE1', marginTop: 2, fontWeight: 600, letterSpacing: '0.05em' }}>VISION OCR</div>
        </div>

        {/* Agent 2 - Ledger */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SpeechBubble text={agent2Msg} visible />
          <AgentTag name="Agent 2" icon="🗄️" active={stage === 2} />
          <div style={{ marginTop: 4 }}>
            <Desk monitor screenColor={stage === 2 ? '#1a1a4a' : stage > 2 ? '#0a3a0a' : '#1a1a1a'}>
              <PixelPerson color="#6A1B9A" facing="back" typing={stage === 2} />
            </Desk>
          </div>
          <div style={{ fontSize: 7, color: '#E3EDE1', marginTop: 2, fontWeight: 600, letterSpacing: '0.05em' }}>LEDGER</div>
        </div>

        {/* Agent 3 - Tax */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SpeechBubble text={agent3Msg} visible />
          <AgentTag name="Agent 3" icon="⚖️" active={stage === 3} />
          <div style={{ marginTop: 4 }}>
            <Desk monitor screenColor={stage === 3 ? '#4a3a0a' : stage > 3 ? '#0a3a0a' : '#1a1a1a'}>
              <PixelPerson color="#BF6C00" facing="back" typing={stage === 3} />
            </Desk>
          </div>
          <div style={{ fontSize: 7, color: '#E3EDE1', marginTop: 2, fontWeight: 600, letterSpacing: '0.05em' }}>TAX RULES</div>
        </div>
      </div>

      {/* Pipeline connector lines */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }}>
        {/* Lines from orchestrator to each agent */}
        <line x1="50%" y1="52%" x2="18%" y2="62%" stroke={stage >= 1 ? '#4ade80' : '#5A7A5E'} strokeWidth={stage >= 1 ? 2 : 1} strokeDasharray={stage >= 1 ? 'none' : '4,4'} opacity={0.6} />
        <line x1="50%" y1="52%" x2="50%" y2="62%" stroke={stage >= 2 ? '#4ade80' : '#5A7A5E'} strokeWidth={stage >= 2 ? 2 : 1} strokeDasharray={stage >= 2 ? 'none' : '4,4'} opacity={0.6} />
        <line x1="50%" y1="52%" x2="82%" y2="62%" stroke={stage >= 3 ? '#4ade80' : '#5A7A5E'} strokeWidth={stage >= 3 ? 2 : 1} strokeDasharray={stage >= 3 ? 'none' : '4,4'} opacity={0.6} />
      </svg>

      {/* File name indicator */}
      {fileName && (
        <div style={{
          position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(52,72,56,0.8)', color: '#B7C9B7', padding: '2px 10px',
          borderRadius: 4, fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
          maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          📎 {fileName}
        </div>
      )}

      {/* Stage 4: completion overlay */}
      {stage === 4 && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(54,107,78,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 10, zIndex: 20,
        }}>
          <div className="completion-badge" style={{
            background: '#366B4E', color: '#fff', padding: '8px 20px',
            borderRadius: 20, fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(54,107,78,0.5)',
            border: '2px solid #4ade80',
          }}>
            ✅ AI Audit Complete!
          </div>
        </div>
      )}
    </div>
  );
}
