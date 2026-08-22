import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('priya@example.com');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#E3EDE1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Background pattern */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'rgba(54,107,78,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, borderRadius: '50%', background: 'rgba(113,160,154,0.08)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Card */}
        <div style={{ background: '#F1F4EC', border: '1px solid #C8D8C8', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
          {/* Header */}
          <div style={{ background: '#366B4E', padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#B7C9B7',
              }}>A</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#F1F4EC', letterSpacing: '-0.02em' }}>AuditAI</div>
                <div style={{ fontSize: 11, color: '#71A09A', fontFamily: "'JetBrains Mono', monospace" }}>GST Compliance Platform · v2.4.1</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#B7C9B7', lineHeight: 1.5 }}>
              AI-powered invoice auditing and GST compliance for enterprise finance teams.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#344838', marginBottom: 2 }}>Sign In</div>

            {error && (
              <div style={{ padding: '9px 12px', background: 'rgba(168,106,103,0.12)', border: '1px solid rgba(168,106,103,0.3)', borderRadius: 6, fontSize: 12, color: '#A86A67' }}>
                {error}
              </div>
            )}

            <label style={{ fontSize: 12, color: '#9BA69C', fontWeight: 500 }}>
              Email
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{
                  display: 'block', marginTop: 5, width: '100%', padding: '10px 13px',
                  borderRadius: 7, border: '1px solid #B7C9B7', background: '#E3EDE1',
                  fontSize: 14, color: '#344838', outline: 'none', transition: 'border 0.15s ease',
                }}
                onFocus={e => { (e.target as HTMLElement).style.borderColor = '#366B4E'; }}
                onBlur={e => { (e.target as HTMLElement).style.borderColor = '#B7C9B7'; }}
              />
            </label>

            <label style={{ fontSize: 12, color: '#9BA69C', fontWeight: 500 }}>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  display: 'block', marginTop: 5, width: '100%', padding: '10px 13px',
                  borderRadius: 7, border: '1px solid #B7C9B7', background: '#E3EDE1',
                  fontSize: 14, color: '#344838', outline: 'none', transition: 'border 0.15s ease',
                }}
                onFocus={e => { (e.target as HTMLElement).style.borderColor = '#366B4E'; }}
                onBlur={e => { (e.target as HTMLElement).style.borderColor = '#B7C9B7'; }}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4, padding: '11px', borderRadius: 7, border: 'none',
                background: loading ? '#B7C9B7' : '#366B4E',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'background 0.15s ease',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#2a5440'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#366B4E'; }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#B7C9B7', paddingTop: 4 }}>
              Demo: any email & password will work
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#9BA69C' }}>
          AuditAI GST Compliance · CBIC Compliant · SOC 2 Type II
        </div>
      </div>
    </div>
  );
}
