import { useState, useEffect, useCallback } from 'react';
import { sprintService } from '../services/sprintService';
import { Sprint } from '../types';

export const useSprints = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSprints = useCallback(async () => {
    try {
      const data = await sprintService.getSprints();
      setSprints(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch sprints:', err);
      setError('Failed to load sprints');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSprints();

    // 5-second polling sync logic as per AGENTS.md
    const interval = setInterval(fetchSprints, 5000);

    return () => clearInterval(interval);
  }, [fetchSprints]);

  return { sprints, loading, error, refetch: fetchSprints };
};
