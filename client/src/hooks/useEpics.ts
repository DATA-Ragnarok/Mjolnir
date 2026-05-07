import { useState, useEffect, useCallback } from 'react';
import { epicService, EpicWithProgress } from '../services/epicService';

export const useEpics = () => {
  const [epics, setEpics] = useState<EpicWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpics = useCallback(async () => {
    try {
      const data = await epicService.getEpics();
      setEpics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch epics:', err);
      setError('Failed to load epics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEpics();

    // 5-second polling sync logic as per AGENTS.md
    const interval = setInterval(fetchEpics, 5000);

    return () => clearInterval(interval);
  }, [fetchEpics]);

  return { epics, loading, error, refetch: fetchEpics };
};
