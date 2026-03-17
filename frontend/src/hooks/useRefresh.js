import { useState, useEffect, useCallback, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export function useRefresh(onDataReady) {
  const [progress, setProgress] = useState({ pct: 0, text: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const esRef = useRef(null);

  const startRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    setProgress({ pct: 0, text: 'Starting refresh…' });

    // Start SSE listener first
    if (esRef.current) esRef.current.close();
    const es = new EventSource(`${API}/refresh/status`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress({ pct: data.pct || 0, text: data.text || '' });
        if (data.pct >= 100) {
          es.close();
          setIsRefreshing(false);
          // Fetch fresh data
          fetch(`${API}/data`)
            .then((r) => r.json())
            .then((d) => onDataReady && onDataReady(d))
            .catch(() => {});
        }
      } catch {}
    };
    es.onerror = () => { es.close(); setIsRefreshing(false); };

    // Trigger the refresh
    try {
      await fetch(`${API}/refresh`, { method: 'POST' });
    } catch (e) {
      setError(e.message);
      setIsRefreshing(false);
      es.close();
    }
  }, [isRefreshing, onDataReady]);

  useEffect(() => () => esRef.current?.close(), []);

  return { progress, isRefreshing, error, startRefresh };
}

export function useData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/data`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, setData, reload };
}
