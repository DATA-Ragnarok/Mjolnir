import { useState, useEffect, useCallback } from 'react';
import { Feature, Status, UserStory } from '../types';
import { featureService } from '../services/featureService';
import { userStoryService } from '../services/userStoryService';

type UseFeatureFormProps = {
  feature?: Feature;
  onClose: () => void;
  onSubmit: () => void;
  initialEpicId?: string;
};

export const useFeatureForm = ({ feature, onClose, onSubmit, initialEpicId }: UseFeatureFormProps) => {
  const [title, setTitle] = useState(feature?.title || '');
  const [description, setDescription] = useState(feature?.description || '');
  const [status, setStatus] = useState<Status>(feature?.status || 'To Do');
  const [epicId, setEpicId] = useState(feature?.epicId || initialEpicId || '');
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStories = useCallback(async (featureId: string, silent = false) => {
    if (!silent) {
      setIsLoadingStories(true);
      setError(null);
    }
    
    try {
      // Assuming userStoryService has a getStories method that takes filters
      const data = await userStoryService.getUserStories(featureId);
      setUserStories(data);
    } catch (err: unknown) {
      console.error('Failed to fetch user stories:', err);
      if (!silent) setError('Failed to load user stories.');
    } finally {
      setIsLoadingStories(false);
    }
  }, []);

  useEffect(() => {
    if (feature?._id) {
      fetchUserStories(feature._id);
      
      const interval = setInterval(() => fetchUserStories(feature._id, true), 5000);
      return () => clearInterval(interval);
    }
  }, [feature?._id, fetchUserStories]);

  const isDirty = title !== (feature?.title || '') || 
                  description !== (feature?.description || '') || 
                  status !== (feature?.status || 'To Do') ||
                  epicId !== (feature?.epicId || initialEpicId || '');

  const handleSubmit = async (e?: React.FormEvent, shouldClose = true) => {
    if (e) e.preventDefault();
    if (!title.trim() || !epicId) return false;

    setIsSubmitting(true);
    setError(null);
    try {
      if (feature) {
        await featureService.updateFeature(feature._id, { title, description, status, epicId });
      } else {
        await featureService.createFeature({ title, description, status, epicId });
      }
      onSubmit();
      if (shouldClose) onClose();
      return true;
    } catch (err: unknown) {
      console.error('Failed to save feature:', err);
      let message = 'Failed to save feature. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        message = axiosError.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!feature) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await featureService.deleteFeature(feature._id);
      onSubmit();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to delete feature:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete feature. It might have user stories linked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    epicId,
    setEpicId,
    userStories,
    isSubmitting,
    isLoadingStories,
    isEditingTitle,
    setIsEditingTitle,
    isDirty,
    error,
    handleSubmit,
    handleDelete
  };
};
