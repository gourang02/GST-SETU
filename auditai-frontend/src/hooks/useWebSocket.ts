import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE } from '../api/client';
import type { ActivityLogEntry } from '../types';
import { mockActivity } from '../api/mock';

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useAuditLogWebSocket() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>(mockActivity);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      setStatus('connecting');
      const ws = new WebSocket(`${WS_BASE}/ws/audit-logs`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setStatus('connected');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const entry: ActivityLogEntry = JSON.parse(event.data);
          setLogs(prev => [entry, ...prev].slice(0, 100));
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus('disconnected');
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setStatus('error');
        ws.close();
      };
    } catch {
      setStatus('error');
      reconnectTimer.current = setTimeout(connect, 8000);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  return { logs, status };
}
