import { useState, useEffect } from 'react';
import { UserStory, UserStoryStatus, User, Sprint, Feature, Epic } from '../types';
import { userStoryService } from '../services/userStoryService';
import { userService } from '../services/userService';
import { sprintService } from '../services/sprintService';
import { featureService } from '../services/featureService';
import { epicService } from '../services/epicService';

type UseUserStoryFormProps = {
  userStory?: UserStory;
  onClose: () => void;
  onSubmit: () => void;
  initialFeatureId?: string;
  initialSprintId?: string;
};

export const useUserStoryForm = ({ 
  userStory, 
  onClose, 
  onSubmit, 
  initialFeatureId, 
  initialSprintId 
}: UseUserStoryFormProps) => {
  const [title, setTitle] = useState(userStory?.title || '');
  const [description, setDescription] = useState(userStory?.description || '');
  const [status, setStatus] = useState<UserStoryStatus>(userStory?.status || 'To Do');
  const [storyPoints, setStoryPoints] = useState<number>(userStory?.storyPoints || 1);
  const [featureId, setFeatureId] = useState(userStory?.featureId || initialFeatureId || '');
  const [sprintId, setSprintId] = useState(userStory?.sprintId || initialSprintId || '');
  // assignedUser can be either a user id string (from select) or a populated User object
  // Keep assignedUser in the form as a user id string for consistency when submitting
  const [assignedUser, setAssignedUser] = useState<string>(() => {
    if (!userStory?.assignedUser) return '';
    return typeof userStory.assignedUser === 'string' ? userStory.assignedUser : (userStory.assignedUser as any)._id || (userStory.assignedUser as any).id || '';
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const [usersData, sprintsData, epicsData] = await Promise.all([
          userService.getApprovedUsers(),
          sprintService.getSprints(),
          epicService.getEpics()
        ]);
        setUsers(usersData);
        setSprints(sprintsData);
        setEpics(epicsData);
        
        if (featureId) {
          const featuresData = await featureService.getFeatures(); // Simplified, maybe should filter by Epic if we had epicId
          setFeatures(featuresData);
        } else {
           const featuresData = await featureService.getFeatures();
           setFeatures(featuresData);
        }
      } catch (err: unknown) {
        console.error('Failed to fetch metadata:', err);
        setError('Failed to load form data.');
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [featureId]);

  const isDirty = title !== (userStory?.title || '') || 
                  description !== (userStory?.description || '') || 
                  status !== (userStory?.status || 'To Do') ||
                  storyPoints !== (userStory?.storyPoints || 0) ||
                  featureId !== (userStory?.featureId || initialFeatureId || '') ||
                  sprintId !== (userStory?.sprintId || initialSprintId || '') ||
                  assignedUser !== (userStory?.assignedUser || null);
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !featureId) {
      setError('Title and Feature are required.');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const data = { 
        title, 
        description, 
        status, 
        storyPoints, 
        featureId, 
        sprintId: sprintId || undefined, 
        assignedUser
      };

      if (userStory) {
        await userStoryService.updateUserStory(userStory._id, data);
      } else {
        await userStoryService.createUserStory(data);
      }
      onSubmit();
      onClose();
      return true;
    } catch (err: unknown) {
      console.error('Failed to save user story:', err);
      let message = 'Failed to save user story. Please try again.';
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
    if (!userStory) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await userStoryService.deleteUserStory(userStory._id);
      onSubmit();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to delete user story:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user story.');
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
    storyPoints,
    setStoryPoints,
    featureId,
    setFeatureId,
    sprintId,
    setSprintId,
    assignedUser,
    setAssignedUser,
    users,
    sprints,
    features,
    epics,
    isSubmitting,
    isLoadingMetadata,
    isEditingTitle,
    setIsEditingTitle,
    isDirty,
    error,
    handleSubmit,
    handleDelete
  };
};
