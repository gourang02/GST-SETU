import type { Page } from '../types';
import type React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Building2, Scale, BookOpen, Landmark, BarChart3, Settings2, LogOut } from 'lucide-react';

const navItems: { id: Page; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'knowledge-base', label: 'Rules', icon: Scale },
  { id: 'ledgers', label: 'Ledgers', icon: BookOpen },
  { id: 'bank-transactions', label: 'Bank', icon: Landmark },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'AI Config', icon: Settings2 },
];

interface Props {
  current: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ current, onNavigate }: Props) {
  const { user, logout } = useAuth();

  return (
    <aside style={{
      width: 200,
      minWidth: 200,
      background: '#344838',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: '#366B4E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, color: '#B7C9B7', fontWeight: 700,
          }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F4EC', letterSpacing: '-0.01em' }}>AuditAI</div>
            <div style={{ fontSize: 10, color: '#71A09A', marginTop: -1, fontFamily: "'JetBrains Mono', monospace" }}>GST · v2.4</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 10, color: '#5a7060', fontWeight: 700, letterSpacing: '0.08em', padding: '6px 8px 4px', textTransform: 'uppercase' }}>
          Navigation
        </div>
        {navItems.map(item => {
          const active = current === item.id || (current === 'invoice-detail' && item.id === 'invoices') || (current === 'vendor-detail' && item.id === 'vendors');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 6, border: 'none',
                background: active ? '#366B4E' : 'transparent',
                color: active ? '#F1F4EC' : '#9BA69C',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <item.icon size={15} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#366B4E', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#B7C9B7', flexShrink: 0,
          }}>
            {user?.name.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, color: '#E3EDE1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: '#71A09A', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '6px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#9BA69C', cursor: 'pointer', fontSize: 12,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(168,106,103,0.2)'; (e.currentTarget as HTMLElement).style.color = '#A86A67'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9BA69C'; }}
        >
          <><LogOut size={13} /> Sign Out</>
        </button>
      </div>
    </aside>
  );
}
