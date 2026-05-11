import { useState, useEffect, useCallback } from 'react';
import { userStoryService } from '../services/userStoryService';
import { UserStory } from '../types';

export const useUserStories = (featureId?: string, sprintId?: string) => {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStories = useCallback(async () => {
    try {
      const data = await userStoryService.getUserStories(featureId, sprintId);
      setUserStories(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user stories:', err);
      setError('Failed to load user stories');
    } finally {
      setLoading(false);
    }
  }, [featureId, sprintId]);

  useEffect(() => {
    fetchUserStories();

    // 5-second polling sync logic as per AGENTS.md
    const interval = setInterval(fetchUserStories, 5000);

    return () => clearInterval(interval);
  }, [fetchUserStories]);

  return { userStories, loading, error, refetch: fetchUserStories };
};
