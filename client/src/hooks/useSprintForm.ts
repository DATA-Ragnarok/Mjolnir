import { useState } from 'react';
import { Sprint } from '../types';
import { sprintService } from '../services/sprintService';

type UseSprintFormProps = {
  sprint?: Sprint;
  onClose: () => void;
  onSubmit: () => void;
};

export const useSprintForm = ({ sprint, onClose, onSubmit }: UseSprintFormProps) => {
  const [name, setName] = useState(sprint?.name || '');
  const [startDate, setStartDate] = useState(sprint?.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(sprint?.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = name !== (sprint?.name || '') || 
                  startDate !== (sprint?.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '') ||
                  endDate !== (sprint?.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !startDate || !endDate) {
      setError('All fields are required.');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const data = { name, startDate, endDate };

      if (sprint) {
        await sprintService.updateSprint(sprint._id, data);
      } else {
        await sprintService.createSprint(data);
      }
      onSubmit();
      onClose();
      return true;
    } catch (err: unknown) {
      console.error('Failed to save sprint:', err);
      let message = 'Failed to save sprint. Please try again.';
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
    if (!sprint) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await sprintService.deleteSprint(sprint._id);
      onSubmit();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to delete sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete sprint. It might have user stories linked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isSubmitting,
    isDirty,
    error,
    handleSubmit,
    handleDelete
  };
};
