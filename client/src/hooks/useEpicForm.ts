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

  const fetchFeatures = useCallback(async (epicId: string, silent = false) => {
    if (!silent) {
      setIsLoadingFeatures(true);
    }
    
    try {
      const data = await featureService.getFeatures(epicId);
      setFeatures(data);
    } catch (error) {
      console.error('Failed to fetch features:', error);
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
    try {
      if (epic) {
        await epicService.updateEpic(epic._id, { title, description, status });
      } else {
        await epicService.createEpic({ title, description, status });
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to save epic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!epic || !window.confirm('Are you sure you want to delete this epic?')) return;
    
    setIsSubmitting(true);
    try {
      await epicService.deleteEpic(epic._id);
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to delete epic:', error);
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
    handleSubmit,
    handleDelete
  };
};
