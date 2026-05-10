import { useState, useEffect, useCallback } from 'react';
import { Epic, Status, Feature } from '../types';
import { epicService } from '../services/epicService';
import { featureService } from '../services/featureService';

type UseEpicFormProps = {
  epic?: Epic;
  onClose: () => void;
  onSubmit: () => void;
};

export const useEpicForm = ({ epic, onClose, onSubmit }: UseEpicFormProps) => {
  const [title, setTitle] = useState(epic?.title || '');
  const [description, setDescription] = useState(epic?.description || '');
  const [status, setStatus] = useState<Status>(epic?.status || 'To Do');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async (epicId: string, silent = false) => {
    if (!silent) {
      setIsLoadingFeatures(true);
      setError(null);
    }
    
    try {
      const data = await featureService.getFeatures(epicId);
      setFeatures(data);
    } catch (err: any) {
      console.error('Failed to fetch features:', err);
      if (!silent) setError('Failed to load child features.');
    } finally {
      setIsLoadingFeatures(false);
    }
  }, []);

  useEffect(() => {
    if (epic?._id) {
      fetchFeatures(epic._id);
      
      const interval = setInterval(() => fetchFeatures(epic._id, true), 5000);
      return () => clearInterval(interval);
    }
  }, [epic?._id, fetchFeatures]);

  const isDirty = title !== (epic?.title || '') || 
                  description !== (epic?.description || '') || 
                  status !== (epic?.status || 'To Do');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      if (epic) {
        await epicService.updateEpic(epic._id, { title, description, status });
      } else {
        await epicService.createEpic({ title, description, status });
      }
      onSubmit();
      onClose();
    } catch (err: any) {
      console.error('Failed to save epic:', err);
      setError(err.response?.data?.message || 'Failed to save epic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!epic) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await epicService.deleteEpic(epic._id);
      onSubmit();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete epic:', err);
      setError('Failed to delete epic. It might have child features linked.');
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
    features,
    isSubmitting,
    isLoadingFeatures,
    isEditingTitle,
    setIsEditingTitle,
    isDirty,
    error,
    handleSubmit,
    handleDelete
  };
};
