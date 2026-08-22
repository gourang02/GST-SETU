import { useEffect, useState } from 'react';
import type { SystemHealth, Page } from '../types';
import * as api from '../api/endpoints';
import { LoadingSpinner } from './LoadingState';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  invoices: 'Invoice Management',
  'invoice-detail': 'Invoice Detail',
  vendors: 'Vendor Registry',
  'vendor-detail': 'Vendor Detail',
  'knowledge-base': 'Audit Rules',
  ledgers: 'Ledgers',
  'bank-transactions': 'Bank Transactions',
  reports: 'Reports',
  settings: 'AI Configuration',
};

import { Menu } from 'lucide-react';

interface Props {
  page: Page;
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onToggleMobileSidebar?: () => void;
}

export default function Header({ page, wsStatus, onToggleMobileSidebar }: Props) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .finally(() => setLoadingHealth(false));
    const interval = setInterval(() => api.getHealth().then(setHealth), 30000);
    return () => clearInterval(interval);
  }, []);

  const wsColor = wsStatus === 'connected' ? '#71A09A' : wsStatus === 'connecting' ? '#D5A15F' : '#A86A67';
  const wsLabel = wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting…' : 'Offline';
  const healthColor = health?.status === 'healthy' ? '#71A09A' : health?.status === 'degraded' ? '#D5A15F' : '#A86A67';

  return (
    <header style={{
      height: 52,
      background: '#366B4E',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      flexShrink: 0,
      borderBottom: '1px solid #2a5440',
    }}>
      {onToggleMobileSidebar && (
        <button
          onClick={onToggleMobileSidebar}
          style={{
            background: 'none', border: 'none', color: '#F1F4EC', cursor: 'pointer',
            padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
      )}

      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F1F4EC', letterSpacing: '-0.01em' }}>
          {pageTitles[page] || 'AuditAI'}
        </h1>
        <div style={{ fontSize: 10, color: '#B7C9B7', marginTop: -1, fontFamily: "'JetBrains Mono', monospace" }}>
          GST Compliance · AI-Powered Audit System
        </div>
      </div>

      {/* Status indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* WS status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: wsColor,
            boxShadow: wsStatus === 'connected' ? `0 0 6px ${wsColor}` : 'none',
            animation: wsStatus === 'connected' ? 'pulse 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, color: '#B7C9B7', fontFamily: "'JetBrains Mono', monospace" }}>
            WS: {wsLabel}
          </span>
        </div>

        {/* System health */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {loadingHealth ? (
            <LoadingSpinner size={12} />
          ) : (
            <>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: healthColor }} />
              <span style={{ fontSize: 11, color: '#B7C9B7', fontFamily: "'JetBrains Mono', monospace" }}>
                SYS: {health?.status ?? 'unknown'} · v{health?.version}
              </span>
            </>
          )}
        </div>

        {/* Date/time */}
        <span style={{ fontSize: 11, color: '#71A09A', fontFamily: "'JetBrains Mono', monospace" }}>
          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </header>
  );
}
