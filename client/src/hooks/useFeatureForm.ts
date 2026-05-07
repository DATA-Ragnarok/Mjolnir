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

  const fetchUserStories = useCallback(async (featureId: string, silent = false) => {
    if (!silent) {
      setIsLoadingStories(true);
    }
    
    try {
      // Assuming userStoryService has a getStories method that takes filters
      const data = await userStoryService.getUserStories(featureId);
      setUserStories(data);
    } catch (error) {
      console.error('Failed to fetch user stories:', error);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !epicId) return;

    setIsSubmitting(true);
    try {
      if (feature) {
        await featureService.updateFeature(feature._id, { title, description, status, epicId });
      } else {
        await featureService.createFeature({ title, description, status, epicId });
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to save feature:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!feature || !window.confirm('Are you sure you want to delete this feature?')) return;
    
    setIsSubmitting(true);
    try {
      await featureService.deleteFeature(feature._id);
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to delete feature:', error);
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
    handleSubmit,
    handleDelete
  };
};
