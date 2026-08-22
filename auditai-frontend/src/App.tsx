import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuditLogWebSocket } from './hooks/useWebSocket';
import type { Page } from './types';

import Notifications from './components/Notifications';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { LoadingCenter } from './components/LoadingState';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Vendors from './pages/Vendors';
import KnowledgeBase from './pages/KnowledgeBase';
import Ledgers from './pages/Ledgers';
import BankTransactions from './pages/BankTransactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function AppShell() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [pageId, setPageId] = useState<string | undefined>(undefined);
  const { status: wsStatus } = useAuditLogWebSocket();

  const navigate = (p: Page, id?: string) => {
    setPage(p);
    setPageId(id);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E3EDE1' }}>
        <LoadingCenter message="Initialising AuditAI…" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'invoices':
      case 'invoice-detail':
        return <Invoices onNavigate={navigate} initialId={page === 'invoice-detail' ? pageId : undefined} />;
      case 'vendors':
      case 'vendor-detail':
        return <Vendors />;
      case 'knowledge-base':
        return <KnowledgeBase />;
      case 'ledgers':
        return <Ledgers />;
      case 'bank-transactions':
        return <BankTransactions />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#E3EDE1' }}>
      <Sidebar current={page} onNavigate={navigate} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Header page={page} wsStatus={wsStatus} />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderPage()}
        </main>
      </div>
      <Notifications />
    </div>
  );
}

import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#E3EDE1', color: '#344838', fontFamily: 'sans-serif', padding: 20 }}>
          <h2 style={{ fontSize: 24, marginBottom: 10 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#A86A67', marginBottom: 20 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ padding: '10px 20px', background: '#366B4E', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

