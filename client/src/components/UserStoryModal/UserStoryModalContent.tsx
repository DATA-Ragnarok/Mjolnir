import React, { useEffect } from 'react';
import { UserStory } from '../../types';
import { Trash2, Clock, User as UserIcon } from 'lucide-react';
import { useUserStoryForm } from '../../hooks/useUserStoryForm';
import { USER_STORY_STATUS_CONFIG } from '../../constants/status';
import { useModal } from '../../hooks/useModal';
import ConfirmModalContent from '../ConfirmModalContent';

// Sub-components
import UserStoryStatusSelect from './UserStoryStatusSelect';
import FeatureSelect from './FeatureSelect';
import SprintSelect from './SprintSelect';
import StoryPointsSelect from './StoryPointsSelect';
import FeatureModalContent from '../FeatureModal/FeatureModalContent';

type UserStoryModalContentProps = {
  onSubmit: () => void;
  userStory?: UserStory;
  initialFeatureId?: string;
  initialSprintId?: string;
};

const UserStoryModalContent: React.FC<UserStoryModalContentProps> = ({ 
  onSubmit, 
  userStory,
  initialFeatureId,
  initialSprintId
}) => {
  const { openModal, setOptions, closeModal } = useModal();
  
  const {
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
    assignedUserId,
    setAssignedUserId,
    users,
    sprints,
    features,
    isSubmitting,
    isLoadingMetadata,
    isEditingTitle,
    setIsEditingTitle,
    isDirty,
    error,
    handleSubmit,
    handleDelete
  } = useUserStoryForm({ userStory, onClose: closeModal, onSubmit, initialFeatureId, initialSprintId });

  const currentStatus = USER_STORY_STATUS_CONFIG[status];

  useEffect(() => {
    setOptions({ ribbonColor: currentStatus.color });
  }, [currentStatus.color, setOptions]);

  const handleGoToFeature = () => {
    const feature = features.find(f => f._id === featureId);
    if (feature) {
      openModal(
        <FeatureModalContent 
          feature={feature}
          onSubmit={onSubmit}
        />,
        { maxWidth: '6xl' }
      );
    }
  };

  const handleOpenDeleteConfirm = () => {
    openModal(
      <ConfirmModalContent
        onConfirm={handleDelete}
        title="Delete User Story"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        confirmText="Delete User Story"
      />,
      { maxWidth: 'md' }
    );
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="px-8 pb-8 pt-2">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">
                User Story
              </span>
              {userStory && (
                <span className="text-gray-400 text-[10px] font-medium tracking-wider uppercase">
                  ID: {userStory._id.slice(-6)}
                </span>
              )}
            </div>
            
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className="text-3xl font-bold text-gray-800 w-full border-b-2 border-indigo-500 focus:outline-none bg-transparent py-1"
                placeholder="Enter story title..."
              />
            ) : (
              <h2 
                onClick={() => setIsEditingTitle(true)}
                className="text-3xl font-bold text-gray-800 cursor-pointer hover:text-indigo-600 transition-colors py-1"
              >
                {title || 'Untitled User Story'}
              </h2>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-700 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <div className="mr-3 p-1 bg-red-100 rounded-full">
                <Trash2 size={14} className="text-red-600" />
              </div>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Description and Main content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex items-center space-x-2 mb-3 text-gray-500">
                  <Clock size={16} />
                  <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest">Description</label>
                </div>
                <textarea
                  id="description"
                  rows={10}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="As a [user], I want to [action] so that [benefit]..."
                  className="w-full border-gray-200 rounded-xl shadow-sm py-4 px-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 leading-relaxed transition-all resize-none bg-gray-50/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StoryPointsSelect value={storyPoints} onChange={setStoryPoints} />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <UserIcon size={16} />
                    <label htmlFor="assignedUser" className="text-xs font-bold uppercase tracking-widest">Assigned To</label>
                  </div>
                  <div className="relative">
                    <select
                      id="assignedUser"
                      value={assignedUserId}
                      onChange={(e) => setAssignedUserId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Metadata */}
            <div className="space-y-8">
              <UserStoryStatusSelect status={status} setStatus={setStatus} />
              
              <FeatureSelect 
                features={features} 
                selectedFeatureId={featureId} 
                onChange={setFeatureId} 
                onGoToFeature={handleGoToFeature}
                loading={isLoadingMetadata}
              />

              <SprintSelect 
                sprints={sprints} 
                selectedSprintId={sprintId} 
                onChange={setSprintId} 
                loading={isLoadingMetadata}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-5 flex flex-row-reverse items-center gap-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting || (!isDirty && !!userStory)}
            className={`flex-none px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 ${
              isSubmitting || (!isDirty && !!userStory) ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          {userStory && (
            <button
              type="button"
              onClick={handleOpenDeleteConfirm}
              disabled={isSubmitting}
              className="mr-auto p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Delete User Story"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserStoryModalContent;
