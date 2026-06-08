import { useState, useEffect, useCallback } from 'react';
import { featureService } from '../services/featureService';
import { FeatureWithProgress } from '../types';

export const useFeatures = (epicId?: string) => {
  const [features, setFeatures] = useState<FeatureWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    try {
      const data = await featureService.getFeatures(epicId);
      setFeatures(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch features:', err);
      setError('Failed to load features');
    } finally {
      setLoading(false);
    }
  }, [epicId]);

  useEffect(() => {
    fetchFeatures();

    // 5-second polling sync logic as per AGENTS.md
    const interval = setInterval(fetchFeatures, 5000);

    return () => clearInterval(interval);
  }, [fetchFeatures]);

  return { features, loading, error, refetch: fetchFeatures };
};
